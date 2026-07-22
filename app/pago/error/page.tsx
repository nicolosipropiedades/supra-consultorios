import Link from "next/link";

export default function PagoErrorPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ef] px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
          Pago no realizado
        </p>

        <h1 className="mb-4 text-4xl font-bold">
          No pudimos confirmar el pago
        </h1>

        <p className="mb-6 text-lg leading-8 text-slate-600">
          La operación fue cancelada o rechazada. Podés volver a intentar
          reservando un turno disponible.
        </p>

        <Link
          href="/turnos"
          className="inline-block rounded-full bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
        >
          Volver a turnos
        </Link>
      </section>
    </main>
  );
}