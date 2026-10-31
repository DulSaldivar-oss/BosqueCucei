import { consulta, una } from "@/lib/db";
import { diaLocal } from "@/lib/juego/semana";
import type { GenomaSprite } from "@/lib/sprites/generar";

export async function indicadores() {
  return (await una<{
    arboles: number;
    obs_7: number;
    obs_7_previos: number;
    personas_7: number;
    personas_total: number;
    alertas_abiertas: number;
    alertas_criticas: number;
    sin_revisar: number;
    comentarios: number;
  }>(
    `SELECT (SELECT count(*) FROM arboles WHERE activo) AS arboles,
            (SELECT count(*) FROM observaciones WHERE fecha > now() - interval '7 days') AS obs_7,
            (SELECT count(*) FROM observaciones WHERE fecha BETWEEN now() - interval '14 days' AND now() - interval '7 days') AS obs_7_previos,
            (SELECT count(DISTINCT usuario_id) FROM observaciones WHERE fecha > now() - interval '7 days') AS personas_7,
            (SELECT count(*) FROM usuarios) AS personas_total,
            (SELECT count(*) FROM alertas WHERE estado_revision IN ('abierta','en_revision')) AS alertas_abiertas,
            (SELECT count(*) FROM alertas WHERE estado_revision IN ('abierta','en_revision') AND nivel = 'critica') AS alertas_criticas,
            (SELECT count(*) FROM observaciones WHERE validada IS NULL AND estado_reportado <> 'bien') AS sin_revisar,
            (SELECT count(*) FROM retroalimentacion WHERE NOT atendida) AS comentarios`,
  ))!;
}

/** Indicadores de la sección 13 de la propuesta (¿funciona el piloto?). */
export async function metricasPiloto() {
  return (await una<{
    escanearon: number;
    volvieron: number;
    elegibles: number;
    arboles_validos: number;
    observaciones: number;
    con_foto: number;
    alertas: number;
    alertas_utiles: number;
    alertas_evaluadas: number;
    duracion_promedio_s: number | null;
    duracion_mediana_s: number | null;
    comentarios: number;
  }>(
    `WITH actividad AS (
       SELECT usuario_id, fecha FROM observaciones
       UNION ALL SELECT usuario_id, fecha FROM escaneos WHERE usuario_id IS NOT NULL),
     primera AS (SELECT usuario_id, min(fecha) AS inicio FROM actividad GROUP BY usuario_id)
     SELECT (SELECT count(*) FROM primera) AS escanearon,
            (SELECT count(*) FROM primera p WHERE p.inicio < now() - interval '7 days'
               AND EXISTS (SELECT 1 FROM actividad a WHERE a.usuario_id = p.usuario_id AND a.fecha >= p.inicio + interval '7 days')) AS volvieron,
            (SELECT count(*) FROM primera WHERE inicio < now() - interval '7 days') AS elegibles,
            (SELECT count(DISTINCT arbol_id) FROM observaciones WHERE validada IS DISTINCT FROM false) AS arboles_validos,
            (SELECT count(*) FROM observaciones) AS observaciones,
            (SELECT count(*) FROM observaciones WHERE fotografia IS NOT NULL) AS con_foto,
            (SELECT count(*) FROM alertas) AS alertas,
            (SELECT count(*) FROM alertas WHERE util) AS alertas_utiles,
            (SELECT count(*) FROM alertas WHERE util IS NOT NULL) AS alertas_evaluadas,
            (SELECT round(avg(duracion_ms) / 1000.0, 1) FROM observaciones WHERE duracion_ms IS NOT NULL) AS duracion_promedio_s,
            (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY duracion_ms) / 1000.0)::numeric, 1)
               FROM observaciones WHERE duracion_ms IS NOT NULL) AS duracion_mediana_s,
            (SELECT count(*) FROM retroalimentacion) AS comentarios`,
  ))!;
}

export async function observacionesPorDia(dias = 28) {
  const filas = await consulta<{ dia: string; bien: number; anomalia: number }>(
    `SELECT to_char(fecha AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') AS dia,
            count(*) FILTER (WHERE estado_reportado = 'bien') AS bien,
            count(*) FILTER (WHERE estado_reportado <> 'bien') AS anomalia
     FROM observaciones WHERE fecha > now() - make_interval(days => $1)
     GROUP BY 1`,
    [dias],
  );
  const mapa = new Map(filas.map((f) => [f.dia, f]));
  return Array.from({ length: dias }, (_, i) => {
    const dia = diaLocal(new Date(Date.now() - (dias - 1 - i) * 86_400_000));
    return { dia, bien: mapa.get(dia)?.bien ?? 0, anomalia: mapa.get(dia)?.anomalia ?? 0 };
  });
}

const PRIORIDAD = `CASE a.estado_actual WHEN 'revision_requerida' THEN 0 WHEN 'posible_problema' THEN 1 WHEN 'pendiente' THEN 2 ELSE 3 END`;

export async function arbolesPrioritarios(limite = 8) {
  return consulta<{ codigo: string; apodo: string | null; especie: string; zona: string; estado_actual: string; reportes: number; ultima: Date | null }>(
    `SELECT a.codigo, a.apodo, e.nombre_comun AS especie, a.zona, a.estado_actual,
            (SELECT count(*) FROM observaciones o WHERE o.arbol_id = a.id AND o.estado_reportado <> 'bien'
               AND o.fecha > now() - interval '14 days') AS reportes,
            a.ultima_observacion AS ultima
     FROM arboles a JOIN especies e ON e.id = a.especie_id
     WHERE a.activo AND a.estado_actual IN ('revision_requerida', 'posible_problema', 'pendiente')
     ORDER BY ${PRIORIDAD}, reportes DESC, a.ultima_observacion DESC NULLS LAST LIMIT $1`,
    [limite],
  );
}

export interface FilaAlerta {
  id: number;
  arbol_id: number;
  codigo: string;
  especie: string;
  zona: string;
  nivel: "media" | "alta" | "critica";
  motivo: string;
  categorias: string[];
  estado_revision: string;
  responsable: string | null;
  resolucion: string | null;
  util: boolean | null;
  fecha_generacion: Date;
  actualizada_en: Date;
  resuelta_en: Date | null;
}

export async function listarAlertas(estado: string | null, limite = 100) {
  return consulta<FilaAlerta>(
    `SELECT al.*, a.codigo, e.nombre_comun AS especie, a.zona
     FROM alertas al JOIN arboles a ON a.id = al.arbol_id JOIN especies e ON e.id = a.especie_id
     WHERE ($1::text IS NULL OR al.estado_revision = $1)
     ORDER BY CASE al.nivel WHEN 'critica' THEN 0 WHEN 'alta' THEN 1 ELSE 2 END, al.fecha_generacion DESC
     LIMIT $2`,
    [estado, limite],
  );
}

export async function alertaPorId(id: number) {
  return una<FilaAlerta & { latitud: number; longitud: number; sprite: GenomaSprite }>(
    `SELECT al.*, a.codigo, a.latitud, a.longitud, e.nombre_comun AS especie, e.sprite, a.zona
     FROM alertas al JOIN arboles a ON a.id = al.arbol_id JOIN especies e ON e.id = a.especie_id WHERE al.id = $1`,
    [id],
  );
}

export interface FilaObservacion {
  id: number;
  fecha: Date;
  codigo: string;
  especie: string;
  zona: string;
  alias: string;
  estado_reportado: string;
  categorias: string[];
  comentario: string | null;
  fotografia: string | null;
  cuenta: boolean;
  validada: boolean | null;
  duracion_ms: number | null;
}

export async function listarObservaciones(filtros: { filtro?: string; arbolId?: number; desde?: Date; pagina?: number }) {
  const condiciones: string[] = [];
  const params: unknown[] = [];
  if (filtros.filtro === "sin_revisar") condiciones.push("o.validada IS NULL AND o.estado_reportado <> 'bien'");
  if (filtros.filtro === "anomalias") condiciones.push("o.estado_reportado <> 'bien'");
  if (filtros.filtro === "fotos") condiciones.push("o.fotografia IS NOT NULL");
  if (filtros.filtro === "rechazadas") condiciones.push("o.validada = false");
  if (filtros.arbolId) {
    params.push(filtros.arbolId);
    condiciones.push(`o.arbol_id = $${params.length}`);
  }
  if (filtros.desde) {
    params.push(filtros.desde);
    condiciones.push(`o.fecha > $${params.length}`);
  }
  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const porPagina = 40;
  params.push(porPagina + 1, Math.max(0, (filtros.pagina ?? 1) - 1) * porPagina);
  const filas = await consulta<FilaObservacion>(
    `SELECT o.id, o.fecha, a.codigo, e.nombre_comun AS especie, a.zona, u.alias, o.estado_reportado, o.categorias,
            o.comentario, o.fotografia, o.cuenta, o.validada, o.duracion_ms
     FROM observaciones o JOIN arboles a ON a.id = o.arbol_id JOIN especies e ON e.id = a.especie_id
     JOIN usuarios u ON u.id = o.usuario_id
     ${donde}
     ORDER BY o.fecha DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { filas: filas.slice(0, porPagina), hayMas: filas.length > porPagina };
}

export interface FilaArbolAdmin {
  id: number;
  codigo: string;
  qr_id: string;
  apodo: string | null;
  especie: string;
  especie_slug: string;
  zona: string;
  estado_actual: string;
  ultima_observacion: Date | null;
  observaciones: number;
  activo: boolean;
}

export async function listarArboles(busqueda: string, estado: string | null) {
  return consulta<FilaArbolAdmin>(
    `SELECT a.id, a.codigo, a.qr_id, a.apodo, e.nombre_comun AS especie, e.slug AS especie_slug, a.zona, a.estado_actual,
            a.ultima_observacion, a.activo,
            (SELECT count(*) FROM observaciones o WHERE o.arbol_id = a.id) AS observaciones
     FROM arboles a JOIN especies e ON e.id = a.especie_id
     WHERE ($1 = '' OR a.codigo ILIKE '%' || $1 || '%' OR e.nombre_comun ILIKE '%' || $1 || '%'
            OR a.zona ILIKE '%' || $1 || '%' OR coalesce(a.apodo, '') ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR a.estado_actual = $2)
     ORDER BY ${PRIORIDAD}, a.codigo`,
    [busqueda, estado],
  );
}

export async function arbolParaEditar(codigo: string) {
  return una<{
    id: number;
    codigo: string;
    qr_id: string;
    especie_id: number;
    apodo: string | null;
    latitud: number;
    longitud: number;
    zona: string;
    fecha_registro: string;
    altura_m: number | null;
    diametro_cm: number | null;
    ancho_copa_m: number | null;
    circunferencia_cm: number | null;
    co2_kg: number | null;
    estado_fitosanitario: string | null;
    fuente: "inventario" | "panel";
    estado_actual: string;
    foto_principal: string | null;
    ultima_inspeccion: string | null;
    notas_publicas: string | null;
    activo: boolean;
  }>("SELECT * FROM arboles WHERE codigo = $1", [codigo]);
}

export async function especiesParaSelector() {
  return consulta<{ id: number; slug: string; nombre_comun: string; nombre_cientifico: string }>(
    "SELECT id, slug, nombre_comun, nombre_cientifico FROM especies ORDER BY nombre_comun",
  );
}

export async function zonas() {
  // Orden natural: «Sector 2» antes que «Sector 10».
  const filas = await consulta<{ zona: string }>("SELECT DISTINCT zona FROM arboles");
  return filas.map((z) => z.zona).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

export async function listarEspeciesAdmin() {
  return consulta<{ id: number; slug: string; nombre_comun: string; nombre_cientifico: string; familia: string; origen: string | null; sprite: GenomaSprite; ejemplares: number; observaciones: number }>(
    `SELECT e.id, e.slug, e.nombre_comun, e.nombre_cientifico, e.familia, e.origen, e.sprite,
            (SELECT count(*) FROM arboles a WHERE a.especie_id = e.id AND a.activo) AS ejemplares,
            (SELECT count(*) FROM observaciones o JOIN arboles a ON a.id = o.arbol_id WHERE a.especie_id = e.id) AS observaciones
     FROM especies e ORDER BY e.nombre_comun`,
  );
}

export async function listarUsuarios(busqueda: string) {
  return consulta<{
    id: number;
    nombre: string;
    alias: string;
    correo: string;
    tipo_usuario: string;
    carrera_o_area: string | null;
    rol: string;
    xp: number;
    nivel: number;
    fecha_alta: Date;
    observaciones: number;
    arboles: number;
    ultima: Date | null;
  }>(
    `SELECT u.id, u.nombre, u.alias, u.correo, u.tipo_usuario, u.carrera_o_area, u.rol, u.xp, u.nivel, u.fecha_alta,
            (SELECT count(*) FROM observaciones o WHERE o.usuario_id = u.id) AS observaciones,
            (SELECT count(*) FROM usuario_arbol ua WHERE ua.usuario_id = u.id) AS arboles,
            (SELECT max(fecha) FROM observaciones o WHERE o.usuario_id = u.id) AS ultima
     FROM usuarios u
     WHERE $1 = '' OR u.alias ILIKE '%' || $1 || '%' OR u.nombre ILIKE '%' || $1 || '%' OR u.correo ILIKE '%' || $1 || '%'
     ORDER BY u.xp DESC LIMIT 300`,
    [busqueda],
  );
}

export async function listarAjustes() {
  return consulta<{ clave: string; valor: unknown; descripcion: string }>("SELECT clave, valor, descripcion FROM ajustes ORDER BY clave");
}

export async function listarRetroalimentacion() {
  return consulta<{ id: number; alias: string | null; pagina: string | null; mensaje: string; atendida: boolean; fecha: Date }>(
    `SELECT r.id, u.alias, r.pagina, r.mensaje, r.atendida, r.fecha
     FROM retroalimentacion r LEFT JOIN usuarios u ON u.id = r.usuario_id ORDER BY r.atendida, r.fecha DESC LIMIT 200`,
  );
}

export async function fotosRecientes(limite = 8) {
  return consulta<{ id: number; fotografia: string; codigo: string; fecha: Date; estado_reportado: string }>(
    `SELECT o.id, o.fotografia, a.codigo, o.fecha, o.estado_reportado FROM observaciones o JOIN arboles a ON a.id = o.arbol_id
     WHERE o.fotografia IS NOT NULL ORDER BY o.fecha DESC LIMIT $1`,
    [limite],
  );
}
