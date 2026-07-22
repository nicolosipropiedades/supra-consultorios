import { NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "supra_admin_session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));

  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}