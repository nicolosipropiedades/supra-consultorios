import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reservaId = searchParams.get("reservaId");

  if (!reservaId) {
    return NextResponse.json(
      { error: "Falta el ID de la reserva." },
      { status: 400 }
    );
  }

  const { data: reserva, error } = await supabaseAdmin
    .from("reservas")
    .select("id, estado")
    .eq("id", reservaId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "No se pudo consultar el estado de la reserva.",
        detalle: error.message,
      },
      { status: 500 }
    );
  }

  if (!reserva) {
    return NextResponse.json(
      { error: "No se encontró la reserva." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    estado: reserva.estado,
  });
}