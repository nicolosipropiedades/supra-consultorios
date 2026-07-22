import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";

export default async function Home() {
  const { data: centro } = await supabase
    .from("centro_configuracion")
    .select("nombre_centro, direccion, whatsapp, instagram, google_maps_url")
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  const nombreCentro = centro?.nombre_centro ?? "SupRA Consultorios";
  const direccion = centro?.direccion ?? "Timoteo Gordillo 1482, CABA";
  const whatsapp = centro?.whatsapp ?? "1131515331";
  const instagram = centro?.instagram ?? "supra.consultorios";

  const whatsappSoloNumeros = whatsapp.replace(/\D/g, "");

  const mapsUrl =
    centro?.google_maps_url ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      direccion
    )}`;

  const whatsappGeneral = `https://wa.me/549${whatsappSoloNumeros}?text=${encodeURIComponent(
    "Hola, quisiera consultar por turnos en SupRA Consultorios."
  )}`;

  const instagramUrl = `https://www.instagram.com/${instagram}`;

  return (
    <main className="min-h-screen bg-[var(--supra-bg)] text-[var(--supra-text)]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-10">
        <div className="grid items-start gap-10 pt-14 pb-10 md:grid-cols-[1.1fr_0.9fr]">
          <section className="relative">
            <div className="absolute -top-16 left-0 inline-flex rounded-full bg-[var(--supra-yellow-soft)] px-4 py-2 text-sm font-semibold text-[var(--supra-text)] shadow-sm">
              Turnos presenciales en CABA
            </div>

            <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Reservá tu turno online en {nombreCentro}
            </h1>

            <p className="mb-8 max-w-2xl text-lg leading-8 text-[var(--supra-muted)]">
              Elegí especialidad, profesional, día y horario. Para confirmar el
              turno abonás el valor total de la consulta online.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/turnos"
                className="rounded-full bg-[var(--supra-green-strong)] px-6 py-3 text-center font-bold text-[var(--supra-text)] shadow-sm transition hover:bg-[var(--supra-green)]"
              >
                Reservar turno
              </Link>

              <Link
  href="/grupos-y-talleres"
  className="rounded-full border border-[var(--supra-border)] bg-white px-6 py-3 text-center font-bold text-[var(--supra-text)] shadow-sm transition hover:bg-[var(--supra-peach-soft)]"
>
  Consultar grupos y talleres
</Link>
            </div>

            <div className="mt-8 flex flex-col gap-3 text-sm text-[var(--supra-muted)]">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 font-medium transition hover:text-[var(--supra-green-dark)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </span>
                <span>{direccion}</span>
              </a>

              <a
                href={whatsappGeneral}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 font-medium transition hover:text-[var(--supra-green-dark)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--supra-green)] shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="currentColor"
                  >
                    <path d="M20.52 3.48A11.78 11.78 0 0 0 12.15 0C5.62 0 .31 5.31.31 11.84c0 2.09.55 4.13 1.59 5.93L.21 24l6.38-1.67a11.8 11.8 0 0 0 5.56 1.41h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.16-1.23-6.13-3.48-8.42Zm-8.37 18.25h-.01a9.83 9.83 0 0 1-5.01-1.37l-.36-.22-3.78.99 1.01-3.69-.24-.38a9.82 9.82 0 0 1-1.5-5.22c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
                  </svg>
                </span>
                <span>WhatsApp: {whatsapp}</span>
              </a>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 font-medium transition hover:text-[var(--supra-green-dark)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--supra-peach-soft)] shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                </span>
                <span>@{instagram}</span>
              </a>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--supra-border)] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">¿Cómo funciona?</h2>

            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
                <p className="font-semibold">1. Elegís especialidad</p>
                <p className="text-sm text-[var(--supra-muted)]">
                  Psicología, psicopedagogía, fonoaudiología o psicomotricidad.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
                <p className="font-semibold">2. Seleccionás día y horario</p>
                <p className="text-sm text-[var(--supra-muted)]">
                  Solo se muestran turnos disponibles publicados por el centro.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
                <p className="font-semibold">3. Abonás el turno</p>
                <p className="text-sm text-[var(--supra-muted)]">
                  El turno queda confirmado una vez aprobado el pago online.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--supra-surface-soft)] p-4">
                <p className="font-semibold">4. Recibís la confirmación</p>
                <p className="text-sm text-[var(--supra-muted)]">
                  Te enviamos el detalle del turno por email.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}