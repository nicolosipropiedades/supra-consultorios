"use client";

import { useEffect } from "react";

type EstadoReservaWatcherProps = {
  reservaId: string;
};

export default function EstadoReservaWatcher({
  reservaId,
}: EstadoReservaWatcherProps) {
  useEffect(() => {
    const intervalo = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/reservas/estado?reservaId=${reservaId}&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.estado === "confirmada") {
          window.clearInterval(intervalo);

          window.location.href = `${window.location.pathname}?confirmada=1&t=${Date.now()}`;
        }
      } catch {
        // Si falla una consulta, vuelve a intentar en el próximo intervalo.
      }
    }, 3000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [reservaId]);

  return null;
}