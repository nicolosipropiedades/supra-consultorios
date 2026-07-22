import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profesional = {
  id: string;
  nombre: string;
  email: string;
  especialidades: {
    nombre: string;
    descripcion: string | null;
    valor_turno: number;
    orden: number;
  } | null;
};

const prestacionesPorEspecialidad: Record<string, string[]> = {
  Psicología: [
    "Terapia individual",
    "Terapia grupal",
    "Terapia de pareja",
    "Orientación vocacional",
    "Eval. neurocognitivas",
    "Aptos psicológicos",
  ],
  Psicopedagogía: [
    "Tto. psicopedagógico",
    "Orientación a padres",
    "Orientación a escuelas",
    "Orientación vocacional",
    "Eval. neurocognitivas",
    "Técnicas de estudio",
  ],
  Fonoaudiología: [
    "Audiometría / Logoaudiometría",
    "Acufenometría",
    "Rehab. de patologías de la voz",
    "Rehab. vestibular",
    "Tto. deglución atípica y R. bucal",
    "Rehab. del habla y del lenguaje",
    "Rehab. post ACV",
    "Tto. de patologías neurodegenerativas",
  ],
  Psicomotricidad: [
    "Motricidad global / refleja",
    "Motricidad fina / preoperacional",
    "Lateralización / organización",
  ],
};

const prestacionesPorProfesional: Record<string, string[]> = {
  "Lic. Melanie Ramos Alma": [
    "Terapia individual",
    "Terapia grupal",
    "Terapia de pareja",
    "Orientación vocacional",
    "Eval. neurocognitivas",
    "Aptos psicológicos",
  ],

  "Lic. Agostina Ferrando": [
    "Terapia individual",
    "Terapia grupal",
    "Terapia de pareja",
    "Orientación vocacional",
    "Aptos psicológicos",
  ],
};

function IconoEspecialidad({ nombre }: { nombre: string }) {
  const baseClass =
  "flex h-12 w-12 items-center justify-center rounded-full border border-[var(--supra-border)] bg-white text-[var(--supra-green-dark)] shadow-sm";

  if (nombre === "Psicología") {
    return (
      <span className={baseClass}>
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.5 4C6.46 4 4 6.46 4 9.5c0 1.9.96 3.58 2.42 4.57-.07.3-.28 1.11-.8 2.16 1.28-.18 2.22-.6 2.76-.91.36.11.74.18 1.12.18h.1c3.04 0 5.5-2.46 5.5-5.5S12.54 4 9.5 4Z" />
          <path d="M14.5 9c2.49 0 4.5 2.01 4.5 4.5 0 1.54-.78 2.91-1.96 3.72.06.25.22.88.64 1.71-1.01-.14-1.76-.47-2.19-.71-.3.09-.64.14-.99.14h-.08c-2.49 0-4.5-2.01-4.5-4.5S12.01 9 14.5 9Z" />
        </svg>
      </span>
    );
  }

  if (nombre === "Psicopedagogía") {
    return (
      <span className={baseClass}>
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6.5C4 5.67 4.67 5 5.5 5H19v12H5.5A1.5 1.5 0 0 0 4 18.5v-12Z" />
          <path d="M19 17V5" />
          <path d="M8 9h7" />
          <path d="M8 12h5" />
        </svg>
      </span>
    );
  }

  if (nombre === "Fonoaudiología") {
    return (
      <span className={baseClass}>
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4a2 2 0 0 1 2 2v5a2 2 0 1 1-4 0V6a2 2 0 0 1 2-2Z" />
          <path d="M8 10v1a4 4 0 0 0 8 0v-1" />
          <path d="M12 15v5" />
          <path d="M9 20h6" />
        </svg>
      </span>
    );
  }

  if (nombre === "Psicomotricidad") {
    return (
      <span className={baseClass}>
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v5" />
          <path d="M12 12l-4 3" />
          <path d="M12 12l4 3" />
          <path d="M12 10l-3-2" />
          <path d="M12 10l3-2" />
          <path d="M8 19l4-4 4 4" />
        </svg>
      </span>
    );
  }

  return (
    <span className={baseClass}>
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8" />
      </svg>
    </span>
  );
}

function formatearPesos(valor: number) {
  return valor.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export default async function TurnosPage() {
  const { data: profesionales, error } = await supabase
    .from("profesionales")
    .select(`
      id,
      nombre,
      email,
      especialidades (
        nombre,
        descripcion,
        valor_turno,
        orden
      )
    `)
    .eq("activa", true)
    .eq("especialidades.activa", true)
    .order("orden", { ascending: true });

  const lista = (profesionales ?? []) as unknown as Profesional[];

  return (
    <main className="min-h-screen bg-[var(--supra-bg)] px-6 py-8 text-[var(--supra-text)]">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-6 inline-block text-sm font-semibold text-[var(--supra-muted)] hover:text-[var(--supra-text)]"
          >
            ← Volver al inicio
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--supra-gray-logo)]">
            SupRA Consultorios
          </p>

          <h1 className="mb-4 text-4xl font-bold">
            Elegí especialidad y profesional
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-[var(--supra-muted)]">
            Todos los turnos son presenciales. Para confirmar el turno se abona
            el valor total de forma online.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            Error al cargar profesionales: {error.message}
          </div>
        )}

        {!error && (
          <div className="grid gap-5 md:grid-cols-2">
            {lista.map((profesional) => {
              const especialidad = profesional.especialidades;

              if (!especialidad) return null;

              const prestaciones =
  prestacionesPorProfesional[profesional.nombre] ??
  prestacionesPorEspecialidad[especialidad.nombre] ??
  [];

              return (
                <article
                  key={profesional.id}
                  className="flex flex-col rounded-[1.5rem] border border-[var(--supra-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
  <div>
    <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--supra-gray-logo)]">
      {especialidad.nombre}
    </p>

    <h2 className="text-2xl font-bold">
      {profesional.nombre}
    </h2>
  </div>

  <IconoEspecialidad nombre={especialidad.nombre} />
</div>

                  <p className="mb-4 text-sm leading-6 text-[var(--supra-muted)]">
                    {especialidad.descripcion}
                  </p>

                  {prestaciones.length > 0 && (
  <ul className="mb-6 grid list-disc gap-2 pl-5 text-sm text-[var(--supra-muted)] marker:text-[var(--supra-green-dark)] sm:grid-cols-2">
    {prestaciones.map((prestacion) => (
      <li key={prestacion} className="pl-1">
        {prestacion}
      </li>
    ))}
  </ul>
)}

                  <div className="mt-auto">
                    <div className="mb-5 rounded-2xl bg-[var(--supra-surface-soft)] p-4 text-sm">
                      <div className="flex justify-between py-1">
                        <span>Valor total</span>
                        <strong>{formatearPesos(especialidad.valor_turno)}</strong>
                      </div>
                    </div>

                    <Link
                      href={`/turnos/${profesional.id}`}
                      className="block rounded-full bg-[var(--supra-green-strong)] px-5 py-3 text-center font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)]"
                    >
                      Ver turnos disponibles
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!error && lista.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-[var(--supra-muted)] shadow-sm">
            No hay profesionales activos para mostrar.
          </div>
        )}
      </section>
    </main>
  );
}