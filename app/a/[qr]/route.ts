import { NextResponse, type NextRequest } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { una } from "@/lib/db";
import { registrarEscaneo, resolverQr } from "@/lib/consultas/publico";

/** Destino de los QR impresos: /a/<qr_id>. Registra el escaneo y abre la ficha. */
export async function GET(peticion: NextRequest, { params }: { params: Promise<{ qr: string }> }) {
  const { qr } = await params;
  const codigo = await resolverQr(decodeURIComponent(qr));
  if (!codigo) return NextResponse.redirect(new URL("/escanear?desconocido=1", peticion.url));
  const [usuario, arbol] = await Promise.all([usuarioActual(), una<{ id: number }>("SELECT id FROM arboles WHERE codigo = $1", [codigo])]);
  if (arbol) await registrarEscaneo(arbol.id, usuario?.id ?? null);
  return NextResponse.redirect(new URL(`/arbol/${codigo}?origen=qr`, peticion.url));
}
