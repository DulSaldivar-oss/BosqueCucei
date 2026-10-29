import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { una } from "@/lib/db";
import { borrarFoto, guardarFoto } from "@/lib/fotos";
import { permitir } from "@/lib/limite";
import { ErrorObservacion, registrarObservacion } from "@/lib/servicios/observar";

export async function POST(peticion: Request) {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ error: "Inicia sesión para registrar observaciones." }, { status: 401 });
  if (!permitir(`observar:${usuario.id}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Vas muy rápido. Espera unos minutos." }, { status: 429 });
  }

  let datos: FormData;
  try {
    datos = await peticion.formData();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  const arbol = await una<{ id: number }>("SELECT id FROM arboles WHERE codigo = $1 AND activo", [String(datos.get("arbol") ?? "")]);
  if (!arbol) return NextResponse.json({ error: "Ese árbol no existe." }, { status: 404 });

  let fotografia: string | null = null;
  const foto = datos.get("foto");
  if (foto instanceof File && foto.size > 0) {
    try {
      fotografia = await guardarFoto(foto);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  try {
    const resultado = await registrarObservacion({
      usuarioId: usuario.id,
      arbolId: arbol.id,
      estado: String(datos.get("estado") ?? ""),
      categorias: datos.getAll("categorias").map(String),
      comentario: String(datos.get("comentario") ?? ""),
      fotografia,
      duracionMs: Number(datos.get("duracion")) || null,
    });
    return NextResponse.json(resultado);
  } catch (error) {
    if (fotografia) await borrarFoto(fotografia);
    if (error instanceof ErrorObservacion) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar la observación." }, { status: 500 });
  }
}
