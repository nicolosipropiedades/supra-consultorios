import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  profesionalId?: string;
  fecha?: string;
  horaInicio?: string;
  cantidad?: number;
  visibleWeb?: boolean;
};

function normalizarHora(hora: string) {
  if (/^\d{2}:\d{2}$/.test(hora)) {
    return `${hora}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
    return hora;
  }

  return null;
}

function sumarMinutosAHora(hora: string, minutos: number) {
  const [hh, mm] = hora.split(":").map(Number);
  const fecha = new Date(2000, 0, 1, hh, mm + minutos, 0);

  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutosFinales = String(fecha.getMinutes()).padStart(2, "0");

  return `${horas}:${minutosFinales}:00`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;

    const profesionalId = body.profesionalId;
    const fecha = body.fecha;
    const horaInicioNormalizada = body.horaInicio
      ? normalizarHora(body.horaInicio)
      : null;

    const cantidad = Number(body.cantidad ?? 1);
    const visibleWeb = body.visibleWeb ?? true;

    if (!profesionalId) {
      return NextResponse.json(
        { error: "Falta seleccionar profesional." },
        { status: 400 }
      );
    }

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json(
        { error: "La fecha no es válida." },
        { status: 400 }
      );
    }

    if (!horaInicioNormalizada) {
      return NextResponse.json(
        { error: "La hora de inicio no es válida." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
      return NextResponse.json(
        { error: "La cantidad debe ser un número entre 1 y 20." },
        { status: 400 }
      );
    }

    const { data: profesional, error: profesionalError } = await supabaseAdmin
      .from("profesionales")
      .select("id, especialidad_id, activa")
      .eq("id", profesionalId)
      .maybeSingle();

    if (profesionalError || !profesional) {
      return NextResponse.json(
        {
          error: "No se pudo encontrar la profesional.",
          detalle: profesionalError?.message,
        },
        { status: 500 }
      );
    }

    if (!profesional.activa) {
      return NextResponse.json(
        { error: "La profesional seleccionada no está activa." },
        { status: 400 }
      );
    }

    const duracionMinutos = 45;

    const turnosAGenerar = Array.from({ length: cantidad }, (_, index) => {
      const horaInicio = sumarMinutosAHora(
        horaInicioNormalizada,
        index * duracionMinutos
      );

      const horaFin = sumarMinutosAHora(horaInicio, duracionMinutos);

      return {
        profesional_id: profesional.id,
        especialidad_id: profesional.especialidad_id,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: "disponible",
        visible_web: visibleWeb,
      };
    });

    const horasAGenerar = turnosAGenerar.map((turno) => turno.hora_inicio);

    const { data: turnosExistentes, error: existentesError } =
      await supabaseAdmin
        .from("turnos")
        .select("id, hora_inicio")
        .eq("profesional_id", profesional.id)
        .eq("fecha", fecha)
        .in("hora_inicio", horasAGenerar);

    if (existentesError) {
      return NextResponse.json(
        {
          error: "No se pudieron validar turnos existentes.",
          detalle: existentesError.message,
        },
        { status: 500 }
      );
    }

    const horasExistentes = new Set(
      (turnosExistentes ?? []).map((turno) => turno.hora_inicio)
    );

    const turnosNuevos = turnosAGenerar.filter(
      (turno) => !horasExistentes.has(turno.hora_inicio)
    );

    if (turnosNuevos.length === 0) {
      return NextResponse.json(
        {
          error:
            "No se creó ningún turno porque esos horarios ya estaban cargados.",
        },
        { status: 400 }
      );
    }

    const { data: turnosCreados, error: insertError } = await supabaseAdmin
      .from("turnos")
      .insert(turnosNuevos)
      .select("id, fecha, hora_inicio, hora_fin, estado, visible_web");

    if (insertError) {
      return NextResponse.json(
        {
          error: "No se pudieron crear los turnos.",
          detalle: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Se crearon ${turnosCreados?.length ?? 0} turno/s disponible/s.`,
      creados: turnosCreados ?? [],
      omitidos: turnosAGenerar.length - turnosNuevos.length,
    });
  } catch (error) {
    console.error("Error creando turnos:", error);

    return NextResponse.json(
      { error: "Error inesperado al crear turnos." },
      { status: 500 }
    );
  }
}