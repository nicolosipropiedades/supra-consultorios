import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  turnoId?: string;
  accion?: "bloquear" | "desbloquear";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    const turnoId = body.turnoId;
    const accion = body.accion;

    if (!turnoId) {
      return NextResponse.json(
        { error: "Falta el ID del turno." },
        { status: 400 }
      );
    }

    if (accion !== "bloquear" && accion !== "desbloquear") {
      return NextResponse.json(
        { error: "Acción inválida." },
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
      .select("id, estado")
      .eq("turno_id", turnoId)
      .in("estado", ["pendiente_pago", "confirmada"]);

    if (reservasError) {
      return NextResponse.json(
        {
          error: "No se pudieron validar las reservas del turno.",
          detalle: reservasError.message,
        },
        { status: 500 }
      );
    }

    if (reservasActivas && reservasActivas.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede bloquear o desbloquear un turno con una reserva pendiente o confirmada.",
        },
        { status: 400 }
      );
    }

    if (accion === "bloquear") {
      const { error: updateError } = await supabaseAdmin
        .from("turnos")
        .update({
          estado: "bloqueado",
          visible_web: false,
          tipo_bloqueo: "manual",
          observacion_interna: "Bloqueado manualmente desde agenda admin",
        })
        .eq("id", turnoId);

      if (updateError) {
        return NextResponse.json(
          {
            error: "No se pudo bloquear el turno.",
            detalle: updateError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        mensaje: "Turno bloqueado correctamente.",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("turnos")
      .update({
        estado: "disponible",
        visible_web: true,
        tipo_bloqueo: null,
        observacion_interna: null,
      })
      .eq("id", turnoId);

    if (updateError) {
      return NextResponse.json(
        {
          error: "No se pudo desbloquear el turno.",
          detalle: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Turno desbloqueado correctamente.",
    });
  } catch (error) {
    console.error("Error bloqueando/desbloqueando turno:", error);

    return NextResponse.json(
      { error: "Error inesperado al modificar el turno." },
      { status: 500 }
    );
  }
}