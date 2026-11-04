import { NextResponse, type NextRequest } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { registrarEscaneo, resolverQr } from "@/lib/consultas/publico";
import { una } from "@/lib/db";
import { permitir } from "@/lib/limite";
import { ponerCookiePlaca, registrarPresenciaPlaca } from "@/lib/presencia";
import { ipCliente } from "@/lib/red";

/** Lo que leyó el escáner de la app (o lo que se escribió a mano) → código del árbol. */
export async function GET(peticion: NextRequest) {
  const texto = peticion.nextUrl.searchParams.get("texto")?.slice(0, 500) ?? "";
  if (!texto) return NextResponse.json({ codigo: null }, { status: 400 });
  const usuario = await usuarioActual();
  if (!permitir(`qr:${usuario?.id ?? ipCliente(peticion.headers)}`, 60, 10 * 60_000)) {
    return NextResponse.json({ codigo: null, error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }
  const encontrado = await resolverQr(texto);
  if (!encontrado) return NextResponse.json({ codigo: null });
  const respuesta = NextResponse.json({ codigo: encontrado.codigo, placa: encontrado.placa });
  const arbol = await una<{ id: number }>("SELECT id FROM arboles WHERE codigo = $1", [encontrado.codigo]);
  if (arbol) {
    await registrarEscaneo(arbol.id, usuario?.id ?? null);
    // Solo el QR verificable de la placa prueba que la persona está frente al árbol.
    if (encontrado.placa) ponerCookiePlaca(respuesta, await registrarPresenciaPlaca(arbol.id, usuario?.id ?? null));
  }
  return respuesta;
}
