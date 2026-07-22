import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const mercadoPagoEnvironment = process.env.MERCADO_PAGO_ENVIRONMENT ?? "test";

if (!accessToken) {
  throw new Error("Falta MERCADO_PAGO_ACCESS_TOKEN en .env.local");
}

const client = new MercadoPagoConfig({
  accessToken,
});

const preference = new Preference(client);

type ReservaParaPago = {
  id: string;
  estado: string;
  monto_reserva: number;
  valor_total_turno: number;
  vence_en: string;
  mercado_pago_preference_id: string | null;
  mercado_pago_init_point: string | null;
  mercado_pago_sandbox_init_point: string | null;
  pacientes: {
    nombre_paciente: string;
    email_contacto: string;
  } | null;
  turnos: {
    fecha: string;
    hora_inicio: string;
    profesionales: {
      nombre: string;
    } | null;
    especialidades: {
      nombre: string;
    } | null;
  } | null;
};

function elegirCheckoutUrl({
  initPoint,
  sandboxInitPoint,
}: {
  initPoint?: string | null;
  sandboxInitPoint?: string | null;
}) {
  if (mercadoPagoEnvironment === "production") {
    return initPoint ?? sandboxInitPoint ?? null;
  }

  return sandboxInitPoint ?? initPoint ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reservaId = String(body.reservaId ?? "").trim();

    if (!reservaId) {
      return NextResponse.json(
        { error: "Falta el ID de la reserva." },
        { status: 400 }
      );
    }

    await supabaseAdmin.rpc("liberar_reservas_vencidas");

    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from("reservas")
      .select(`
        id,
        estado,
        monto_reserva,
        valor_total_turno,
        vence_en,
        mercado_pago_preference_id,
        mercado_pago_init_point,
        mercado_pago_sandbox_init_point,
        pacientes (
          nombre_paciente,
          email_contacto
        ),
        turnos (
          fecha,
          hora_inicio,
          profesionales (
            nombre
          ),
          especialidades (
            nombre
          )
        )
      `)
      .eq("id", reservaId)
      .maybeSingle();

    if (reservaError || !reserva) {
      return NextResponse.json(
        { error: "No encontramos la reserva." },
        { status: 404 }
      );
    }

    const reservaData = reserva as unknown as ReservaParaPago;

    if (reservaData.estado !== "pendiente_pago") {
      return NextResponse.json(
        { error: "La reserva ya no está pendiente de pago." },
        { status: 400 }
      );
    }

    if (new Date(reservaData.vence_en) <= new Date()) {
      return NextResponse.json(
        { error: "La reserva venció. Volvé a elegir un turno." },
        { status: 400 }
      );
    }

    if (!reservaData.pacientes || !reservaData.turnos) {
      return NextResponse.json(
        { error: "La reserva no tiene todos los datos necesarios." },
        { status: 400 }
      );
    }

    const checkoutUrlExistente = elegirCheckoutUrl({
      initPoint: reservaData.mercado_pago_init_point,
      sandboxInitPoint: reservaData.mercado_pago_sandbox_init_point,
    });

    if (reservaData.mercado_pago_preference_id && checkoutUrlExistente) {
      return NextResponse.json({
        checkoutUrl: checkoutUrlExistente,
      });
    }

    const especialidadNombre =
      reservaData.turnos.especialidades?.nombre ?? "Turno";
    const profesionalNombre =
      reservaData.turnos.profesionales?.nombre ?? "Profesional";

    const preferenceResponse = await preference.create({
      body: {
        items: [
          {
            id: reservaData.id,
            title: `Turno ${especialidadNombre} - SupRA Consultorios`,
            description: `${profesionalNombre} - ${reservaData.turnos.fecha} ${reservaData.turnos.hora_inicio.slice(
              0,
              5
            )}`,
            quantity: 1,
            unit_price: reservaData.monto_reserva,
            currency_id: "ARS",
          },
        ],
        payer: {
          name: reservaData.pacientes.nombre_paciente,
          email: reservaData.pacientes.email_contacto,
        },
        external_reference: reservaData.id,
        back_urls: {
          success: `${siteUrl}/pago/exito?reserva_id=${reservaData.id}`,
          pending: `${siteUrl}/pago/pendiente?reserva_id=${reservaData.id}`,
          failure: `${siteUrl}/pago/error?reserva_id=${reservaData.id}`,
        },
        auto_return: "approved",
        statement_descriptor: "SUPRA TURNOS",
        metadata: {
          reserva_id: reservaData.id,
        },
      },
    });

    const initPoint = preferenceResponse.init_point ?? null;
    const sandboxInitPoint = preferenceResponse.sandbox_init_point ?? null;
    const checkoutUrl = elegirCheckoutUrl({
      initPoint,
      sandboxInitPoint,
    });

    if (!preferenceResponse.id || !checkoutUrl) {
      return NextResponse.json(
        { error: "Mercado Pago no devolvió el link de pago." },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("reservas")
      .update({
        mercado_pago_preference_id: preferenceResponse.id,
        mercado_pago_init_point: initPoint,
        mercado_pago_sandbox_init_point: sandboxInitPoint,
        mercado_pago_preference_creada_en: new Date().toISOString(),
      })
      .eq("id", reservaData.id);

    await supabaseAdmin.from("pagos").insert({
      reserva_id: reservaData.id,
      proveedor: "mercado_pago",
      estado_pago: "pending",
      monto_pagado: reservaData.monto_reserva,
      moneda: "ARS",
      mercado_pago_preference_id: preferenceResponse.id,
    });

    return NextResponse.json({
      checkoutUrl,
    });
      } catch (error) {
    console.error("Error creando preferencia Mercado Pago:", error);

    let detalle = "Error desconocido";

    if (error instanceof Error) {
      detalle = error.message;
    } else if (typeof error === "string") {
      detalle = error;
    } else {
      try {
        detalle = JSON.stringify(error);
      } catch {
        detalle = "No se pudo leer el detalle del error.";
      }
    }

    return NextResponse.json(
      {
        error: "No se pudo preparar el pago con Mercado Pago.",
        detalle,
      },
      { status: 500 }
    );
  }
}