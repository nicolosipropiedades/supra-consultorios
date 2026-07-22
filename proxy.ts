import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "supra_admin_session";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const esLoginAdmin = pathname === "/admin/login";
  const esApiLogin = pathname === "/api/admin/login";
  const esApiLogout = pathname === "/api/admin/logout";

  const esPaginaAdmin = pathname.startsWith("/admin") && !esLoginAdmin;

  const esApiAdmin =
    pathname.startsWith("/api/admin") && !esApiLogin && !esApiLogout;

  if (!esPaginaAdmin && !esApiAdmin) {
    return NextResponse.next();
  }

  const tokenEsperado = process.env.ADMIN_SESSION_TOKEN;
  const tokenCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  const autorizado = tokenEsperado && tokenCookie === tokenEsperado;

  if (autorizado) {
    return NextResponse.next();
  }

  if (esApiAdmin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};