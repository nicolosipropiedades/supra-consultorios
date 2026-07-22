"use client";

import { useState } from "react";

export default function PagarButton({ reservaId }: { reservaId: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarPago() {
    setError("");
    setCargando(true);

    try {
      const response = await fetch("/api/mercadopago/crear-preferencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reservaId }),
      });

      const data = await response.json();

      if (!response.ok) {
  setError(
    data.detalle
      ? `${data.error} Detalle: ${data.detalle}`
      : data.error ?? "No se pudo iniciar el pago."
  );
  setCargando(false);
  return;
}

      if (!data.checkoutUrl) {
        setError("Mercado Pago no devolvió el link de pago.");
        setCargando(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Ocurrió un error al conectar con Mercado Pago.");
      setCargando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={iniciarPago}
        disabled={cargando}
className="w-full rounded-full bg-[var(--supra-green-strong)] px-5 py-3 text-center font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)] disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"      >
        {cargando ? "Abriendo Mercado Pago..." : "Pagar online"}
      </button>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}