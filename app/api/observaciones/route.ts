import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { una } from "@/lib/db";
import { borrarFoto, escribirFoto, revisarFoto, type FotoRevisada } from "@/lib/fotos";
import { evaluarGps, PRECISION_MAXIMA_M, RADIO_VISITA_M, viajeImposible } from "@/lib/juego/presencia";
import { permitir } from "@/lib/limite";
import { placaVigente } from "@/lib/presencia";
import { ErrorObservacion, registrarObservacion } from "@/lib/servicios/observar";

const rechazo = (status: number, error: string, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status });

/**
 * Registra una observación. Antitrampa (lib/juego/presencia.ts):
 *   1. la persona debe estar junto al árbol: escaneo reciente de su placa verificable o GPS a ≤ 50 m;
 *   2. no puede «saltar» entre árboles más rápido de lo creíble;
 *   3. no se acepta una foto que ya se usó en otra observación.
 */
export async function POST(peticion: Request) {
  const usuario = await usuarioActual();
  if (!usuario) return rechazo(401, "Inicia sesión para registrar observaciones.");
  if (!permitir(`observar:${usuario.id}`, 30, 10 * 60_000)) return rechazo(429, "Vas muy rápido. Espera unos minutos.");

  let datos: FormData;
  try {
    datos = await peticion.formData();
  } catch {
    return rechazo(400, "Datos inválidos.");
  }
  const arbol = await una<{ id: number; latitud: number; longitud: number }>(
    "SELECT id, latitud, longitud FROM arboles WHERE codigo = $1 AND activo",
    [String(datos.get("arbol") ?? "")],
  );
  if (!arbol) return rechazo(404, "Ese árbol no existe.");

  // 1. Presencia.
  const numero = (clave: string) => {
    const valor = datos.get(clave);
    return typeof valor === "string" && valor.trim() !== "" ? Number(valor) : NaN;
  };
  const gps = evaluarGps(arbol, { latitud: numero("latitud"), longitud: numero("longitud"), precision: numero("precision") });
  const precision = Number.isFinite(numero("precision")) ? numero("precision") : null;
  let presencia: { prueba: "gps" | "placa"; distancia: number | null; precision: number | null };
  if (await placaVigente(arbol.id, usuario.id, true)) {
    presencia = { prueba: "placa", distancia: gps.distancia, precision };
  } else if (gps.valida) {
    presencia = { prueba: "gps", distancia: gps.distancia, precision };
  } else {
    const mensaje =
      gps.motivo === "lejos"
        ? `Estás a ${Math.round(gps.distancia!)} m del árbol. Acércate a menos de ${RADIO_VISITA_M} m o escanea su placa.`
        : gps.motivo === "impreciso"
          ? `Tu ubicación es muy imprecisa (±${Math.round(precision ?? 0)} m; se necesitan ${PRECISION_MAXIMA_M} m o menos). Sal a cielo abierto unos segundos o escanea la placa.`
          : "Necesitamos tu ubicación para confirmar que estás junto al árbol. Actívala o escanea la placa del árbol.";
    return rechazo(403, mensaje, { motivo: gps.motivo, distancia: gps.distancia });
  }

  // 2. Velocidad desde el árbol anterior.
  const anterior = await una<{ latitud: number; longitud: number; fecha: Date }>(
    `SELECT a.latitud, a.longitud, o.fecha FROM observaciones o JOIN arboles a ON a.id = o.arbol_id
     WHERE o.usuario_id = $1 AND o.arbol_id <> $2 ORDER BY o.fecha DESC LIMIT 1`,
    [usuario.id, arbol.id],
  );
  if (anterior && viajeImposible(anterior, { ...arbol, fecha: new Date() })) {
    return rechazo(429, "Llegaste demasiado rápido desde el árbol anterior. Camina hasta este árbol y vuelve a intentarlo.", { motivo: "velocidad" });
  }

  // 3. Foto nueva.
  let revisada: FotoRevisada | null = null;
  const foto = datos.get("foto");
  if (foto instanceof File && foto.size > 0) {
    try {
      revisada = await revisarFoto(foto);
    } catch (error) {
      return rechazo(400, (error as Error).message);
    }
    if (await una("SELECT 1 FROM observaciones WHERE foto_hash = $1 LIMIT 1", [revisada.huella])) {
      return rechazo(400, "Esa foto ya se usó en otra observación. Toma una nueva del árbol.", { motivo: "foto-repetida" });
    }
  }

  const fotografia = revisada ? await escribirFoto(revisada) : null;
  try {
    const resultado = await registrarObservacion({
      usuarioId: usuario.id,
      arbolId: arbol.id,
      estado: String(datos.get("estado") ?? ""),
      categorias: datos.getAll("categorias").map(String),
      comentario: String(datos.get("comentario") ?? ""),
      fotografia,
      fotoHash: revisada?.huella ?? null,
      duracionMs: Number(datos.get("duracion")) || null,
      presencia,
    });
    return NextResponse.json(resultado);
  } catch (error) {
    if (fotografia) await borrarFoto(fotografia);
    if (error instanceof ErrorObservacion) return rechazo(400, error.message);
    console.error(error);
    return rechazo(500, "No se pudo guardar la observación.");
  }
}
