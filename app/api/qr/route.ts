import { NextResponse, type NextRequest } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { una } from "@/lib/db";
import { registrarEscaneo, resolverQr } from "@/lib/consultas/publico";

export async function GET(peticion: NextRequest) {
  const texto = peticion.nextUrl.searchParams.get("texto")?.slice(0, 500) ?? "";
  if (!texto) return NextResponse.json({ codigo: null }, { status: 400 });
  const codigo = await resolverQr(texto);
  if (codigo) {
    const [usuario, arbol] = await Promise.all([usuarioActual(), una<{ id: number }>("SELECT id FROM arboles WHERE codigo = $1", [codigo])]);
    if (arbol) await registrarEscaneo(arbol.id, usuario?.id ?? null);
  }
  return NextResponse.json({ codigo });
}
