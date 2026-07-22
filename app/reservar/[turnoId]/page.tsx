import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ReservaForm from "./ReservaForm";

type TurnoDetalle = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  visible_web: boolean;
  profesionales: {
    id: string;
    nombre: string;
  } | null;
  especialidades: {
    id: string;
    nombre: string;
    duracion_minutos: number;
    valor_turno: number;
    monto_reserva: number;
    saldo_consultorio: number;
  } | null;
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
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fechaObj);
}

function formatearHora(hora: string) {
  return hora.slice(0, 5);
}

export default async function ReservarTurnoPage({
  params,
}: {
  params: Promise<{ turnoId: string }>;
}) {
  const { turnoId } = await params;

  const { data: turno, error } = await supabase
    .from("turnos")
    .select(`
      id,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      visible_web,
      profesionales (
        id,
        nombre
      ),
      especialidades (
        id,
        nombre,
        duracion_minutos,
        valor_turno,
        monto_reserva,
        saldo_consultorio
      )
    `)
    .eq("id", turnoId)
    .maybeSingle();

  if (error || !turno) {
    notFound();
  }

const turnoData = turno as unknown as TurnoDetalle;

  const { data: centro } = await supabase
  .from("centro_configuracion")
  .select("direccion, google_maps_url")
  .eq("activo", true)
  .limit(1)
  .maybeSingle();

const direccion = centro?.direccion ?? "Timoteo Gordillo 1482, CABA";

const mapsUrl =
  centro?.google_maps_url ??
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    direccion
  )}`;

  if (!turnoData.profesionales || !turnoData.especialidades) {
    notFound();
  }

  const disponible =
    turnoData.estado === "disponible" && turnoData.visible_web === true;

  return (
<main className="min-h-screen bg-[var(--supra-bg)] px-6 py-8 text-[var(--supra-text)]">      <section className="mx-auto max-w-5xl">
        <Link
          href={`/turnos/${turnoData.profesionales.id}`}
          className="mb-6 inline-block text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Volver a turnos disponibles
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Confirmar reserva
          </p>

          <h1 className="mb-4 text-4xl font-bold">
            Datos para reservar el turno
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Completá los datos del paciente. El turno quedará bloqueado durante
            10 minutos mientras se realiza el pago online.
          </p>
        </div>

        {!disponible && (
          <div className="rounded-[1.5rem] border border-[var(--supra-border)] bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold">
              Este turno ya no está disponible
            </h2>
            <p className="mb-5 text-slate-600">
              Puede haber sido reservado por otra persona o retirado de la web.
            </p>

            <Link
              href={`/turnos/${turnoData.profesionales.id}`}
              className="inline-block rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
            >
              Ver otros turnos
            </Link>
          </div>
        )}

        {disponible && (
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <aside className="rounded-[1.5rem] bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">Resumen del turno</h2>

              <div className="space-y-3 text-sm">
                <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
                  <p className="text-slate-500">Especialidad</p>
                  <p className="font-bold">{turnoData.especialidades.nombre}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-slate-500">Profesional</p>
                  <p className="font-bold">{turnoData.profesionales.nombre}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-slate-500">Fecha</p>
                  <p className="font-bold capitalize">
                    {formatearFecha(turnoData.fecha)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
  <p className="text-slate-500">Horario</p>
  <p className="font-bold">
    {formatearHora(turnoData.hora_inicio)}
  </p>
</div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-slate-500">Valor total</p>
                  <p className="font-bold">
                    {formatearPesos(turnoData.especialidades.valor_turno)}
                  </p>
                </div>

                <a
  href={mapsUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-start gap-3 rounded-2xl bg-[var(--supra-surface-soft)] p-4 transition hover:bg-[var(--supra-yellow-soft)]"
>
  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  </span>

  <span>
    <p className="text-slate-500">Dirección</p>
    <p className="font-bold">{direccion}</p>
    <p className="mt-1 text-xs text-[var(--supra-muted)]">
      Ver ubicación en Google Maps
    </p>
  </span>
</a>

              </div>
            </aside>

            <ReservaForm turnoId={turnoData.id} />
          </div>
        )}
      </section>
    </main>
  );
}