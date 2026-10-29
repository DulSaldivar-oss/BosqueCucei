import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { consulta, una } from "@/lib/db";

const COOKIE = "bosque_sesion";
const DURACION_DIAS = 60;

export interface Usuario {
  id: number;
  nombre: string;
  alias: string;
  correo: string;
  tipo_usuario: string;
  carrera_o_area: string | null;
  rol: "usuario" | "admin";
  xp: number;
  nivel: number;
  racha_semanas: number;
  ultima_semana_activa: string | null;
  fecha_alta: Date;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function crearSesion(usuarioId: number) {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACION_DIAS * 86_400_000);
  await consulta("INSERT INTO sesiones (token_hash, usuario_id, expira_en) VALUES ($1, $2, $3)", [
    hashToken(token),
    usuarioId,
    expira,
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expira,
  });
}

export async function cerrarSesion() {
  const almacen = await cookies();
  const token = almacen.get(COOKIE)?.value;
  if (token) await consulta("DELETE FROM sesiones WHERE token_hash = $1", [hashToken(token)]);
  almacen.delete(COOKIE);
}

/** Persona con sesión iniciada en esta petición, o null. */
export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return una<Usuario>(
    `SELECT u.id, u.nombre, u.alias, u.correo, u.tipo_usuario, u.carrera_o_area, u.rol, u.xp, u.nivel,
            u.racha_semanas, u.ultima_semana_activa, u.fecha_alta
     FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = $1 AND s.expira_en > now()`,
    [hashToken(token)],
  );
});

export async function requiereUsuario(siguiente = "/"): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect(`/entrar?siguiente=${encodeURIComponent(siguiente)}`);
  return usuario;
}

export async function requiereAdmin(): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/entrar?siguiente=/admin");
  if (usuario.rol !== "admin") redirect("/?aviso=sin-permiso");
  return usuario;
}
