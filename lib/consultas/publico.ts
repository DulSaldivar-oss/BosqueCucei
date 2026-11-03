import { consulta, una } from "@/lib/db";
import { rarezaPorEjemplares, type Rareza } from "@/lib/juego/catalogos";
import { claveSemana, inicioDeSemana } from "@/lib/juego/semana";
import type { GenomaSprite } from "@/lib/sprites/generar";

export interface EspecieResumen {
  id: number;
  slug: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string;
  /** null mientras no se haya confirmado (especies nuevas del inventario). */
  origen: "nativa" | "introducida" | null;
  sprite: GenomaSprite;
  color_flor: string | null;
  floracion_meses: number[];
  ejemplares: number;
  rareza: Rareza;
}

export interface Especie extends EspecieResumen {
  otros_nombres: string[];
  distribucion: string | null;
  descripcion: string;
  dato_curioso: string | null;
  beneficios: string[];
  altura_max_m: number | null;
  follaje: string | null;
  wikipedia_url: string | null;
  foto_url: string | null;
  foto_credito: string | null;
  /** Textos del inventario oficial. */
  follaje_texto: string | null;
  clima: string | null;
  floracion_texto: string | null;
}

export interface Arbol {
  id: number;
  codigo: string;
  qr_id: string;
  apodo: string | null;
  latitud: number;
  longitud: number;
  zona: string;
  fecha_registro: string;
  altura_m: number | null;
  diametro_cm: number | null;
  campus: string;
  estado_fitosanitario: string | null;
  ancho_copa_m: number | null;
  circunferencia_cm: number | null;
  co2_kg: number | null;
  estado_actual: string;
  foto_principal: string | null;
  ultima_observacion: Date | null;
  ultima_inspeccion: string | null;
  notas_publicas: string | null;
  especie: Especie;
  observaciones: number;
  guardianes: number;
}

const conRareza = <T extends { ejemplares: number }>(fila: T) => ({ ...fila, rareza: rarezaPorEjemplares(fila.ejemplares) });

export async function resumenCampus() {
  return (await una<{ arboles: number; especies: number; observaciones: number; personas: number }>(
    `SELECT (SELECT count(*) FROM arboles WHERE activo) AS arboles,
            (SELECT count(DISTINCT especie_id) FROM arboles WHERE activo) AS especies,
            (SELECT count(*) FROM observaciones) AS observaciones,
            (SELECT count(DISTINCT usuario_id) FROM observaciones) AS personas`,
  ))!;
}

const COLUMNAS_ESPECIE = `e.id, e.slug, e.nombre_comun, e.nombre_cientifico, e.familia, e.origen, e.sprite, e.color_flor,
  e.floracion_meses, e.otros_nombres, e.distribucion, e.descripcion, e.dato_curioso, e.beneficios, e.altura_max_m,
  e.follaje, e.wikipedia_url, e.foto_url, e.foto_credito, e.follaje_texto, e.clima, e.floracion_texto`;

export async function arbolPorCodigo(codigo: string): Promise<Arbol | null> {
  const fila = await una<Omit<Arbol, "especie"> & { especie: Omit<Especie, "rareza"> }>(
    `SELECT a.id, a.codigo, a.qr_id, a.apodo, a.latitud, a.longitud, a.zona, a.fecha_registro, a.altura_m,
            a.diametro_cm, a.campus, a.estado_fitosanitario, a.ancho_copa_m, a.circunferencia_cm, a.co2_kg,
            a.estado_actual, a.foto_principal, a.ultima_observacion, a.ultima_inspeccion, a.notas_publicas,
            (SELECT count(*) FROM observaciones o WHERE o.arbol_id = a.id) AS observaciones,
            (SELECT count(*) FROM usuario_arbol ua WHERE ua.arbol_id = a.id) AS guardianes,
            (SELECT row_to_json(x) FROM (
               SELECT ${COLUMNAS_ESPECIE},
                      (SELECT count(*) FROM arboles a2 WHERE a2.especie_id = e.id AND a2.activo) AS ejemplares
               FROM especies e WHERE e.id = a.especie_id) x) AS especie
     FROM arboles a WHERE upper(a.codigo) = upper($1) AND a.activo`,
    [codigo],
  );
  if (!fila) return null;
  return { ...fila, especie: conRareza(fila.especie) };
}

/** Resuelve el contenido leído de un QR o tecleado: código, número de placa, identificador del QR o una URL que los contenga. */
export async function resolverQr(texto: string): Promise<string | null> {
  const limpio = texto.trim();
  const candidatos = new Set([limpio]);
  try {
    const url = new URL(limpio);
    const segmentos = url.pathname.split("/").filter(Boolean);
    if (segmentos.length) candidatos.add(decodeURIComponent(segmentos[segmentos.length - 1]));
    for (const valor of url.searchParams.values()) candidatos.add(valor);
  } catch {
    // No es URL.
  }
  const codigo = /CUCEI[-_ ]?(\d{1,5})/i.exec(limpio);
  if (codigo) {
    candidatos.add(codigo[0].replace(/[_ ]/, "-").toUpperCase());
    candidatos.add(`CUCEI-${codigo[1].padStart(4, "0")}`);
  }
  // Número de árbol a secas («27» o «#27»): las placas del inventario muestran el número.
  const numero = /^#?\s*(\d{1,5})$/.exec(limpio)?.[1];
  if (numero) candidatos.add(`CUCEI-${numero.padStart(4, "0")}`);
  const fila = await una<{ codigo: string }>(
    `SELECT codigo FROM arboles WHERE activo AND (qr_id = ANY($1) OR upper(codigo) = ANY($2)) LIMIT 1`,
    [[...candidatos], [...candidatos].map((c) => c.toUpperCase())],
  );
  return fila?.codigo ?? null;
}

export async function historialArbol(arbolId: number, limite = 12) {
  return consulta<{
    id: number;
    fecha: Date;
    estado_reportado: string;
    categorias: string[];
    comentario: string | null;
    fotografia: string | null;
    alias: string;
  }>(
    `SELECT o.id, o.fecha, o.estado_reportado, o.categorias, o.comentario, o.fotografia, u.alias
     FROM observaciones o JOIN usuarios u ON u.id = o.usuario_id
     WHERE o.arbol_id = $1 AND o.validada IS DISTINCT FROM false
     ORDER BY o.fecha DESC LIMIT $2`,
    [arbolId, limite],
  );
}

/** Observaciones por semana (últimas 10) separadas en «bien» y «con anomalía». */
export async function saludPorSemana(arbolId: number, semanas = 10) {
  const filas = await consulta<{ semana: string; bien: number; anomalia: number }>(
    `SELECT semana, count(*) FILTER (WHERE estado_reportado = 'bien') AS bien,
            count(*) FILTER (WHERE estado_reportado <> 'bien') AS anomalia
     FROM observaciones WHERE arbol_id = $1 AND fecha > now() - make_interval(weeks => $2)
       AND validada IS DISTINCT FROM false
     GROUP BY semana`,
    [arbolId, semanas],
  );
  const porSemana = new Map(filas.map((f) => [f.semana, f]));
  const resultado = [];
  let fecha = new Date();
  for (let i = 0; i < semanas; i++) {
    const clave = claveSemana(fecha);
    resultado.unshift({ semana: clave, bien: porSemana.get(clave)?.bien ?? 0, anomalia: porSemana.get(clave)?.anomalia ?? 0 });
    fecha = new Date(inicioDeSemana(clave).getTime() - 3_600_000);
  }
  return resultado;
}

export async function guardianesArbol(arbolId: number, limite = 10) {
  return consulta<{ alias: string; nivel: number; numero_visitas: number; guardian: boolean; ultima_visita: Date | null }>(
    `SELECT u.alias, u.nivel, ua.numero_visitas, ua.guardian, ua.ultima_visita
     FROM usuario_arbol ua JOIN usuarios u ON u.id = ua.usuario_id
     WHERE ua.arbol_id = $1 AND ua.numero_visitas > 0
     ORDER BY ua.numero_visitas DESC, ua.fecha_descubrimiento LIMIT $2`,
    [arbolId, limite],
  );
}

export interface RelacionArbol {
  fecha_descubrimiento: Date;
  numero_visitas: number;
  ultima_visita: Date | null;
  ultima_semana: string | null;
  guardian: boolean;
}

export async function relacionConArbol(usuarioId: number, arbolId: number) {
  return una<RelacionArbol>(
    `SELECT fecha_descubrimiento, numero_visitas, ultima_visita, ultima_semana, guardian
     FROM usuario_arbol WHERE usuario_id = $1 AND arbol_id = $2`,
    [usuarioId, arbolId],
  );
}

export interface ArbolJardin {
  arbol_id: number;
  codigo: string;
  apodo: string | null;
  zona: string;
  estado_actual: string;
  numero_visitas: number;
  ultima_visita: Date | null;
  ultima_semana: string | null;
  guardian: boolean;
  fecha_descubrimiento: Date;
  especie_slug: string;
  especie_nombre: string;
  sprite: GenomaSprite;
}

export async function jardinDe(usuarioId: number) {
  return consulta<ArbolJardin>(
    `SELECT a.id AS arbol_id, a.codigo, a.apodo, a.zona, a.estado_actual, ua.numero_visitas, ua.ultima_visita,
            ua.ultima_semana, ua.guardian, ua.fecha_descubrimiento, e.slug AS especie_slug,
            e.nombre_comun AS especie_nombre, e.sprite
     FROM usuario_arbol ua JOIN arboles a ON a.id = ua.arbol_id JOIN especies e ON e.id = a.especie_id
     WHERE ua.usuario_id = $1
     ORDER BY ua.fecha_descubrimiento`,
    [usuarioId],
  );
}

export async function herbario(usuarioId: number | null) {
  const filas = await consulta<EspecieResumen & { descubierta: Date | null; zonas: string[] }>(
    `SELECT e.id, e.slug, e.nombre_comun, e.nombre_cientifico, e.familia, e.origen, e.sprite, e.color_flor,
            e.floracion_meses,
            count(a.id) FILTER (WHERE a.activo) AS ejemplares,
            (SELECT min(ua.fecha_descubrimiento) FROM usuario_arbol ua JOIN arboles a3 ON a3.id = ua.arbol_id
             WHERE ua.usuario_id = $1 AND a3.especie_id = e.id) AS descubierta,
            coalesce(array_agg(DISTINCT a.zona) FILTER (WHERE a.activo), '{}') AS zonas
     FROM especies e LEFT JOIN arboles a ON a.especie_id = e.id
     GROUP BY e.id
     HAVING count(a.id) FILTER (WHERE a.activo) > 0
     ORDER BY e.nombre_comun`,
    [usuarioId],
  );
  return filas.map(conRareza);
}

export async function especiePorSlug(slug: string): Promise<Especie | null> {
  const fila = await una<Omit<Especie, "rareza">>(
    `SELECT ${COLUMNAS_ESPECIE}, (SELECT count(*) FROM arboles a WHERE a.especie_id = e.id AND a.activo) AS ejemplares
     FROM especies e WHERE e.slug = $1`,
    [slug],
  );
  return fila ? conRareza(fila) : null;
}

export async function arbolesDeEspecie(especieId: number) {
  return consulta<{ codigo: string; apodo: string | null; zona: string; estado_actual: string }>(
    "SELECT codigo, apodo, zona, estado_actual FROM arboles WHERE especie_id = $1 AND activo ORDER BY codigo",
    [especieId],
  );
}

export interface PuntoMapa {
  id: number;
  codigo: string;
  apodo: string | null;
  latitud: number;
  longitud: number;
  zona: string;
  estado: string;
  especie: string;
  slug: string;
  color: string;
  descubierto: boolean;
  regado: boolean;
}

export async function arbolesParaMapa(usuarioId: number | null): Promise<PuntoMapa[]> {
  return consulta<PuntoMapa>(
    `SELECT a.id, a.codigo, a.apodo, a.latitud, a.longitud, a.zona, a.estado_actual AS estado,
            e.nombre_comun AS especie, e.slug, coalesce(e.color_flor, e.sprite->'hojas'->>1) AS color,
            (ua.usuario_id IS NOT NULL) AS descubierto,
            coalesce(ua.ultima_semana = $2, false) AS regado
     FROM arboles a JOIN especies e ON e.id = a.especie_id
     LEFT JOIN usuario_arbol ua ON ua.arbol_id = a.id AND ua.usuario_id = $1
     WHERE a.activo ORDER BY a.codigo`,
    [usuarioId, claveSemana()],
  );
}

export async function estadisticasUsuario(usuarioId: number) {
  return (await una<{ arboles: number; especies: number; observaciones: number; fotos: number; misiones: number }>(
    `SELECT (SELECT count(*) FROM usuario_arbol WHERE usuario_id = $1) AS arboles,
            (SELECT count(DISTINCT a.especie_id) FROM usuario_arbol ua JOIN arboles a ON a.id = ua.arbol_id
             WHERE ua.usuario_id = $1) AS especies,
            (SELECT count(*) FROM observaciones WHERE usuario_id = $1) AS observaciones,
            (SELECT count(*) FROM observaciones WHERE usuario_id = $1 AND fotografia IS NOT NULL) AS fotos,
            (SELECT count(*) FROM misiones_completadas WHERE usuario_id = $1) AS misiones`,
    [usuarioId],
  ))!;
}

export async function eventosXp(usuarioId: number, limite = 15) {
  return consulta<{ cantidad: number; motivo: string; detalle: string | null; creado_en: Date }>(
    `SELECT cantidad, motivo, detalle, creado_en FROM xp_eventos WHERE usuario_id = $1
     ORDER BY creado_en DESC, id DESC LIMIT $2`,
    [usuarioId, limite],
  );
}

/** Personas con más experiencia ganada esta semana (solo alias y nivel). */
export async function guardianesDeLaSemana(limite = 5) {
  return consulta<{ alias: string; nivel: number; xp_semana: number; arboles: number }>(
    `SELECT u.alias, u.nivel, sum(x.cantidad) AS xp_semana,
            (SELECT count(DISTINCT o.arbol_id) FROM observaciones o
             WHERE o.usuario_id = u.id AND o.cuenta AND o.fecha >= $1) AS arboles
     FROM xp_eventos x JOIN usuarios u ON u.id = x.usuario_id
     WHERE x.creado_en >= $1
     GROUP BY u.id HAVING sum(x.cantidad) > 0
     ORDER BY xp_semana DESC LIMIT $2`,
    [inicioDeSemana(claveSemana()), limite],
  );
}

export async function registrarEscaneo(arbolId: number, usuarioId: number | null) {
  await consulta("INSERT INTO escaneos (arbol_id, usuario_id) VALUES ($1, $2)", [arbolId, usuarioId]);
}
