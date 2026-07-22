import { NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "supra_admin_session";

function normalizarNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/admin/agenda";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/admin/agenda";
  }

  return value;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const usuario = String(formData.get("usuario") ?? "");
  const clave = String(formData.get("clave") ?? "");
  const next = normalizarNext(formData.get("next"));

  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminSessionToken = process.env.ADMIN_SESSION_TOKEN;

  if (!adminUser || !adminPassword || !adminSessionToken) {
    const url = new URL("/admin/login?error=1", request.url);
    return NextResponse.redirect(url);
  }

  const loginOk = usuario === adminUser && clave === adminPassword;

  if (!loginOk) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);

    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(new URL(next, request.url));

  response.cookies.set(ADMIN_COOKIE_NAME, adminSessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}