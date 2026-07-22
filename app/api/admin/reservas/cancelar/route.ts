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

    const { data: turno, error: turnoError } = await supabaseAdmin
      .from("turnos")
      .select("id, estado, visible_web")
      .eq("id", turnoId)
      .maybeSingle();

    if (turnoError) {
      return NextResponse.json(
        { error: "No se pudo buscar el turno.", detalle: turnoError.message },
        { status: 500 }
      );
    }

    if (!turno) {
      return NextResponse.json(
        { error: "El turno no existe." },
        { status: 404 }
      );
    }

    const { data: reservasActivas, error: reservasError } = await supabaseAdmin
      .from("reservas")
      .select("id, turno_id, estado")
      .eq("turno_id", turnoId)
      .in("estado", ["pendiente_pago", "confirmada"])
      .limit(1);

    if (reservasError) {
      return NextResponse.json(
        {
          error: "No se pudo buscar la reserva activa.",
          detalle: reservasError.message,
        },
        { status: 500 }
      );
    }

    const reservaActiva = reservasActivas?.[0] ?? null;

    if (reservaActiva) {
      const { error: updateReservaError } = await supabaseAdmin
        .from("reservas")
        .update({
          estado: "cancelada",
        })
        .eq("id", reservaActiva.id);

      if (updateReservaError) {
        return NextResponse.json(
          {
            error: "No se pudo cancelar la reserva.",
            detalle: updateReservaError.message,
          },
          { status: 500 }
        );
      }

      await supabaseAdmin
        .from("pagos")
        .update({
          estado: "cancelled",
        })
        .eq("reserva_id", reservaActiva.id)
        .eq("estado", "pending");
    }

    const puedeLiberarTurno =
      turno.estado === "pendiente_pago" ||
      turno.estado === "confirmado" ||
      turno.estado === "cancelado" ||
      turno.estado === "bloqueado";

    if (!reservaActiva && !puedeLiberarTurno) {
      return NextResponse.json(
        {
          error:
            "Este turno no tiene una reserva activa para cancelar y no está en un estado liberable.",
        },
        { status: 400 }
      );
    }

    const { data: turnoLiberado, error: updateTurnoError } = await supabaseAdmin
      .from("turnos")
      .update({
        estado: "disponible",
        visible_web: true,
        tipo_bloqueo: null,
        observacion_interna: reservaActiva
          ? "Reserva cancelada manualmente desde agenda admin"
          : "Turno liberado manualmente desde agenda admin sin reserva activa asociada",
      })
      .eq("id", turnoId)
      .select("id, estado, visible_web")
      .maybeSingle();

    if (updateTurnoError || !turnoLiberado) {
      return NextResponse.json(
        {
          error: "No se pudo liberar el turno.",
          detalle:
            updateTurnoError?.message ?? "El turno no fue actualizado.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: reservaActiva
        ? "Reserva cancelada y turno liberado correctamente."
        : "Turno liberado correctamente. No tenía reserva activa asociada.",
      turno: turnoLiberado,
    });
  } catch (error) {
    console.error("Error cancelando/liberando turno:", error);

    return NextResponse.json(
      { error: "Error inesperado al cancelar o liberar el turno." },
      { status: 500 }
    );
  }
}