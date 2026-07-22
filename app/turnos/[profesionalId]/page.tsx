import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profesional = {
  id: string;
  nombre: string;
  email: string;
  especialidades: {
    id: string;
    nombre: string;
    descripcion: string | null;
    duracion_minutos: number;
    valor_turno: number;
    monto_reserva: number;
    saldo_consultorio: number;
  } | null;
};

type Turno = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  visible_web: boolean;
};

function formatearPesos(valor: number) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function formatearFecha(fecha: string) {
  const fechaObj = new Date(`${fecha}T12:00:00-03:00`);

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fechaObj);
}

function formatearHora(hora: string) {
  return hora.slice(0, 5);
}

function turnoCumpleAnticipacion(fecha: string, horaInicio: string) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  const fechaHoraTurno = new Date(`${fecha}T${horaInicio}-03:00`);

  return fechaHoraTurno > limite;
}

export default async function ProfesionalTurnosPage({
  params,
}: {
  params: Promise<{ profesionalId: string }>;
}) {
  const { profesionalId } = await params;

  const { data: profesional, error: profesionalError } = await supabase
    .from("profesionales")
    .select(`
      id,
      nombre,
      email,
      especialidades (
        id,
        nombre,
        descripcion,
        duracion_minutos,
        valor_turno,
        monto_reserva,
        saldo_consultorio
      )
    `)
    .eq("id", profesionalId)
    .eq("activa", true)
    .maybeSingle();

  if (profesionalError || !profesional) {
    notFound();
  }

const profesionalData = profesional as unknown as Profesional;  
const especialidad = profesionalData.especialidades;

  if (!especialidad) {
    notFound();
  }

  const hoy = new Date().toISOString().slice(0, 10);

  const { data: turnos, error: turnosError } = await supabase
    .from("turnos")
    .select("id, fecha, hora_inicio, hora_fin, estado, visible_web")
    .eq("profesional_id", profesionalId)
    .eq("estado", "disponible")
    .eq("visible_web", true)
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  const turnosDisponibles = ((turnos ?? []) as Turno[]).filter((turno) =>
    turnoCumpleAnticipacion(turno.fecha, turno.hora_inicio)
  );

  const turnosPorFecha = turnosDisponibles.reduce<Record<string, Turno[]>>(
    (acumulador, turno) => {
      if (!acumulador[turno.fecha]) {
        acumulador[turno.fecha] = [];
      }

      acumulador[turno.fecha].push(turno);
      return acumulador;
    },
    {}
  );

  const fechas = Object.keys(turnosPorFecha);

  const { data: centro } = await supabase
  .from("centro_configuracion")
  .select("whatsapp")
  .eq("activo", true)
  .limit(1)
  .maybeSingle();

const whatsappConsultorio = centro?.whatsapp?.replace(/\D/g, "") ?? "1131515331";

const whatsappConsultaUrl = `https://wa.me/549${whatsappConsultorio}?text=${encodeURIComponent(
  `Hola, quisiera consultar disponibilidad de turnos para ${especialidad.nombre} con ${profesionalData.nombre} en SupRA Consultorios.`
)}`;

  return (
<main className="min-h-screen bg-[var(--supra-bg)] px-6 py-8 text-[var(--supra-text)]">      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/turnos"
            className="mb-6 inline-block text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Volver a profesionales
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {especialidad.nombre}
          </p>

          <h1 className="mb-4 text-4xl font-bold">{profesionalData.nombre}</h1>

          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Seleccioná un turno disponible. Para confirmarlo debes abonar el
            valor total de la consulta de forma online.
          </p>
        </div>

<div className="mb-8 rounded-[1.5rem] border border-[var(--supra-border)] bg-[var(--supra-yellow-soft)] p-5 shadow-sm">  <p className="text-sm leading-6 text-[var(--supra-text)]">
    Los turnos online deben reservarse con al menos 24 horas de
    anticipación. Para consultas del día,{" "}
    <a
      href={whatsappConsultaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-slate-900 underline underline-offset-4"
    >
      comunicate por WhatsApp
    </a>{" "}
    con la coordinación.
  </p>
</div>

        {turnosError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            Error al cargar turnos: {turnosError.message}
          </div>
        )}

        {!turnosError && fechas.length === 0 && (
          <div className="rounded-[1.5rem] border border-[var(--supra-border)] bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold">
              No hay turnos publicados por el momento
            </h2>

            <p className="mb-5 text-slate-600">
              Podés consultar disponibilidad o turnos cercanos escribiendo a la
              coordinación.
            </p>

            <a
              href="https://wa.me/5491131515331?text=Hola%2C%20quisiera%20consultar%20disponibilidad%20de%20turnos%20en%20SupRA%20Consultorios."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
            >
              Consultar por WhatsApp
            </a>
          </div>
        )}

        {!turnosError && fechas.length > 0 && (
          <div className="space-y-5">
            {fechas.map((fecha) => (
              <section
                key={fecha}
                className="rounded-[1.5rem] bg-white p-6 shadow-sm"
              >
                <h2 className="mb-4 text-xl font-bold capitalize">
                  {formatearFecha(fecha)}
                </h2>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {turnosPorFecha[fecha].map((turno) => (
                    <Link
                      key={turno.id}
                      href={`/reservar/${turno.id}`}
className="rounded-2xl border border-[var(--supra-border)] bg-[var(--supra-surface-soft)] p-4 text-left transition hover:border-[var(--supra-green-dark)] hover:bg-[var(--supra-green)]"                    >
                      <p className="text-lg font-bold">
  {formatearHora(turno.hora_inicio)}
</p>
<p className="mt-3 text-sm font-semibold text-slate-900">
  Seleccionar turno →
</p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}