import { NextResponse, type NextRequest } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { arbolesCerca } from "@/lib/consultas/publico";
import { RADIO_CERCA_M } from "@/lib/mapa";

/** Árboles a RADIO_CERCA_M metros de la ubicación de la persona (para el mapa «cerca de mí»). */
export async function GET(peticion: NextRequest) {
  const parametros = peticion.nextUrl.searchParams;
  const latitud = Number(parametros.get("lat"));
  const longitud = Number(parametros.get("lng"));
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || Math.abs(latitud) > 90 || Math.abs(longitud) > 180 || !parametros.get("lat") || !parametros.get("lng")) {
    return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  }
  const usuario = await usuarioActual();
  const resultado = await arbolesCerca(usuario?.id ?? null, latitud, longitud, RADIO_CERCA_M);
  return NextResponse.json({ radio: RADIO_CERCA_M, ...resultado }, { headers: { "Cache-Control": "no-store" } });
}
