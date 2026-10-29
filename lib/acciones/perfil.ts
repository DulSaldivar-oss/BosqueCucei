"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { usuarioActual } from "@/lib/auth";
import { consulta, una } from "@/lib/db";
import { permitir } from "@/lib/limite";

export interface EstadoPerfil {
  ok?: string;
  error?: string;
}

const esquema = z.object({
  alias: z
    .string()
    .trim()
    .min(3, "El alias debe tener al menos 3 caracteres.")
    .max(24)
    .regex(/^[\p{L}\p{N}_.-]+$/u, "Usa solo letras, números, punto, guion o guion bajo."),
  carrera_o_area: z.string().trim().max(120),
});

export async function actualizarPerfil(_: EstadoPerfil, datos: FormData): Promise<EstadoPerfil> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión terminó." };
  const r = esquema.safeParse({ alias: datos.get("alias"), carrera_o_area: datos.get("carrera_o_area") ?? "" });
  if (!r.success) return { error: r.error.issues[0].message };
  const ocupado = await una("SELECT 1 FROM usuarios WHERE lower(alias) = lower($1) AND id <> $2", [r.data.alias, usuario.id]);
  if (ocupado) return { error: "Ese alias ya lo usa alguien más." };
  await consulta("UPDATE usuarios SET alias = $2, carrera_o_area = $3 WHERE id = $1", [usuario.id, r.data.alias, r.data.carrera_o_area || null]);
  revalidatePath("/", "layout");
  return { ok: "Guardado." };
}

export async function enviarRetroalimentacion(_: EstadoPerfil, datos: FormData): Promise<EstadoPerfil> {
  const usuario = await usuarioActual();
  const mensaje = String(datos.get("mensaje") ?? "").trim().slice(0, 1000);
  if (mensaje.length < 5) return { error: "Cuéntanos un poco más." };
  if (!permitir(`retro:${usuario?.id ?? "anonimo"}`, 5, 60 * 60_000)) return { error: "Ya recibimos varios mensajes tuyos. ¡Gracias!" };
  await consulta("INSERT INTO retroalimentacion (usuario_id, pagina, mensaje) VALUES ($1, $2, $3)", [
    usuario?.id ?? null,
    String(datos.get("pagina") ?? "").slice(0, 200) || null,
    mensaje,
  ]);
  return { ok: "¡Gracias! Lo revisará el equipo." };
}
