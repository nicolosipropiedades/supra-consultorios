"use client";

import { useState } from "react";

type PagoManualBoxProps = {
  aliasPago: string;
  whatsapp: string;
  paciente: string;
  especialidad: string;
  profesional: string;
  fecha: string;
  horario: string;
  importe: string;
};

export default function PagoManualBox({
  aliasPago,
  whatsapp,
  paciente,
  especialidad,
  profesional,
  fecha,
  horario,
  importe,
}: PagoManualBoxProps) {
  const [copiado, setCopiado] = useState(false);

  const whatsappSoloNumeros = whatsapp.replace(/\D/g, "");

  async function copiarAlias() {
    try {
      await navigator.clipboard.writeText(aliasPago);
      setCopiado(true);

      setTimeout(() => {
        setCopiado(false);
      }, 2500);
    } catch {
      setCopiado(false);
    }
  }

  const mensajeWhatsapp = `Hola, envío el comprobante de pago para confirmar mi turno en SupRA Consultorios.

Especialidad: ${especialidad}
Profesional: ${profesional}
Fecha: ${fecha}
Horario: ${horario}
Paciente: ${paciente}
Importe: ${importe}

Adjunto comprobante.`;

  const whatsappUrl = `https://wa.me/549${whatsappSoloNumeros}?text=${encodeURIComponent(
    mensajeWhatsapp
  )}`;

  return (
    <div className="mt-8 rounded-[1.5rem] border border-[var(--supra-border)] bg-[var(--supra-yellow-soft)] p-6">
      <h2 className="mb-3 text-xl font-bold">Pago del turno</h2>

      <p className="mb-5 text-sm leading-6 text-[var(--supra-muted)]">
        Para confirmar tu turno, transferí el valor total de la consulta al
        alias indicado. Podés hacerlo desde Mercado Pago, tu banco o cualquier
        billetera virtual. Luego enviá el comprobante por WhatsApp para que la
        coordinación confirme la reserva.
      </p>

      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-1 text-sm text-[var(--supra-muted)]">Importe a transferir</p>
        <p className="text-2xl font-bold">{importe}</p>
      </div>

      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-1 text-sm text-[var(--supra-muted)]">
          Alias para transferencia
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl font-bold">{aliasPago}</p>

          <button
            type="button"
            onClick={copiarAlias}
            className="rounded-full bg-[var(--supra-green-strong)] px-5 py-2.5 text-sm font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)]"
          >
            {copiado ? "Alias copiado" : "Copiar alias"}
          </button>
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-full bg-[var(--supra-green-strong)] px-5 py-3 text-center font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)]"
      >
        Enviar comprobante por WhatsApp
      </a>
    </div>
  );
}