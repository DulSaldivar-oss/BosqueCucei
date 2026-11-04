import { NextResponse, type NextRequest } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { arbolesCerca } from "@/lib/consultas/publico";
import { permitir } from "@/lib/limite";
import { RADIO_CERCA_M } from "@/lib/mapa";
import { ipCliente } from "@/lib/red";

/** Árboles a RADIO_CERCA_M metros de la ubicación de la persona (para el mapa «cerca de mí»). */
export async function GET(peticion: NextRequest) {
  const parametros = peticion.nextUrl.searchParams;
  const latitud = Number(parametros.get("lat"));
  const longitud = Number(parametros.get("lng"));
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud) || Math.abs(latitud) > 90 || Math.abs(longitud) > 180 || !parametros.get("lat") || !parametros.get("lng")) {
    return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  }
  const usuario = await usuarioActual();
  // El mapa pide cada 10 m caminados: esto solo frena a quien intente bajar el inventario a lo bruto.
  if (!permitir(`cerca:${usuario?.id ?? ipCliente(peticion.headers)}`, 120, 10 * 60_000)) {
    return NextResponse.json({ error: "Demasiadas consultas. Espera unos minutos." }, { status: 429 });
  }
  const resultado = await arbolesCerca(usuario?.id ?? null, latitud, longitud, RADIO_CERCA_M);
  return NextResponse.json({ radio: RADIO_CERCA_M, ...resultado }, { headers: { "Cache-Control": "no-store" } });
}
