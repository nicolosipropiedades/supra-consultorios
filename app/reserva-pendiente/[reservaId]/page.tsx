import EstadoReservaWatcher from "./EstadoReservaWatcher";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PagoManualBox from "./PagoManualBox";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReservaDetalle = {
  id: string;
  estado: string;
  valor_total_turno: number;
  monto_reserva: number;
  saldo_consultorio: number;
  vence_en: string;
  pacientes: {
    nombre_paciente: string;
    email_contacto: string;
    telefono_contacto: string;
  } | null;
  turnos: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    profesionales: {
      nombre: string;
    } | null;
    especialidades: {
      nombre: string;
    } | null;
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

function formatearVencimiento(fechaIso: string) {
  const fecha = new Date(fechaIso);

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(fecha);
}

export default async function ReservaPendientePage({
  params,
}: {
  params: Promise<{ reservaId: string }>;
}) {
  const { reservaId } = await params;

  const { data: reserva, error } = await supabase
    .from("reservas")
    .select(`
      id,
      estado,
      valor_total_turno,
      monto_reserva,
      saldo_consultorio,
      vence_en,
      pacientes (
        nombre_paciente,
        email_contacto,
        telefono_contacto
      ),
      turnos (
        fecha,
        hora_inicio,
        hora_fin,
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

  if (error || !reserva) {
    notFound();
  }

  const reservaData = reserva as unknown as ReservaDetalle;

  const paciente = reservaData.pacientes;
const turno = reservaData.turnos;
const profesional = turno?.profesionales;
const especialidad = turno?.especialidades;

if (!paciente || !turno || !profesional || !especialidad) {
  notFound();
}

  if (reservaData.estado === "confirmada") {
  return (
    <main className="min-h-screen bg-[var(--supra-bg)] px-6 py-10 text-[var(--supra-text)]">
      <EstadoReservaWatcher reservaId={reservaData.id} />
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--supra-border)] bg-white p-7 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--supra-gray-logo)]">
          Turno confirmado
        </p>

        <h1 className="mb-4 text-4xl font-bold">
          Turno confirmado con éxito
        </h1>

        <div className="mb-6 rounded-2xl bg-[var(--supra-green)] p-5 text-sm leading-6">
          Tu turno ya fue confirmado por la coordinación de SupRA Consultorios.
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
            <p className="text-sm text-[var(--supra-muted)]">Paciente</p>
            <p className="font-bold">
              {paciente.nombre_paciente}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
            <p className="text-sm text-[var(--supra-muted)]">Especialidad</p>
            <p className="font-bold">
              {especialidad.nombre}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
            <p className="text-sm text-[var(--supra-muted)]">Profesional</p>
            <p className="font-bold">
              {profesional.nombre}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
            <p className="text-sm text-[var(--supra-muted)]">
              Fecha y horario
            </p>
            <p className="font-bold">
              {formatearFecha(turno.fecha)} — {formatearHora(turno.hora_inicio)}
            </p>
          </div>
        </div>

                <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block rounded-full bg-[var(--supra-green-strong)] px-7 py-3 text-center font-bold text-[var(--supra-text)] shadow-sm transition hover:bg-[var(--supra-green)]"
          >
            Volver al inicio
          </Link>
        </div>

      </section>
    </main>
  );
}

  const { data: centro } = await supabase
  .from("centro_configuracion")
  .select("whatsapp, alias_pago")
  .eq("activo", true)
  .limit(1)
  .maybeSingle();

const whatsapp = centro?.whatsapp ?? "1131515331";
const aliasPago = centro?.alias_pago ?? "supra.consultorios";

  if (!reservaData.turnos || !reservaData.pacientes) {
    notFound();
  }

  return (
<main className="min-h-screen bg-[var(--supra-bg)] px-6 py-8 text-[var(--supra-text)]">      
  <EstadoReservaWatcher reservaId={reservaData.id} />
  <section className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-[var(--supra-border)] bg-white p-8 shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Reserva pendiente
          </p>

          <h1 className="mb-4 text-4xl font-bold">
            Estás a un paso de confirmar tu turno
          </h1>

          <div className="mb-6 rounded-2xl bg-[var(--supra-yellow-soft)] p-5 text-sm leading-6 text-[var(--supra-text)]">
  El turno queda bloqueado para vos durante 10 minutos. Para confirmarlo, aboná
  el valor total de la consulta de forma online.
</div>

          <div className="space-y-3 text-sm">
            <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
              <p className="text-slate-500">Paciente</p>
              <p className="font-bold">
                {paciente.nombre_paciente}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-slate-500">Especialidad</p>
              <p className="font-bold">
                {especialidad.nombre}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-slate-500">Profesional</p>
              <p className="font-bold">
                {profesional.nombre}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-slate-500">Fecha y horario</p>
              <p className="font-bold capitalize">
  {formatearFecha(turno.fecha)} — {formatearHora(turno.hora_inicio)}
</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-slate-500">Pago online</p>
              <p className="font-bold">
                {formatearPesos(reservaData.monto_reserva)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-slate-500">Disponible para pagar hasta</p>
              <p className="font-bold">
                {formatearVencimiento(reservaData.vence_en)} hs
              </p>
            </div>
          </div>

          <PagoManualBox
  aliasPago={aliasPago}
  whatsapp={whatsapp}
  paciente={paciente.nombre_paciente}
  especialidad={especialidad.nombre}
  profesional={profesional.nombre}
  fecha={formatearFecha(turno.fecha)}
  horario={formatearHora(turno.hora_inicio)}
  importe={formatearPesos(reservaData.monto_reserva)}
/>

<div className="mt-5">
  <Link
    href="/turnos"
    className="inline-block rounded-full bg-white px-5 py-3 text-center font-semibold text-[var(--supra-text)] shadow-sm hover:bg-[var(--supra-surface-soft)]"
  >
    Volver a turnos
  </Link>
</div>
        </div>
      </section>
    </main>
  );
}