import { NextResponse, type NextRequest } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { registrarEscaneo, resolverQr } from "@/lib/consultas/publico";
import { una } from "@/lib/db";
import { permitir } from "@/lib/limite";
import { ponerCookiePlaca, registrarPresenciaPlaca } from "@/lib/presencia";
import { ipCliente } from "@/lib/red";

/** Destino de los QR impresos (/a/<qr_id>), al escanearlos con la cámara del teléfono. */
export async function GET(peticion: NextRequest, { params }: { params: Promise<{ qr: string }> }) {
  const { qr } = await params;
  const usuario = await usuarioActual();
  if (!permitir(`qr:${usuario?.id ?? ipCliente(peticion.headers)}`, 60, 10 * 60_000)) {
    return NextResponse.redirect(new URL("/escanear", peticion.url));
  }
  const encontrado = await resolverQr(decodeURIComponent(qr).slice(0, 500));
  if (!encontrado) return NextResponse.redirect(new URL("/escanear?desconocido=1", peticion.url));
  const respuesta = NextResponse.redirect(new URL(`/arbol/${encontrado.codigo}?origen=qr`, peticion.url));
  const arbol = await una<{ id: number }>("SELECT id FROM arboles WHERE codigo = $1", [encontrado.codigo]);
  if (arbol) {
    await registrarEscaneo(arbol.id, usuario?.id ?? null);
    if (encontrado.placa) ponerCookiePlaca(respuesta, await registrarPresenciaPlaca(arbol.id, usuario?.id ?? null));
  }
  return respuesta;
}
