"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cerrarSesion, crearSesion } from "@/lib/auth";
import { hashContrasena, verificarContrasena } from "@/lib/contrasenas";
import { consulta, una } from "@/lib/db";
import { permitir } from "@/lib/limite";

export interface EstadoFormulario {
  error?: string;
  campos?: Record<string, string>;
}

/** Solo rutas internas para evitar redirecciones abiertas. */
function destinoSeguro(valor: FormDataEntryValue | null) {
  const texto = typeof valor === "string" ? valor : "";
  return texto.startsWith("/") && !texto.startsWith("//") ? texto : "/";
}

async function ipCliente() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip") ?? "local";
}

export async function iniciarSesion(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");
  const campos = { correo };
  if (!permitir(`entrar:${await ipCliente()}`, 10, 10 * 60_000) || !permitir(`entrar:${correo}`, 6, 10 * 60_000)) {
    return { error: "Demasiados intentos. Espera unos minutos.", campos };
  }
  const usuario = await una<{ id: number; hash_contrasena: string }>(
    "SELECT id, hash_contrasena FROM usuarios WHERE correo = $1",
    [correo],
  );
  if (!usuario || !(await verificarContrasena(contrasena, usuario.hash_contrasena))) {
    return { error: "Correo o contraseña incorrectos.", campos };
  }
  await crearSesion(usuario.id);
  redirect(destinoSeguro(datos.get("siguiente")));
}

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  alias: z
    .string()
    .trim()
    .min(3, "El alias debe tener al menos 3 caracteres.")
    .max(24, "El alias puede tener hasta 24 caracteres.")
    .regex(/^[\p{L}\p{N}_.-]+$/u, "Usa solo letras, números, punto, guion o guion bajo (sin espacios)."),
  correo: z.email("Escribe un correo válido.").transform((c) => c.toLowerCase()),
  contrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(200),
  tipo_usuario: z.enum(["alumno", "academico", "administrativo", "visitante"], "Elige cómo participas."),
  carrera_o_area: z.string().trim().max(120).optional(),
  aviso: z.literal("si", "Necesitamos que aceptes el aviso de privacidad."),
});

export async function registrarse(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const crudo = Object.fromEntries(["nombre", "alias", "correo", "contrasena", "tipo_usuario", "carrera_o_area", "aviso"].map((k) => [k, String(datos.get(k) ?? "")]));
  const campos = { ...crudo, contrasena: "" };
  if (!permitir(`registro:${await ipCliente()}`, 8, 60 * 60_000)) {
    return { error: "Demasiados registros desde esta red. Intenta más tarde.", campos };
  }
  const resultado = esquemaRegistro.safeParse(crudo);
  if (!resultado.success) return { error: resultado.error.issues[0].message, campos };
  const d = resultado.data;
  const repetido = await una<{ correo: string; alias: string }>(
    "SELECT correo, alias FROM usuarios WHERE correo = $1 OR lower(alias) = lower($2)",
    [d.correo, d.alias],
  );
  if (repetido) {
    return {
      error: repetido.correo === d.correo ? "Ya existe una cuenta con ese correo." : "Ese alias ya lo usa alguien más.",
      campos,
    };
  }
  const [{ id }] = await consulta<{ id: number }>(
    `INSERT INTO usuarios (nombre, alias, correo, hash_contrasena, tipo_usuario, carrera_o_area)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [d.nombre, d.alias, d.correo, await hashContrasena(d.contrasena), d.tipo_usuario, d.carrera_o_area || null],
  );
  await crearSesion(id);
  redirect(destinoSeguro(datos.get("siguiente")));
}

export async function salir() {
  await cerrarSesion();
  redirect("/");
}
