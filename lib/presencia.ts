import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { consulta, una } from "@/lib/db";
import { VIGENCIA_PLACA_MIN } from "@/lib/juego/presencia";

/**
 * Prueba de presencia por placa: al escanear un QR verificable se guarda un token aleatorio en
 * una cookie httpOnly y su huella en la base. Vale VIGENCIA_PLACA_MIN minutos, solo para ese árbol
 * y para la primera persona que lo use (no se puede compartir).
 */
export const COOKIE_PLACA = "bosque_placa";
const huella = (token: string) => createHash("sha256").update(token).digest("hex");

export async function registrarPresenciaPlaca(arbolId: number, usuarioId: number | null): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await consulta("INSERT INTO presencias_placa (token_hash, arbol_id, usuario_id) VALUES ($1, $2, $3)", [huella(token), arbolId, usuarioId]);
  // Limpieza ocasional de escaneos viejos.
  if (Math.random() < 0.05) await consulta("DELETE FROM presencias_placa WHERE creada_en < now() - interval '1 day'");
  return token;
}

export function ponerCookiePlaca(respuesta: NextResponse, token: string) {
  respuesta.cookies.set(COOKIE_PLACA, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VIGENCIA_PLACA_MIN * 60,
  });
}

/** ¿Esta persona escaneó la placa de este árbol hace poco? Si `usar`, queda ligada a ella. */
export async function placaVigente(arbolId: number, usuarioId: number, usar = false): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_PLACA)?.value;
  if (!token) return false;
  const condicion = `token_hash = $1 AND arbol_id = $2 AND creada_en > now() - make_interval(mins => $3)
                     AND (usuario_id IS NULL OR usuario_id = $4)`;
  const parametros = [huella(token), arbolId, VIGENCIA_PLACA_MIN, usuarioId];
  if (!usar) return !!(await una(`SELECT 1 FROM presencias_placa WHERE ${condicion}`, parametros));
  return !!(await una(`UPDATE presencias_placa SET usuario_id = $4 WHERE ${condicion} RETURNING 1`, parametros));
}
