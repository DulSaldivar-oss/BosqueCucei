"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { leerAjustes } from "@/lib/ajustes";
import { requiereAdmin } from "@/lib/auth";
import { consulta, transaccion, una } from "@/lib/db";
import { guardarFoto } from "@/lib/fotos";
import { leerCsv } from "@/lib/csv";
import { nivelPorXp } from "@/lib/juego/niveles";
import { diaLocal } from "@/lib/juego/semana";
import { reevaluarArbol } from "@/lib/servicios/alertas";

export interface EstadoAccion {
  ok?: string;
  error?: string;
}

// ───────────────────────── Alertas ─────────────────────────

const esquemaAlerta = z.object({
  id: z.coerce.number().int(),
  estado_revision: z.enum(["abierta", "en_revision", "resuelta", "descartada"]),
  responsable: z.string().trim().max(120),
  resolucion: z.string().trim().max(2000),
  util: z.enum(["", "si", "no"]),
  inspeccion: z.string().optional(),
});

export async function actualizarAlerta(_: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  await requiereAdmin();
  const r = esquemaAlerta.safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;
  const cerrada = d.estado_revision === "resuelta" || d.estado_revision === "descartada";
  if (cerrada && !d.resolucion) return { error: "Escribe qué se encontró o qué se hizo antes de cerrar la alerta." };
  try {
    await transaccion(async (c) => {
      const alerta = await una<{ arbol_id: number }>(
        `UPDATE alertas SET estado_revision = $2, responsable = nullif($3, ''), resolucion = nullif($4, ''),
           util = CASE $5 WHEN 'si' THEN true WHEN 'no' THEN false ELSE NULL END,
           resuelta_en = CASE WHEN $6 THEN coalesce(resuelta_en, now()) ELSE NULL END, actualizada_en = now()
         WHERE id = $1 RETURNING arbol_id`,
        [d.id, d.estado_revision, d.responsable, d.resolucion, d.util, cerrada],
        c,
      );
      if (!alerta) throw new Error("La alerta no existe.");
      if (d.inspeccion === "si") {
        await consulta("UPDATE arboles SET ultima_inspeccion = $2 WHERE id = $1", [alerta.arbol_id, diaLocal(new Date())], c);
      }
      await reevaluarArbol(c, alerta.arbol_id, await leerAjustes(c));
    });
  } catch (error) {
    const mensaje = (error as Error).message;
    // Reabrir una alerta cuando el árbol ya tiene otra abierta choca con el índice único.
    return { error: mensaje.includes("alertas_una_abierta") ? "Este árbol ya tiene otra alerta abierta." : mensaje };
  }
  revalidatePath("/admin", "layout");
  return { ok: cerrada ? "Alerta cerrada. El semáforo del árbol se recalculó." : "Cambios guardados." };
}

// ───────────────────────── Observaciones ─────────────────────────

/**
 * Validar o rechazar una observación ajusta la experiencia de quien la hizo para que
 * siempre refleje el estado final: válida = lo ganado + bono; rechazada = 0; sin revisar = lo ganado.
 */
export async function validarObservacion(id: number, valida: boolean | null) {
  const admin = await requiereAdmin();
  await transaccion(async (c) => {
    const obs = await una<{ usuario_id: number; arbol_id: number; xp_otorgada: number; validada: boolean | null }>(
      "SELECT usuario_id, arbol_id, xp_otorgada, validada FROM observaciones WHERE id = $1 FOR UPDATE",
      [id],
      c,
    );
    if (!obs || obs.validada === valida) return;
    const ajustes = await leerAjustes(c);
    await una("SELECT 1 FROM usuarios WHERE id = $1 FOR UPDATE", [obs.usuario_id], c);
    const [{ vigente }] = await consulta<{ vigente: number }>(
      "SELECT coalesce(sum(cantidad), 0)::int AS vigente FROM xp_eventos WHERE observacion_id = $1",
      [id],
      c,
    );
    const objetivo = valida === true ? obs.xp_otorgada + ajustes.xp_validacion : valida === false ? 0 : obs.xp_otorgada;
    const diferencia = objetivo - vigente;
    if (diferencia !== 0) {
      await consulta(
        "INSERT INTO xp_eventos (usuario_id, cantidad, motivo, detalle, observacion_id) VALUES ($1, $2, $3, $4, $5)",
        [
          obs.usuario_id,
          diferencia,
          diferencia > 0 ? "validacion" : "revocacion",
          diferencia > 0 ? "Observación confirmada por Sustentabilidad" : "Observación no válida",
          id,
        ],
        c,
      );
      const usuario = await una<{ xp: number }>("UPDATE usuarios SET xp = greatest(0, xp + $2) WHERE id = $1 RETURNING xp", [obs.usuario_id, diferencia], c);
      await consulta("UPDATE usuarios SET nivel = $2 WHERE id = $1", [obs.usuario_id, nivelPorXp(usuario!.xp)], c);
    }
    await consulta("UPDATE observaciones SET validada = $2, revisada_por = $3, revisada_en = now() WHERE id = $1", [id, valida, admin.id], c);
    await reevaluarArbol(c, obs.arbol_id, ajustes);
  });
  revalidatePath("/admin", "layout");
}

// ───────────────────────── Árboles ─────────────────────────

const esquemaArbol = z.object({
  id: z.coerce.number().int().optional(),
  codigo: z
    .string()
    .trim()
    .min(2, "Escribe el código de la placa.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "El código solo puede tener letras, números, guion y guion bajo."),
  qr_id: z.string().trim().max(500),
  especie_id: z.coerce.number().int().positive("Elige la especie."),
  apodo: z.string().trim().max(80),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  zona: z.string().trim().min(1, "Escribe la zona.").max(80),
  fecha_registro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  altura_m: z.string().trim(),
  diametro_cm: z.string().trim(),
  notas_publicas: z.string().trim().max(1000),
  activo: z.string().optional(),
});

const numeroOpcional = (v: string) => (v === "" ? null : Number(v));

export async function guardarArbol(_: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  await requiereAdmin();
  const r = esquemaArbol.safeParse(Object.fromEntries([...datos.entries()].filter(([, v]) => typeof v === "string")));
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;
  const altura = numeroOpcional(d.altura_m);
  const diametro = numeroOpcional(d.diametro_cm);
  if ((altura !== null && !(altura >= 0)) || (diametro !== null && !(diametro >= 0))) return { error: "Altura y diámetro deben ser números." };

  let foto: string | null = null;
  const archivo = datos.get("foto");
  if (archivo instanceof File && archivo.size > 0) {
    try {
      foto = await guardarFoto(archivo);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  const valores = [
    d.codigo.toUpperCase(),
    d.qr_id || d.codigo.toUpperCase(),
    d.especie_id,
    d.apodo || null,
    d.latitud,
    d.longitud,
    d.zona,
    d.fecha_registro,
    altura,
    diametro,
    d.notas_publicas || null,
    d.activo === "si",
  ];
  try {
    if (d.id) {
      await consulta(
        `UPDATE arboles SET codigo = $2, qr_id = $3, especie_id = $4, apodo = $5, latitud = $6, longitud = $7, zona = $8,
           fecha_registro = $9, altura_m = $10, diametro_cm = $11, notas_publicas = $12, activo = $13,
           foto_principal = coalesce($14, foto_principal)
         WHERE id = $1`,
        [d.id, ...valores, foto],
      );
    } else {
      await consulta(
        `INSERT INTO arboles (codigo, qr_id, especie_id, apodo, latitud, longitud, zona, fecha_registro, altura_m, diametro_cm,
                              notas_publicas, activo, foto_principal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [...valores, foto],
      );
    }
  } catch (e) {
    const mensaje = (e as Error).message;
    if (mensaje.includes("arboles_codigo_key")) return { error: "Ya existe un árbol con ese código." };
    if (mensaje.includes("arboles_qr_id_key")) return { error: "Ese contenido de QR ya pertenece a otro árbol." };
    throw e;
  }
  revalidatePath("/admin/arboles");
  redirect(`/admin/arboles/${d.codigo.toUpperCase()}?guardado=1`);
}

export interface ResultadoImportacion extends EstadoAccion {
  vista?: { fila: number; codigo: string; especie: string; zona: string; accion: "crear" | "actualizar" }[];
  errores?: { fila: number; mensaje: string }[];
  csv?: string;
}

/**
 * Importa el inventario real desde CSV. Columnas: codigo, especie, latitud, longitud, zona
 * y opcionales qr_id, apodo, altura_m, diametro_cm, fecha_registro. `especie` acepta el
 * identificador, el nombre científico o el nombre común.
 */
export async function importarArboles(_: ResultadoImportacion, datos: FormData): Promise<ResultadoImportacion> {
  await requiereAdmin();
  let texto = String(datos.get("csv") ?? "");
  const archivo = datos.get("archivo");
  if (archivo instanceof File && archivo.size > 0) texto = await archivo.text();
  if (!texto.trim()) return { error: "Pega el CSV o elige un archivo." };
  const { encabezados, filas } = leerCsv(texto);
  const faltan = ["codigo", "especie", "latitud", "longitud", "zona"].filter((c) => !encabezados.includes(c));
  if (faltan.length) return { error: `Faltan columnas: ${faltan.join(", ")}.`, csv: texto };

  const especies = await consulta<{ id: number; slug: string; nombre_comun: string; nombre_cientifico: string }>(
    "SELECT id, slug, nombre_comun, nombre_cientifico FROM especies",
  );
  const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  const buscarEspecie = (valor: string) =>
    especies.find((e) => [e.slug, e.nombre_comun, e.nombre_cientifico].some((n) => normal(n) === normal(valor)));
  const existentes = new Set((await consulta<{ codigo: string }>("SELECT codigo FROM arboles")).map((a) => a.codigo));

  const errores: { fila: number; mensaje: string }[] = [];
  const validas: { fila: number; valores: unknown[]; codigo: string; especie: string; zona: string }[] = [];
  const vistos = new Set<string>();
  // Excel en español escribe «20,65»: se acepta coma decimal.
  const numero = (v: string | undefined) => (v ? Number(v.trim().replace(",", ".")) : NaN);
  filas.forEach((f, i) => {
    const fila = i + 2;
    const codigo = (f.codigo ?? "").trim().toUpperCase();
    const especie = buscarEspecie(f.especie ?? "");
    const lat = numero(f.latitud);
    const lng = numero(f.longitud);
    if (!/^[A-Z0-9_-]{2,40}$/.test(codigo)) return errores.push({ fila, mensaje: `Código inválido «${f.codigo ?? ""}»` });
    if (vistos.has(codigo)) return errores.push({ fila, mensaje: `Código repetido ${codigo}` });
    if (!especie) return errores.push({ fila, mensaje: `Especie desconocida «${f.especie ?? ""}». Agrégala primero al catálogo.` });
    if (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180) || !f.latitud || !f.longitud) {
      return errores.push({ fila, mensaje: "Latitud o longitud inválidas" });
    }
    if (!f.zona?.trim()) return errores.push({ fila, mensaje: "Falta la zona" });
    const fecha = f.fecha_registro?.trim();
    if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return errores.push({ fila, mensaje: "fecha_registro debe ser AAAA-MM-DD" });
    vistos.add(codigo);
    validas.push({
      fila,
      codigo,
      especie: especie.nombre_comun,
      zona: f.zona.trim(),
      valores: [
        codigo,
        f.qr_id?.trim() || codigo,
        especie.id,
        f.apodo?.trim() || null,
        lat,
        lng,
        f.zona.trim(),
        fecha || diaLocal(new Date()),
        f.altura_m ? numero(f.altura_m) || null : null,
        f.diametro_cm ? numero(f.diametro_cm) || null : null,
      ],
    });
  });

  if (datos.get("modo") !== "importar") {
    return {
      csv: texto,
      errores,
      vista: validas.map((v) => ({ fila: v.fila, codigo: v.codigo, especie: v.especie, zona: v.zona, accion: existentes.has(v.codigo) ? "actualizar" : "crear" })),
    };
  }
  if (errores.length) return { csv: texto, errores, error: "Corrige los errores antes de importar." };
  try {
    await transaccion(async (c) => {
      for (const v of validas) {
        await consulta(
          `INSERT INTO arboles (codigo, qr_id, especie_id, apodo, latitud, longitud, zona, fecha_registro, altura_m, diametro_cm)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (codigo) DO UPDATE SET qr_id = EXCLUDED.qr_id, especie_id = EXCLUDED.especie_id, apodo = EXCLUDED.apodo,
             latitud = EXCLUDED.latitud, longitud = EXCLUDED.longitud, zona = EXCLUDED.zona,
             fecha_registro = EXCLUDED.fecha_registro, altura_m = EXCLUDED.altura_m, diametro_cm = EXCLUDED.diametro_cm`,
          v.valores,
          c,
        );
      }
    });
  } catch (e) {
    const mensaje = (e as Error).message;
    return { csv: texto, error: mensaje.includes("qr_id") ? "Hay un qr_id que ya usa otro árbol." : mensaje };
  }
  revalidatePath("/admin/arboles");
  return { ok: `Listo: ${validas.length} árboles importados.` };
}

// ───────────────────────── Especies ─────────────────────────

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido");
const esquemaGenoma = z.object({
  copa: z.enum(["redonda", "paraguas", "conica", "columnar", "llorona", "palmera", "abierta"]),
  hojas: z.tuple([color, color, color]),
  tronco: color,
  flor: color.nullable().optional(),
  densidadFlor: z.number().min(0).max(1).optional(),
  alto: z.number().min(0.5).max(1.6).optional(),
  ancho: z.number().min(0.5).max(1.6).optional(),
});

export async function guardarEspecie(_: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  await requiereAdmin();
  let genoma;
  try {
    genoma = esquemaGenoma.parse(JSON.parse(String(datos.get("sprite"))));
  } catch {
    return { error: "El sprite no es válido." };
  }
  const r = z
    .object({
      id: z.coerce.number().int(),
      nombre_comun: z.string().trim().min(2).max(80),
      nombre_cientifico: z.string().trim().min(3).max(120),
      familia: z.string().trim().min(2).max(80),
      origen: z.enum(["nativa", "introducida"]),
      descripcion: z.string().trim().min(10, "La descripción es muy corta.").max(2000),
      dato_curioso: z.string().trim().max(500),
    })
    .safeParse(Object.fromEntries([...datos.entries()].filter(([k]) => k !== "sprite")));
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;
  await consulta(
    `UPDATE especies SET nombre_comun = $2, nombre_cientifico = $3, familia = $4, origen = $5, descripcion = $6,
       dato_curioso = nullif($7, ''), sprite = $8, color_flor = coalesce($9, color_flor) WHERE id = $1`,
    [d.id, d.nombre_comun, d.nombre_cientifico, d.familia, d.origen, d.descripcion, d.dato_curioso, JSON.stringify(genoma), genoma.flor ?? null],
  );
  revalidatePath("/", "layout");
  return { ok: "Especie guardada. Copia el genoma a data/especies.json para conservarlo en el repositorio." };
}

// ───────────────────────── Misiones ─────────────────────────

const esquemaMision = z.object({
  id: z.coerce.number().int().optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]{3,60}$/, "El identificador usa minúsculas, números y guiones."),
  titulo: z.string().trim().min(3).max(80),
  descripcion: z.string().trim().min(5).max(300),
  tipo: z.enum(["visitar_arboles", "descubrir_especies", "constancia", "zona", "fotografo"]),
  meta: z.coerce.number().int().min(1).max(200),
  zona: z.string().trim().max(80),
  recompensa_xp: z.coerce.number().int().min(0).max(1000),
  icono: z.enum(["regadera", "lupa", "corazon", "mapa", "camara", "hoja", "estrella"]),
  periodicidad: z.enum(["semanal", "unica"]),
  inicia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  termina: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function guardarMision(_: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  await requiereAdmin();
  const crudo = Object.fromEntries(datos);
  if (!crudo.id) delete crudo.id;
  const r = esquemaMision.safeParse(crudo);
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;
  if (d.tipo === "zona" && !d.zona) return { error: "Las misiones de zona necesitan la zona." };
  if (d.termina < d.inicia) return { error: "La fecha de término es anterior al inicio." };
  const valores = [d.slug, d.titulo, d.descripcion, d.tipo, d.meta, d.tipo === "zona" ? d.zona : null, d.recompensa_xp, d.icono, d.periodicidad, d.inicia, d.termina];
  try {
    if (d.id) {
      await consulta(
        `UPDATE misiones SET slug=$2, titulo=$3, descripcion=$4, tipo=$5, meta=$6, zona=$7, recompensa_xp=$8, icono=$9,
           periodicidad=$10, inicia=$11, termina=$12 WHERE id=$1`,
        [d.id, ...valores],
      );
    } else {
      await consulta(
        `INSERT INTO misiones (slug, titulo, descripcion, tipo, meta, zona, recompensa_xp, icono, periodicidad, inicia, termina)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        valores,
      );
    }
  } catch (e) {
    if ((e as Error).message.includes("misiones_slug_key")) return { error: "Ya existe una misión con ese identificador." };
    throw e;
  }
  revalidatePath("/admin/misiones");
  revalidatePath("/misiones");
  return { ok: d.id ? "Misión actualizada." : "Misión creada." };
}

export async function alternarMision(id: number) {
  await requiereAdmin();
  await consulta("UPDATE misiones SET activa = NOT activa WHERE id = $1", [id]);
  revalidatePath("/admin/misiones");
  revalidatePath("/misiones");
}

// ───────────────────────── Personas, ajustes y comentarios ─────────────────────────

export async function cambiarRol(id: number, rol: "usuario" | "admin") {
  const admin = await requiereAdmin();
  if (id === admin.id && rol !== "admin") return;
  await consulta("UPDATE usuarios SET rol = $2 WHERE id = $1", [id, rol]);
  revalidatePath("/admin/usuarios");
}

export async function guardarAjustes(_: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  await requiereAdmin();
  const actuales = await consulta<{ clave: string; valor: unknown }>("SELECT clave, valor FROM ajustes");
  const nuevos: [string, unknown][] = [];
  for (const { clave, valor } of actuales) {
    const crudo = datos.get(clave);
    if (crudo === null) continue;
    if (Array.isArray(valor)) {
      nuevos.push([clave, datos.getAll(clave).map(String).filter(Boolean)]);
    } else {
      const n = Number(crudo);
      if (!Number.isInteger(n) || n < 0 || n > 10_000) return { error: `Valor inválido en ${clave}.` };
      nuevos.push([clave, n]);
    }
  }
  const minimos = Object.fromEntries(nuevos);
  if ((minimos.alerta_min_anomalias as number) > (minimos.alerta_min_usuarios as number)) {
    return { error: "Las anomalías mínimas no pueden ser más que las personas mínimas." };
  }
  if ((minimos.alerta_ventana_dias as number) < 1 || (minimos.alerta_min_usuarios as number) < 1) {
    return { error: "La ventana y las personas mínimas deben ser al menos 1." };
  }
  await transaccion(async (c) => {
    for (const [clave, valor] of nuevos) await consulta("UPDATE ajustes SET valor = $2 WHERE clave = $1", [clave, JSON.stringify(valor)], c);
  });
  revalidatePath("/admin/ajustes");
  return { ok: "Ajustes guardados. Se aplican a las siguientes observaciones." };
}

export async function marcarRetroalimentacion(id: number) {
  await requiereAdmin();
  await consulta("UPDATE retroalimentacion SET atendida = NOT atendida WHERE id = $1", [id]);
  revalidatePath("/admin/comentarios");
}
