import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  turnoId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const turnoId = body.turnoId;

    if (!turnoId) {
      return NextResponse.json(
        { error: "Falta el ID del turno." },
        { status: 400 }
      );
    }

    const { data: reservasActivas, error: reservaError } = await supabaseAdmin
      .from("reservas")
      .select("id, turno_id, estado")
      .eq("turno_id", turnoId)
      .eq("estado", "pendiente_pago")
      .limit(1);

    if (reservaError) {
      return NextResponse.json(
        {
          error: "No se pudo buscar la reserva pendiente.",
          detalle: reservaError.message,
        },
        { status: 500 }
      );
    }

    const reservaPendiente = reservasActivas?.[0] ?? null;

    if (!reservaPendiente) {
      return NextResponse.json(
        {
          error: "Este turno no tiene una reserva pendiente de pago para confirmar.",
        },
        { status: 400 }
      );
    }

    const { error: updateReservaError } = await supabaseAdmin
      .from("reservas")
      .update({
        estado: "confirmada",
      })
      .eq("id", reservaPendiente.id);

    if (updateReservaError) {
      return NextResponse.json(
        {
          error: "No se pudo confirmar la reserva.",
          detalle: updateReservaError.message,
        },
        { status: 500 }
      );
    }

    const { error: updateTurnoError } = await supabaseAdmin
      .from("turnos")
      .update({
        estado: "confirmado",
        visible_web: false,
        tipo_bloqueo: null,
        observacion_interna: "Pago confirmado manualmente desde agenda admin",
      })
      .eq("id", turnoId);

    if (updateTurnoError) {
      return NextResponse.json(
        {
          error: "La reserva fue confirmada, pero no se pudo actualizar el turno.",
          detalle: updateTurnoError.message,
        },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("pagos")
      .update({
        estado: "approved",
      })
      .eq("reserva_id", reservaPendiente.id)
      .eq("estado", "pending");

    return NextResponse.json({
      ok: true,
      mensaje: "Pago confirmado y turno confirmado correctamente.",
    });
  } catch (error) {
    console.error("Error confirmando pago:", error);

    return NextResponse.json(
      { error: "Error inesperado al confirmar el pago." },
      { status: 500 }
    );
  }
}