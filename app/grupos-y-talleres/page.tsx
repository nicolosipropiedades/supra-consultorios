import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";

const talleres = [
  {
    titulo: "Orientación vocacional",
    descripcion: "Pre y post egreso del nivel secundario",
  },
  {
    titulo: "Redacción CV",
    descripcion: "Con planificación laboral y académica",
  },
  {
    titulo: "Habilidades sociales",
    descripcion: "Grupos por edades",
  },
];

const grupos = [
  {
    titulo: "Acompañar",
    descripcion:
      "Espacio para cuidadores de personas con Alzheimer, otras demencias, T. depresivo, ACV, epilepsia, condición del espectro autista, T. obsesivo compulsivo y T. bipolar.",
  },
  {
    titulo: "Nido",
    descripcion:
      "Espacio para padres de niños y adolescentes que atraviesan dificultades en el área social.",
  },
];

export default async function GruposYTalleresPage() {
  const { data: centro } = await supabase
    .from("centro_configuracion")
    .select("whatsapp")
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  const whatsapp = centro?.whatsapp ?? "1131515331";
  const whatsappSoloNumeros = whatsapp.replace(/\D/g, "");

  const whatsappUrl = `https://wa.me/549${whatsappSoloNumeros}?text=${encodeURIComponent(
    "Hola, quisiera consultar por los grupos y talleres de SupRA Consultorios."
  )}`;

  return (
    <main className="min-h-screen bg-[var(--supra-bg)] text-[var(--supra-text)]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-semibold text-[var(--supra-muted)] hover:text-[var(--supra-text)]"
        >
          ← Volver al inicio
        </Link>

        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--supra-gray-logo)]">
            SupRA Consultorios
          </p>

          <h1 className="mb-4 text-4xl font-bold">
            Grupos y talleres
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-[var(--supra-muted)]">
            Espacios pensados para acompañar procesos vocacionales, sociales,
            familiares y de cuidado.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-[2rem] border border-[var(--supra-border)] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--supra-gray-logo)]">
                  Espacios prácticos
                </p>
                <h2 className="text-3xl font-bold">Talleres</h2>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--supra-border)] bg-[var(--supra-yellow-soft)] text-[var(--supra-green-dark)] shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5V6.5A2.5 2.5 0 0 1 6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5Z" />
                  <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
                  <path d="M8 8h8" />
                  <path d="M8 12h6" />
                </svg>
              </span>
            </div>

            <div className="space-y-4">
              {talleres.map((item) => (
                <article
                  key={item.titulo}
                  className="rounded-2xl bg-[var(--supra-surface-soft)] p-5"
                >
                  <h3 className="mb-2 text-lg font-bold uppercase">
                    {item.titulo}
                  </h3>
                  <p className="leading-7 text-[var(--supra-muted)]">
                    {item.descripcion}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--supra-border)] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--supra-gray-logo)]">
                  Espacios de acompañamiento
                </p>
                <h2 className="text-3xl font-bold">Grupos</h2>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--supra-border)] bg-[var(--supra-peach-soft)] text-[var(--supra-green-dark)] shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="8" r="3" />
                  <circle cx="16" cy="8" r="3" />
                  <path d="M3.5 20a4.5 4.5 0 0 1 9 0" />
                  <path d="M11.5 20a4.5 4.5 0 0 1 9 0" />
                </svg>
              </span>
            </div>

            <div className="space-y-4">
              {grupos.map((item) => (
                <article
                  key={item.titulo}
                  className="rounded-2xl bg-[var(--supra-surface-soft)] p-5"
                >
                  <h3 className="mb-2 text-lg font-bold uppercase">
                    {item.titulo}
                  </h3>
                  <p className="leading-7 text-[var(--supra-muted)]">
                    {item.descripcion}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-[2rem] border border-[var(--supra-border)] bg-white p-6 text-center shadow-sm">
          <h2 className="mb-3 text-2xl font-bold">
            ¿Querés consultar disponibilidad?
          </h2>

          <p className="mx-auto mb-6 max-w-2xl leading-7 text-[var(--supra-muted)]">
            Escribinos por WhatsApp y te contamos fechas, modalidad y próximos
            cupos disponibles.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-[var(--supra-green-strong)] px-7 py-3 text-center font-bold text-[var(--supra-text)] shadow-sm transition hover:bg-[var(--supra-green)]"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}