"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ReservaForm({ turnoId }: { turnoId: string }) {
  const router = useRouter();

  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edadPaciente, setEdadPaciente] = useState("");
  const [dniPaciente, setDniPaciente] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [adultoResponsable, setAdultoResponsable] = useState("");
  const [vinculoResponsable, setVinculoResponsable] = useState("");
  const [telefonoResponsable, setTelefonoResponsable] = useState("");
  const [comentario, setComentario] = useState("");
  const [aceptoCondiciones, setAceptoCondiciones] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!aceptoCondiciones) {
      setError("Debés aceptar las condiciones de la reserva.");
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch("/api/reservas/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turnoId,
          nombrePaciente,
          edadPaciente,
          dniPaciente,
          telefonoContacto,
          emailContacto,
          adultoResponsable,
          vinculoResponsable,
          telefonoResponsable,
          comentario,
          aceptoCondiciones,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear la reserva.");
        setEnviando(false);
        return;
      }

      router.push(`/reserva-pendiente/${data.reservaId}`);
    } catch {
      setError("Ocurrió un error al crear la reserva.");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.5rem] border border-[var(--supra-border)] bg-white p-6 shadow-sm"
    >
      <h2 className="mb-5 text-xl font-bold">Datos del paciente</h2>

      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Nombre y apellido del paciente *
          </label>
          <input
            value={nombrePaciente}
            onChange={(e) => setNombrePaciente(e.target.value)}
            required
className="w-full rounded-2xl border border-[var(--supra-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--supra-green-dark)] focus:ring-2 focus:ring-[var(--supra-green)]"            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">
            Edad del paciente *
          </label>
          <input
            value={edadPaciente}
            onChange={(e) => setEdadPaciente(e.target.value)}
            required
            min="0"
            max="120"
            type="number"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            placeholder="Ej: 8"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">
            DNI del paciente
          </label>
          <input
            value={dniPaciente}
            onChange={(e) => setDniPaciente(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">
            Teléfono de contacto *
          </label>
          <input
            value={telefonoContacto}
            onChange={(e) => setTelefonoContacto(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            placeholder="Ej: 1131515331"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">
            Email de contacto *
          </label>
          <input
            value={emailContacto}
            onChange={(e) => setEmailContacto(e.target.value)}
            required
            type="email"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
            placeholder="Ej: paciente@email.com"
          />
        </div>
      </div>

      <div className="my-6 border-t border-slate-200 pt-6">
        <h3 className="mb-4 font-bold">Adulto responsable</h3>

        <p className="mb-4 text-sm leading-6 text-slate-600">
          Completá estos datos solo si el paciente es menor de edad o si
          corresponde que otra persona sea el contacto responsable.
        </p>

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Nombre y apellido del adulto responsable
            </label>
            <input
              value={adultoResponsable}
              onChange={(e) => setAdultoResponsable(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Vínculo con el paciente
            </label>
            <input
              value={vinculoResponsable}
              onChange={(e) => setVinculoResponsable(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Ej: madre, padre, tutor/a"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Teléfono del adulto responsable
            </label>
            <input
              value={telefonoResponsable}
              onChange={(e) => setTelefonoResponsable(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-900"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">
          Motivo breve de consulta
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={4}
className="w-full resize-none rounded-2xl border border-[var(--supra-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--supra-green-dark)] focus:ring-2 focus:ring-[var(--supra-green)]"          placeholder="Opcional"
        />
      </div>

      <label className="mt-5 flex gap-3 rounded-2xl bg-[var(--supra-yellow-soft)] p-4 text-sm leading-6">
        <input
          type="checkbox"
          checked={aceptoCondiciones}
          onChange={(e) => setAceptoCondiciones(e.target.checked)}
          className="mt-1"
        />
        <span>
          Entiendo que el turno quedará bloqueado durante 10 minutos y que para
          confirmarlo debo abonar el valor total de la consulta online. Para
          reprogramaciones o cancelaciones, debo comunicarme con la coordinación
          del consultorio con una antelación mínima de 24 hs. En caso de no presentarme o cancelar fuera de término, se aplicará la política de cancelación del consultorio.
        </span>
      </label>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
className="mt-6 w-full rounded-full bg-[var(--supra-green-strong)] px-5 py-3 font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)] disabled:cursor-not-allowed disabled:bg-slate-300"      >
        {enviando ? "Preparando pago..." : "Continuar al pago"}
      </button>
    </form>
  );
}