import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Body = {
  turnoId?: string;

  nombrePaciente?: string;
  edadPaciente?: string | number;
  dniPaciente?: string;

  telefonoContacto?: string;
  emailContacto?: string;

  adultoResponsableNombre?: string;
  adultoResponsable?: string;

  adultoResponsableVinculo?: string;
  vinculoAdulto?: string;

  adultoResponsableTelefono?: string;
  telefonoAdulto?: string;

  motivoConsulta?: string;
  comentario?: string;

  aceptoCondiciones?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    const turnoId = body.turnoId;
    const nombrePaciente = body.nombrePaciente?.trim();
    const edadPaciente = Number(body.edadPaciente);

    const dniPaciente = body.dniPaciente?.trim() || null;
    const telefonoContacto = body.telefonoContacto?.trim();
    const emailContacto = body.emailContacto?.trim();

    const adultoResponsable =
      body.adultoResponsableNombre?.trim() ||
      body.adultoResponsable?.trim() ||
      null;

    const vinculoResponsable =
      body.adultoResponsableVinculo?.trim() ||
      body.vinculoAdulto?.trim() ||
      null;

    const telefonoResponsable =
      body.adultoResponsableTelefono?.trim() ||
      body.telefonoAdulto?.trim() ||
      null;

    const comentario =
      body.motivoConsulta?.trim() ||
      body.comentario?.trim() ||
      null;

    const aceptoCondiciones = body.aceptoCondiciones === true;

    if (!turnoId) {
      return NextResponse.json(
        { error: "Falta seleccionar un turno." },
        { status: 400 }
      );
    }

    if (!nombrePaciente) {
      return NextResponse.json(
        { error: "Falta completar el nombre del paciente." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(edadPaciente) || edadPaciente < 0) {
      return NextResponse.json(
        { error: "La edad del paciente no es válida." },
        { status: 400 }
      );
    }

    if (!telefonoContacto) {
      return NextResponse.json(
        { error: "Falta completar el teléfono de contacto." },
        { status: 400 }
      );
    }

    if (!emailContacto) {
      return NextResponse.json(
        { error: "Falta completar el email de contacto." },
        { status: 400 }
      );
    }

    if (!aceptoCondiciones) {
      return NextResponse.json(
        { error: "Tenés que aceptar las condiciones para reservar el turno." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc(
      "crear_reserva_pendiente",
      {
        p_turno_id: turnoId,
        p_nombre_paciente: nombrePaciente,
        p_edad_paciente: edadPaciente,
        p_dni_paciente: dniPaciente,
        p_telefono_contacto: telefonoContacto,
        p_email_contacto: emailContacto,
        p_adulto_responsable: adultoResponsable,
        p_vinculo_responsable: vinculoResponsable,
        p_telefono_responsable: telefonoResponsable,
        p_comentario: comentario,
        p_acepto_condiciones: aceptoCondiciones,
      }
    );

    if (error) {
      console.error("Error RPC crear_reserva_pendiente:", error);

      return NextResponse.json(
        {
          error: "No se pudo crear la reserva.",
          detalle: error.message,
        },
        { status: 500 }
      );
    }

    const resultado = Array.isArray(data) ? data[0] : data;

    const reservaId =
      resultado?.reserva_id ??
      resultado?.reservaId ??
      resultado?.id ??
      resultado;

    const venceEn = resultado?.vence_en ?? resultado?.venceEn ?? null;

    if (!reservaId) {
      return NextResponse.json(
        {
          error: "La reserva se creó, pero no se pudo obtener el ID.",
          detalle: JSON.stringify(data),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reservaId,
      venceEn,
    });
  } catch (error) {
    console.error("Error creando reserva:", error);

    return NextResponse.json(
      {
        error: "Error inesperado al crear la reserva.",
        detalle: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}