type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;

  const tieneError = params.error === "1";
  const next = params.next ?? "/admin/agenda";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--supra-bg)] px-6 py-10 text-[var(--supra-text)]">
      <section className="w-full max-w-md rounded-[2rem] border border-[var(--supra-border)] bg-white p-7 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--supra-gray-logo)]">
          Administración
        </p>

        <h1 className="mb-3 text-3xl font-bold">Ingresar a la agenda</h1>

        <p className="mb-6 text-sm leading-6 text-[var(--supra-muted)]">
          Acceso exclusivo para la coordinación de SupRA Consultorios.
        </p>

        {tieneError && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Usuario o clave incorrectos.
          </div>
        )}

        <form action="/api/admin/login" method="POST" className="space-y-4">
          <input type="hidden" name="next" value={next} />

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Usuario</span>
            <input
              name="usuario"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-2xl border border-[var(--supra-border)] px-4 py-3 outline-none focus:border-[var(--supra-green-dark)]"
              placeholder="Usuario"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Clave</span>
            <input
              name="clave"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border border-[var(--supra-border)] px-4 py-3 outline-none focus:border-[var(--supra-green-dark)]"
              placeholder="Clave"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-full bg-[var(--supra-green-strong)] px-5 py-3 font-bold text-[var(--supra-text)] transition hover:bg-[var(--supra-green)]"
          >
            Ingresar
          </button>
        </form>
      </section>
    </main>
  );
}