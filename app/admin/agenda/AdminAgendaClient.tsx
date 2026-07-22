"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type TurnoAdmin = {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  visibleWeb: boolean;
  profesional: string;
  profesionalWhatsapp: string;
  especialidad: string;
  reserva: null | {
    id: string;
    estado: string;
    valorTotalTurno: number;
    montoReserva: number;
    venceEn: string | null;
    comentario: string;
    paciente: null | {
      id: string;
      nombre: string;
      edad: number;
      telefono: string;
      email: string;
    };
  };
};

export type ProfesionalAgenda = {
  id: string;
  nombre: string;
  especialidadNombre: string;
};

type AdminAgendaClientProps = {
  mesActual: string;
  agenda: TurnoAdmin[];
  direccionCentro: string;
  profesionales: ProfesionalAgenda[];
};

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function crearDiasDelMes(mes: string) {
  const [anio, numeroMes] = mes.split("-").map(Number);
  const primerDia = new Date(anio, numeroMes - 1, 1);
  const ultimoDia = new Date(anio, numeroMes, 0);

  const cantidadDias = ultimoDia.getDate();

  const diaSemanaPrimerDia = primerDia.getDay();
  const espaciosPrevios =
    diaSemanaPrimerDia === 0 ? 6 : diaSemanaPrimerDia - 1;

  const dias = [];

  for (let i = 0; i < espaciosPrevios; i++) {
    dias.push(null);
  }

  for (let dia = 1; dia <= cantidadDias; dia++) {
    const fecha = `${mes}-${String(dia).padStart(2, "0")}`;
    dias.push({
      numero: dia,
      fecha,
    });
  }

  return dias;
}

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearHora(hora: string) {
  return hora.slice(0, 5);
}

function formatearPesos(valor: number) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function crearWhatsappUrl(numero: string, mensaje: string) {
  const soloNumeros = numero.replace(/\D/g, "");

  if (!soloNumeros) {
    return "#";
  }

  const numeroWhatsapp = soloNumeros.startsWith("54")
    ? soloNumeros
    : `549${soloNumeros}`;

  return `https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`;
}

function etiquetaEstado(estado: string) {
  const normalizado = estado.toLowerCase();

  const estilos: Record<string, string> = {
    disponible: "bg-green-50 text-green-700 border-green-200",
    pendiente_pago: "bg-yellow-50 text-yellow-700 border-yellow-200",
    confirmado: "bg-blue-50 text-blue-700 border-blue-200",
    vencido: "bg-slate-100 text-slate-600 border-slate-200",
    cancelado: "bg-red-50 text-red-700 border-red-200",
    bloqueado: "bg-zinc-100 text-zinc-700 border-zinc-200",
  };

  const textos: Record<string, string> = {
    disponible: "Disponible",
    pendiente_pago: "Pendiente de pago",
    confirmado: "Confirmado",
    vencido: "Vencido",
    cancelado: "Cancelado",
    bloqueado: "Bloqueado",
  };

  return {
    texto: textos[normalizado] ?? estado,
    className:
      estilos[normalizado] ?? "bg-slate-100 text-slate-700 border-slate-200",
  };
}

export default function AdminAgendaClient({
  mesActual,
  agenda,
  direccionCentro,
  profesionales,
}: AdminAgendaClientProps) {
  const router = useRouter();

  const [turnoProcesandoId, setTurnoProcesandoId] = useState<string | null>(
    null
  );
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const [turnosBloqueadosManualmente, setTurnosBloqueadosManualmente] =
    useState<string[]>([]);

  const [turnosConfirmadosManualmente, setTurnosConfirmadosManualmente] =
    useState<string[]>([]);

  const [turnoPagoConfirmadoId, setTurnoPagoConfirmadoId] = useState<
    string | null
  >(null);

  const [turnoBloqueoManualId, setTurnoBloqueoManualId] = useState<
    string | null
  >(null);

  const [bloqueoManualConfirmadoId, setBloqueoManualConfirmadoId] = useState<
    string | null
  >(null);

  const [nombrePacienteManual, setNombrePacienteManual] = useState("");
  const [edadPacienteManual, setEdadPacienteManual] = useState("");
  const [whatsappPacienteManual, setWhatsappPacienteManual] = useState("");
  const [diaManual, setDiaManual] = useState("");
  const [horarioManual, setHorarioManual] = useState("");
  const [motivoConsultaManual, setMotivoConsultaManual] = useState("");

  const [profesionalNuevoTurnoId, setProfesionalNuevoTurnoId] = useState(
    profesionales[0]?.id ?? ""
  );
  const [horaInicioNuevoTurno, setHoraInicioNuevoTurno] = useState("09:00");
  const [cantidadNuevosTurnos, setCantidadNuevosTurnos] = useState("1");
  const [visibleWebNuevoTurno, setVisibleWebNuevoTurno] = useState(true);
  const [cargandoNuevoTurno, setCargandoNuevoTurno] = useState(false);
  const [mensajeNuevoTurno, setMensajeNuevoTurno] = useState<string | null>(
    null
  );

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      const hayFormularioManualAbierto = turnoBloqueoManualId !== null;
      const hayAccionProcesando = turnoProcesandoId !== null;
      const hayCargaTurnosProcesando = cargandoNuevoTurno;
      const hayBotonesWhatsappAbiertos =
        turnoPagoConfirmadoId !== null || bloqueoManualConfirmadoId !== null;

      if (
        hayFormularioManualAbierto ||
        hayAccionProcesando ||
        hayCargaTurnosProcesando ||
        hayBotonesWhatsappAbiertos
      ) {
        return;
      }

      router.refresh();
    }, 8000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    router,
    turnoBloqueoManualId,
    turnoProcesandoId,
    cargandoNuevoTurno,
    turnoPagoConfirmadoId,
    bloqueoManualConfirmadoId,
  ]);

  const hoy = new Date();
  const fechaHoy = `${hoy.getFullYear()}-${String(
    hoy.getMonth() + 1
  ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const fechaInicial =
    fechaHoy.startsWith(mesActual) &&
    agenda.some((turno) => turno.fecha === fechaHoy)
      ? fechaHoy
      : agenda[0]?.fecha ?? `${mesActual}-01`;

  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaInicial);

  const diasDelMes = useMemo(() => crearDiasDelMes(mesActual), [mesActual]);

  const turnosPorFecha = useMemo(() => {
    const mapa = new Map<string, TurnoAdmin[]>();

    for (const turno of agenda) {
      const actuales = mapa.get(turno.fecha) ?? [];
      actuales.push(turno);
      mapa.set(turno.fecha, actuales);
    }

    return mapa;
  }, [agenda]);

  function obtenerEstadoVisual(turno: TurnoAdmin) {
    if (turnosConfirmadosManualmente.includes(turno.id)) {
      return "confirmado";
    }

    if (turnosBloqueadosManualmente.includes(turno.id)) {
      return "bloqueado";
    }

    return turno.estado;
  }

  function prioridadEstado(estado: string) {
    if (estado === "pendiente_pago") return 0;
    if (estado === "confirmado") return 1;
    if (estado === "bloqueado") return 2;
    if (estado === "disponible") return 3;

    return 4;
  }

  const turnosSeleccionados = (turnosPorFecha.get(fechaSeleccionada) ?? [])
    .slice()
    .sort((a, b) => {
      const estadoA = obtenerEstadoVisual(a);
      const estadoB = obtenerEstadoVisual(b);

      const prioridadA = prioridadEstado(estadoA);
      const prioridadB = prioridadEstado(estadoB);

      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      return a.horaInicio.localeCompare(b.horaInicio);
    });

  function obtenerResumenDia(fecha: string) {
    const turnos = turnosPorFecha.get(fecha) ?? [];

    return {
      total: turnos.length,
      confirmados: turnos.filter(
        (turno) => obtenerEstadoVisual(turno) === "confirmado"
      ).length,
      pendientes: turnos.filter(
        (turno) => obtenerEstadoVisual(turno) === "pendiente_pago"
      ).length,
      bloqueados: turnos.filter(
        (turno) => obtenerEstadoVisual(turno) === "bloqueado"
      ).length,
    };
  }

  async function cambiarBloqueoTurno(turno: TurnoAdmin) {
    const estadoReal = obtenerEstadoVisual(turno);
    const accion = estadoReal === "bloqueado" ? "desbloquear" : "bloquear";

    const confirmar = window.confirm(
      accion === "bloquear"
        ? "¿Querés bloquear este turno? Dejará de estar disponible en la web."
        : "¿Querés desbloquear este turno? Volverá a quedar disponible en la web."
    );

    if (!confirmar) return;

    setTurnoProcesandoId(turno.id);
    setErrorAccion(null);

    try {
      const response = await fetch("/api/admin/turnos/bloquear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          turnoId: turno.id,
          accion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorAccion(data.error ?? "No se pudo modificar el turno.");
        setTurnoProcesandoId(null);
        return;
      }

      if (accion === "desbloquear") {
        setTurnosBloqueadosManualmente((actuales) =>
          actuales.filter((id) => id !== turno.id)
        );

        setTurnoBloqueoManualId(null);
        setBloqueoManualConfirmadoId(null);
      }

      if (accion === "bloquear") {
        setTurnosBloqueadosManualmente((actuales) =>
          actuales.includes(turno.id) ? actuales : [...actuales, turno.id]
        );
      }

      setTurnoProcesandoId(null);

      router.refresh();

      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch {
      setErrorAccion("Ocurrió un error al modificar el turno.");
      setTurnoProcesandoId(null);
    }
  }

  async function cancelarReservaTurno(turno: TurnoAdmin) {
    const confirmar = window.confirm(
      "¿Querés cancelar/liberar este turno? Si tiene reserva, se cancelará. Si quedó pendiente sin reserva, se liberará manualmente."
    );

    if (!confirmar) return;

    setTurnoProcesandoId(turno.id);
    setErrorAccion(null);

    try {
      const response = await fetch("/api/admin/reservas/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          turnoId: turno.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorAccion(
          data.detalle
            ? `${data.error} Detalle: ${data.detalle}`
            : data.error ?? "No se pudo cancelar/liberar el turno."
        );
        setTurnoProcesandoId(null);
        return;
      }

      setTurnosConfirmadosManualmente((actuales) =>
        actuales.filter((id) => id !== turno.id)
      );

      setTurnosBloqueadosManualmente((actuales) =>
        actuales.filter((id) => id !== turno.id)
      );

      setTurnoPagoConfirmadoId(null);
      setBloqueoManualConfirmadoId(null);
      setTurnoBloqueoManualId(null);
      setTurnoProcesandoId(null);

      router.refresh();

      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch {
      setErrorAccion("Ocurrió un error al cancelar/liberar el turno.");
      setTurnoProcesandoId(null);
    }
  }

  async function confirmarPagoTurno(turno: TurnoAdmin) {
    const puedeConfirmar =
      turno.estado === "pendiente_pago" ||
      turno.reserva?.estado === "pendiente_pago";

    if (!puedeConfirmar) {
      setErrorAccion("Este turno no tiene una reserva pendiente de pago.");
      return;
    }

    const confirmar = window.confirm(
      "¿Querés confirmar el pago de este paciente? El turno pasará a estado confirmado."
    );

    if (!confirmar) return;

    setTurnoProcesandoId(turno.id);
    setErrorAccion(null);

    try {
      const response = await fetch("/api/admin/reservas/confirmar-pago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          turnoId: turno.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorAccion(
          data.detalle
            ? `${data.error} Detalle: ${data.detalle}`
            : data.error ?? "No se pudo confirmar el pago."
        );
        setTurnoProcesandoId(null);
        return;
      }

      setTurnosConfirmadosManualmente((actuales) =>
        actuales.includes(turno.id) ? actuales : [...actuales, turno.id]
      );

      setTurnoPagoConfirmadoId(turno.id);
      setTurnoProcesandoId(null);
    } catch {
      setErrorAccion("Ocurrió un error al confirmar el pago.");
      setTurnoProcesandoId(null);
    }
  }

  async function crearTurnosDisponibles() {
    if (!profesionalNuevoTurnoId) {
      setErrorAccion("Seleccioná una profesional.");
      return;
    }

    if (!horaInicioNuevoTurno) {
      setErrorAccion("Indicá una hora de inicio.");
      return;
    }

    const cantidad = Number(cantidadNuevosTurnos);

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
      setErrorAccion("La cantidad debe ser un número entre 1 y 20.");
      return;
    }

    const confirmar = window.confirm(
      `¿Querés cargar ${cantidad} turno/s disponible/s para el día ${formatearFecha(
        fechaSeleccionada
      )}?`
    );

    if (!confirmar) return;

    setCargandoNuevoTurno(true);
    setErrorAccion(null);
    setMensajeNuevoTurno(null);

    try {
      const response = await fetch("/api/admin/turnos/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          profesionalId: profesionalNuevoTurnoId,
          fecha: fechaSeleccionada,
          horaInicio: horaInicioNuevoTurno,
          cantidad,
          visibleWeb: visibleWebNuevoTurno,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorAccion(
          data.detalle
            ? `${data.error} Detalle: ${data.detalle}`
            : data.error ?? "No se pudieron crear los turnos."
        );
        setCargandoNuevoTurno(false);
        return;
      }

      setMensajeNuevoTurno(data.mensaje ?? "Turnos creados correctamente.");
      setCargandoNuevoTurno(false);

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch {
      setErrorAccion("Ocurrió un error al crear los turnos.");
      setCargandoNuevoTurno(false);
    }
  }

  function abrirBloqueoManual(turno: TurnoAdmin) {
    setErrorAccion(null);
    setTurnoBloqueoManualId(turno.id);
    setBloqueoManualConfirmadoId(null);
    setNombrePacienteManual("");
    setEdadPacienteManual("");
    setWhatsappPacienteManual("");
    setDiaManual(formatearFecha(turno.fecha));
    setHorarioManual(formatearHora(turno.horaInicio));
    setMotivoConsultaManual("");
  }

  async function bloquearTurnoManual(turno: TurnoAdmin) {
    if (!nombrePacienteManual.trim()) {
      setErrorAccion("Completá el nombre del paciente.");
      return;
    }

    if (!edadPacienteManual.trim()) {
      setErrorAccion("Completá la edad del paciente.");
      return;
    }

    if (!whatsappPacienteManual.trim()) {
      setErrorAccion("Completá el WhatsApp del paciente.");
      return;
    }

    if (!turno.profesionalWhatsapp.trim()) {
      setErrorAccion("Falta cargar el WhatsApp de la profesional en Supabase.");
      return;
    }

    if (!diaManual.trim() || !horarioManual.trim()) {
      setErrorAccion("Completá día y horario del turno.");
      return;
    }

    if (!motivoConsultaManual.trim()) {
      setErrorAccion("Completá el breve motivo de consulta.");
      return;
    }

    const confirmar = window.confirm(
      "¿Querés bloquear este turno y generar los mensajes de WhatsApp?"
    );

    if (!confirmar) return;

    setTurnoProcesandoId(turno.id);
    setErrorAccion(null);

    try {
      const response = await fetch("/api/admin/turnos/bloquear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          turnoId: turno.id,
          accion: "bloquear",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorAccion(
          data.detalle
            ? `${data.error} Detalle: ${data.detalle}`
            : data.error ?? "No se pudo bloquear el turno."
        );
        setTurnoProcesandoId(null);
        return;
      }

      setTurnosBloqueadosManualmente((actuales) =>
        actuales.includes(turno.id) ? actuales : [...actuales, turno.id]
      );

      setBloqueoManualConfirmadoId(turno.id);
      setTurnoProcesandoId(null);
    } catch {
      setErrorAccion("Ocurrió un error al bloquear el turno.");
      setTurnoProcesandoId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="rounded-[2rem] border border-[var(--supra-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 grid grid-cols-7 gap-2">
          {diasSemana.map((dia) => (
            <div
              key={dia}
              className="py-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--supra-muted)]"
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {diasDelMes.map((dia, index) => {
            if (!dia) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-28 rounded-2xl bg-transparent"
                />
              );
            }

            const resumen = obtenerResumenDia(dia.fecha);
            const seleccionado = dia.fecha === fechaSeleccionada;
            const esHoy = dia.fecha === fechaHoy;

            return (
              <button
                key={dia.fecha}
                type="button"
                onClick={() => setFechaSeleccionada(dia.fecha)}
                className={`min-h-28 rounded-2xl border p-3 text-left transition ${
                  seleccionado
                    ? "border-[var(--supra-green-dark)] bg-[var(--supra-green)] shadow-sm"
                    : "border-[var(--supra-border)] bg-[var(--supra-bg)] hover:bg-[var(--supra-surface-soft)]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-bold">{dia.numero}</span>

                  {esHoy && (
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-[var(--supra-green-dark)]">
                      Hoy
                    </span>
                  )}
                </div>

                {resumen.total > 0 ? (
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">{resumen.total} turnos</p>

                    {resumen.pendientes > 0 && (
                      <p>{resumen.pendientes} pendientes</p>
                    )}

                    {resumen.confirmados > 0 && (
                      <p>{resumen.confirmados} confirmados</p>
                    )}

                    {resumen.bloqueados > 0 && (
                      <p>{resumen.bloqueados} bloqueados</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--supra-muted)]">
                    Sin turnos cargados
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-[var(--supra-border)] bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--supra-gray-logo)]">
            Detalle del día
          </p>

          <h2 className="text-2xl font-bold capitalize">
            {formatearFecha(fechaSeleccionada)}
          </h2>
        </div>

        <div className="mb-5 rounded-2xl border border-[var(--supra-border)] bg-[var(--supra-bg)] p-4">
          <p className="mb-3 text-sm font-bold">Cargar turnos disponibles</p>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                Profesional
              </span>

              <select
                value={profesionalNuevoTurnoId}
                onChange={(event) =>
                  setProfesionalNuevoTurnoId(event.target.value)
                }
                className="w-full rounded-xl border border-[var(--supra-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
              >
                {profesionales.map((profesional) => (
                  <option key={profesional.id} value={profesional.id}>
                    {profesional.nombre} — {profesional.especialidadNombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                  Hora inicio
                </span>

                <input
                  type="time"
                  value={horaInicioNuevoTurno}
                  onChange={(event) =>
                    setHoraInicioNuevoTurno(event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--supra-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                  Cantidad
                </span>

                <input
                  type="number"
                  min="1"
                  max="20"
                  value={cantidadNuevosTurnos}
                  onChange={(event) =>
                    setCantidadNuevosTurnos(event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--supra-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-[var(--supra-muted)]">
              <input
                type="checkbox"
                checked={visibleWebNuevoTurno}
                onChange={(event) =>
                  setVisibleWebNuevoTurno(event.target.checked)
                }
              />
              Publicar en la web para pacientes
            </label>

            <button
              type="button"
              onClick={crearTurnosDisponibles}
              disabled={cargandoNuevoTurno || profesionales.length === 0}
              className="w-full rounded-full bg-[var(--supra-green-strong)] px-5 py-3 text-sm font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {cargandoNuevoTurno ? "Cargando turnos..." : "Cargar turnos"}
            </button>

            {mensajeNuevoTurno && (
              <p className="rounded-xl bg-green-50 p-3 text-xs font-semibold text-green-700">
                {mensajeNuevoTurno}
              </p>
            )}
          </div>
        </div>

        {errorAccion && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorAccion}
          </div>
        )}

        {turnosSeleccionados.length === 0 && (
          <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-5 text-sm leading-6 text-[var(--supra-muted)]">
            No hay turnos cargados para este día.
          </div>
        )}

        <div className="space-y-4">
          {turnosSeleccionados.map((turno) => {
            const estadoTurno = obtenerEstadoVisual(turno);

            const turnoActualizado = {
              ...turno,
              estado: estadoTurno,
            };

            const estado = etiquetaEstado(estadoTurno);

            const puedeCancelar =
              estadoTurno === "pendiente_pago" ||
              estadoTurno === "confirmado" ||
              turno.reserva?.estado === "pendiente_pago" ||
              turno.reserva?.estado === "confirmada";

            const puedeConfirmarPago =
              estadoTurno === "pendiente_pago" ||
              turno.reserva?.estado === "pendiente_pago";

            const bloqueoManualActivo = turnoBloqueoManualId === turno.id;
            const bloqueoManualConfirmado = bloqueoManualConfirmadoId === turno.id;

            const mensajePaciente = `Hola, te compartimos el resumen de tu turno en SupRA Consultorios:

Especialidad: ${turno.especialidad}
Profesional: ${turno.profesional}
Día: ${diaManual}
Horario: ${horarioManual}
Dirección: ${direccionCentro}

Ante cualquier cambio, podés comunicarte por este medio.`;

            const mensajeProfesional = `Hola, te compartimos un nuevo turno agendado:

Paciente: ${nombrePacienteManual}
Edad: ${edadPacienteManual}
Especialidad: ${turno.especialidad}
Profesional: ${turno.profesional}
Día: ${diaManual}
Horario: ${horarioManual}

Motivo de consulta:
${motivoConsultaManual}`;

            const whatsappPacienteUrl = crearWhatsappUrl(
              whatsappPacienteManual,
              mensajePaciente
            );

            const whatsappProfesionalUrl = crearWhatsappUrl(
              turno.profesionalWhatsapp,
              mensajeProfesional
            );

            const nombrePacienteReserva =
              turno.reserva?.paciente?.nombre ?? "";

            const edadPacienteReserva = turno.reserva?.paciente?.edad
              ? String(turno.reserva.paciente.edad)
              : "";

            const telefonoPacienteReserva =
              turno.reserva?.paciente?.telefono ?? "";

              const motivoConsultaReserva = turno.reserva?.comentario ?? "";

            const mensajePacienteConfirmado = `Hola ${nombrePacienteReserva}, te confirmamos tu turno en SupRA Consultorios.

Especialidad: ${turno.especialidad}
Profesional: ${turno.profesional}
Día: ${formatearFecha(turno.fecha)}
Horario: ${formatearHora(turno.horaInicio)}
Dirección: ${direccionCentro}

Saludos.`;

            const mensajeProfesionalConfirmado = `Hola, te compartimos un nuevo turno confirmado:

Paciente: ${nombrePacienteReserva}
Edad: ${edadPacienteReserva || "No informada"}
Especialidad: ${turno.especialidad}
Profesional: ${turno.profesional}
Día: ${formatearFecha(turno.fecha)}
Horario: ${formatearHora(turno.horaInicio)}
Teléfono paciente: ${telefonoPacienteReserva || "No informado"}

Motivo de consulta:
${motivoConsultaReserva || "No informado"}`;

            const whatsappPacienteConfirmadoUrl = crearWhatsappUrl(
              telefonoPacienteReserva,
              mensajePacienteConfirmado
            );

            const whatsappProfesionalConfirmadoUrl = crearWhatsappUrl(
              turno.profesionalWhatsapp,
              mensajeProfesionalConfirmado
            );

            return (
              <article
                key={turno.id}
                className="rounded-2xl border border-[var(--supra-border)] bg-[var(--supra-bg)] p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold">
                      {formatearHora(turno.horaInicio)}
                    </p>

                    <p className="text-sm text-[var(--supra-muted)]">
                      {turno.especialidad}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${estado.className}`}
                  >
                    {estado.texto}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Profesional:</span>{" "}
                    {turno.profesional}
                  </p>

                  {turno.reserva?.paciente ? (
                    <>
                      <p>
                        <span className="font-semibold">Paciente:</span>{" "}
                        {turno.reserva.paciente.nombre}
                      </p>

                      <p>
                        <span className="font-semibold">Edad:</span>{" "}
                        {turno.reserva.paciente.edad}
                      </p>

                      <p>
                        <span className="font-semibold">Teléfono:</span>{" "}
                        {turno.reserva.paciente.telefono}
                      </p>

                      <p>
                        <span className="font-semibold">Email:</span>{" "}
                        {turno.reserva.paciente.email}
                      </p>

                      <p>
                        <span className="font-semibold">Importe:</span>{" "}
                        {formatearPesos(turno.reserva.montoReserva)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[var(--supra-muted)]">
                      Sin reserva asociada.
                    </p>
                  )}

                  <p>
                    <span className="font-semibold">Visible web:</span>{" "}
                    {turno.visibleWeb ? "Sí" : "No"}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => cancelarReservaTurno(turno)}
                    disabled={turnoProcesandoId === turno.id || !puedeCancelar}
                    className={`rounded-full px-3 py-2 text-xs font-bold shadow-sm transition ${
                      !puedeCancelar
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {turnoProcesandoId === turno.id
                      ? "Procesando..."
                      : "Cancelar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => confirmarPagoTurno(turno)}
                    disabled={
                      turnoProcesandoId === turno.id || !puedeConfirmarPago
                    }
                    className={`rounded-full px-3 py-2 text-xs font-bold shadow-sm transition ${
                      !puedeConfirmarPago
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {turnoProcesandoId === turno.id
                      ? "Procesando..."
                      : "Confirmar pago"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (estadoTurno === "bloqueado") {
                        cambiarBloqueoTurno(turnoActualizado);
                      } else {
                        abrirBloqueoManual(turno);
                      }
                    }}
                    disabled={
                      turnoProcesandoId === turno.id ||
                      estadoTurno === "pendiente_pago" ||
                      estadoTurno === "confirmado"
                    }
                    className={`rounded-full px-3 py-2 text-xs font-bold shadow-sm transition ${
                      estadoTurno === "pendiente_pago" ||
                      estadoTurno === "confirmado"
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : estadoTurno === "bloqueado"
                        ? "bg-white text-[var(--supra-green-dark)] hover:bg-[var(--supra-green)]"
                        : "bg-[var(--supra-peach-soft)] text-[var(--supra-text)] hover:bg-[var(--supra-peach)]"
                    }`}
                  >
                    {turnoProcesandoId === turno.id
                      ? "Procesando..."
                      : estadoTurno === "bloqueado"
                      ? "Desbloquear"
                      : "Bloquear"}
                  </button>
                </div>

                {turnoPagoConfirmadoId === turno.id && (
                  <div className="mt-4 rounded-2xl border border-[var(--supra-border)] bg-white p-4">
                    <p className="mb-2 text-sm font-bold">
                      Turno confirmado correctamente
                    </p>

                    <p className="mb-4 text-xs leading-5 text-[var(--supra-muted)]">
                      Ahora podés enviar el resumen al paciente y avisarle a la
                      profesional por WhatsApp.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <a
                        href={whatsappPacienteConfirmadoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[var(--supra-green-strong)] px-4 py-3 text-center text-sm font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)]"
                      >
                        Enviar confirmación al paciente
                      </a>

                      <a
                        href={whatsappProfesionalConfirmadoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[var(--supra-peach-soft)] px-4 py-3 text-center text-sm font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-peach)]"
                      >
                        Enviar aviso a profesional
                      </a>
                    </div>
                  </div>
                )}

                {bloqueoManualActivo && (
                  <div className="mt-4 rounded-2xl border border-[var(--supra-border)] bg-white p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">
                          Bloqueo manual de turno
                        </p>
                        <p className="text-xs leading-5 text-[var(--supra-muted)]">
                          Completá los datos para generar el resumen del
                          paciente y de la profesional.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTurnoBloqueoManualId(null);
                          setBloqueoManualConfirmadoId(null);
                        }}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
                      >
                        Cerrar
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                          Nombre del paciente
                        </span>
                        <input
                          value={nombrePacienteManual}
                          onChange={(event) =>
                            setNombrePacienteManual(event.target.value)
                          }
                          placeholder="Ej: Juan Pérez"
                          className="w-full rounded-xl border border-[var(--supra-border)] px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                          Edad del paciente
                        </span>
                        <input
                          value={edadPacienteManual}
                          onChange={(event) =>
                            setEdadPacienteManual(event.target.value)
                          }
                          placeholder="Ej: 8"
                          className="w-full rounded-xl border border-[var(--supra-border)] px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                          WhatsApp paciente
                        </span>
                        <input
                          value={whatsappPacienteManual}
                          onChange={(event) =>
                            setWhatsappPacienteManual(event.target.value)
                          }
                          placeholder="Ej: 1131515331"
                          className="w-full rounded-xl border border-[var(--supra-border)] px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                            Día
                          </span>
                          <input
                            value={diaManual}
                            onChange={(event) =>
                              setDiaManual(event.target.value)
                            }
                            className="w-full rounded-xl border border-[var(--supra-border)] px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                            Horario
                          </span>
                          <input
                            value={horarioManual}
                            onChange={(event) =>
                              setHorarioManual(event.target.value)
                            }
                            className="w-full rounded-xl border border-[var(--supra-border)] px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-1 block text-xs font-bold text-[var(--supra-muted)]">
                          Breve motivo de consulta
                        </span>
                        <textarea
                          value={motivoConsultaManual}
                          onChange={(event) =>
                            setMotivoConsultaManual(event.target.value)
                          }
                          rows={3}
                          placeholder="Ej: Consulta inicial por orientación familiar."
                          className="w-full rounded-xl border border-[var(--supra-border)] px-3 py-2 text-sm outline-none focus:border-[var(--supra-green-dark)]"
                        />
                      </label>

                      <div className="rounded-xl bg-[var(--supra-surface-soft)] p-3 text-xs leading-5 text-[var(--supra-muted)]">
                        <p>
                          <span className="font-bold">Especialidad:</span>{" "}
                          {turno.especialidad}
                        </p>
                        <p>
                          <span className="font-bold">Profesional:</span>{" "}
                          {turno.profesional}
                        </p>
                        <p>
                          <span className="font-bold">
                            WhatsApp profesional:
                          </span>{" "}
                          {turno.profesionalWhatsapp || "No cargado"}
                        </p>
                      </div>

                      {!bloqueoManualConfirmado && (
                        <button
                          type="button"
                          onClick={() => bloquearTurnoManual(turno)}
                          disabled={turnoProcesandoId === turno.id}
                          className="w-full rounded-full bg-[var(--supra-green-strong)] px-5 py-3 text-sm font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)]"
                        >
                          {turnoProcesandoId === turno.id
                            ? "Bloqueando..."
                            : "Bloquear y generar mensajes"}
                        </button>
                      )}

                      {bloqueoManualConfirmado && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <a
                            href={whatsappPacienteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-[var(--supra-green-strong)] px-4 py-3 text-center text-sm font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)]"
                          >
                            Enviar resumen al paciente
                          </a>

                          <a
                            href={whatsappProfesionalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-[var(--supra-peach-soft)] px-4 py-3 text-center text-sm font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-peach)]"
                          >
                            Enviar resumen a profesional
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}