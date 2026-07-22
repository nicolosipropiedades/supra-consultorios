import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AdminAgendaClient, {
  ProfesionalAgenda,
  TurnoAdmin,
} from "./AdminAgendaClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminAgendaPageProps = {
  searchParams: Promise<{
    mes?: string;
  }>;
};

function obtenerMesValido(mes?: string) {
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    return mes;
  }

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, "0");

  return `${anio}-${mesActual}`;
}

function sumarMes(mes: string, cantidad: number) {
  const [anio, numeroMes] = mes.split("-").map(Number);
  const fecha = new Date(anio, numeroMes - 1 + cantidad, 1);

  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function obtenerUltimoDiaDelMes(mes: string) {
  const [anio, numeroMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(anio, numeroMes, 0).getDate();

  return `${mes}-${String(ultimoDia).padStart(2, "0")}`;
}

function nombreMes(mes: string) {
  const fecha = new Date(`${mes}-01T00:00:00`);

  return fecha.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

export default async function AdminAgendaPage({
  searchParams,
}: AdminAgendaPageProps) {
  const { mes } = await searchParams;

  const mesActual = obtenerMesValido(mes);
  const mesAnterior = sumarMes(mesActual, -1);
  const mesSiguiente = sumarMes(mesActual, 1);

  const fechaDesde = `${mesActual}-01`;
  const fechaHasta = obtenerUltimoDiaDelMes(mesActual);

  const { data: turnos, error: turnosError } = await supabaseAdmin
    .from("turnos")
    .select(
      `
      id,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      visible_web,
      profesionales (
        id,
        nombre,
        whatsapp
      ),
      especialidades (
        id,
        nombre
      )
    `
    )
    .gte("fecha", fechaDesde)
    .lte("fecha", fechaHasta)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  const turnosLista = (turnos ?? []) as any[];
  const turnoIds = turnosLista.map((turno) => turno.id);

  const { data: reservas } =
  turnoIds.length > 0
    ? await supabaseAdmin
        .from("reservas")
        .select(
          `
          id,
          turno_id,
          estado,
          valor_total_turno,
          monto_reserva,
          vence_en,
          comentario,
          pacientes (
            id,
            nombre_paciente,
            edad_paciente,
            telefono_contacto,
            email_contacto
          )
        `
        )
        .in("turno_id", turnoIds)
        .in("estado", ["pendiente_pago", "confirmada"])
    : { data: [] };

  const reservasLista = (reservas ?? []) as any[];

  const reservasPorTurno = new Map<string, any>();

  for (const reserva of reservasLista) {
    reservasPorTurno.set(reserva.turno_id, reserva);
  }

  const agenda: TurnoAdmin[] = turnosLista.map((turno) => {
    const profesional = Array.isArray(turno.profesionales)
      ? turno.profesionales[0]
      : turno.profesionales;

    const especialidad = Array.isArray(turno.especialidades)
      ? turno.especialidades[0]
      : turno.especialidades;

    const reserva = reservasPorTurno.get(turno.id);

    const paciente = reserva?.pacientes
      ? Array.isArray(reserva.pacientes)
        ? reserva.pacientes[0]
        : reserva.pacientes
      : null;

    return {
      id: turno.id,
      fecha: turno.fecha,
      horaInicio: turno.hora_inicio,
      horaFin: turno.hora_fin,
      estado: turno.estado,
      visibleWeb: turno.visible_web,
      profesional: profesional?.nombre ?? "Sin profesional",
profesionalWhatsapp: profesional?.whatsapp ?? "",
especialidad: especialidad?.nombre ?? "Sin especialidad",
      reserva: reserva
        ? {
            id: reserva.id,
            estado: reserva.estado,
            valorTotalTurno: reserva.valor_total_turno,
            montoReserva: reserva.monto_reserva,
            venceEn: reserva.vence_en,
            comentario: reserva.comentario ?? "",
            paciente: paciente
              ? {
                  id: paciente.id,
                  nombre: paciente.nombre_paciente,
                  edad: paciente.edad_paciente,
                  telefono: paciente.telefono_contacto,
                  email: paciente.email_contacto,
                }
              : null,
          }
        : null,
    };
  });

const { data: centro } = await supabaseAdmin
  .from("centro_configuracion")
  .select("direccion")
  .eq("activo", true)
  .limit(1)
  .maybeSingle();

const direccionCentro = centro?.direccion ?? "Timoteo Gordillo 1482, CABA.";

const { data: profesionalesData } = await supabaseAdmin
  .from("profesionales")
  .select(
    `
    id,
    nombre,
    especialidades (
      nombre
    )
  `
  )
  .eq("activa", true)
  .order("orden", { ascending: true })
  .order("nombre", { ascending: true });

const profesionalesAgenda: ProfesionalAgenda[] = (profesionalesData ?? []).map(
  (profesional: any) => {
    const especialidad = Array.isArray(profesional.especialidades)
      ? profesional.especialidades[0]
      : profesional.especialidades;

    return {
      id: profesional.id,
      nombre: profesional.nombre,
      especialidadNombre: especialidad?.nombre ?? "Sin especialidad",
    };
  }
);

  return (
    <main className="min-h-screen bg-[var(--supra-bg)] px-6 py-6 text-[var(--supra-text)]">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-block text-sm font-semibold text-[var(--supra-muted)] hover:text-[var(--supra-text)]"
            >
              ← Volver al inicio
            </Link>

            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--supra-gray-logo)]">
              Administración
            </p>

            <h1 className="text-4xl font-bold">Agenda del consultorio</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/agenda?mes=${mesAnterior}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-[var(--supra-surface-soft)]"
            >
              ← Mes anterior
            </Link>

            <Link
              href={`/admin/agenda?mes=${mesSiguiente}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-[var(--supra-surface-soft)]"
            >
              Mes siguiente →
            </Link>
            
<form action="/api/admin/logout" method="POST">
  <button
    type="submit"
    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-700"
  >
    Cerrar sesión
  </button>
</form>

          </div>
        </div>

        <div className="mb-5 rounded-[1.5rem] border border-[var(--supra-border)] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold capitalize">{nombreMes(mesActual)}</h2>
          <p className="mt-1 text-sm text-[var(--supra-muted)]">
            Hacé click en un día para ver el detalle de turnos, reservas y
            bloqueos.
          </p>
        </div>

        {turnosError && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Error al cargar la agenda: {turnosError.message}
          </div>
        )}

   <AdminAgendaClient
  mesActual={mesActual}
  agenda={agenda}
  direccionCentro={direccionCentro}
  profesionales={profesionalesAgenda}
/>
      </section>
    </main>
  );
}