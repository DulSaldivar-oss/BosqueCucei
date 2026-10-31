/**
 * Inventario oficial de árboles (el Excel del campus): lectura, limpieza y conversión a los
 * datos de la app. Lo usan el script que genera la semilla (scripts/importar-inventario.ts)
 * y la importación desde el panel, para que ambos limpien los datos igual.
 */
import { fueraDeLugar } from "@/lib/geo";
import type { FormaCopa, GenomaSprite } from "@/lib/sprites/generar";

export interface ArbolInventario {
  numero: number;
  codigo: string;
  campus: string;
  activo: boolean;
  nombreComun: string;
  cientifico: string;
  cientificoOriginal: string;
  familia: string | null;
  zona: string;
  latitud: number;
  longitud: number;
  fechaRegistro: string | null;
  estadoFitosanitario: string | null;
  alturaM: number | null;
  anchoCopaM: number | null;
  circunferenciaCm: number | null;
  diametroCm: number | null;
  co2Kg: number | null;
  follaje: string | null;
  clima: string | null;
  floracion: string | null;
}

export interface ResultadoLectura {
  arboles: ArbolInventario[];
  errores: { fila: number; mensaje: string }[];
  avisos: { fila: number; mensaje: string }[];
}

// ───────────────────────── columnas ─────────────────────────

const quitarAcentos = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
/** Clave para comparar nombres comunes sin distinguir acentos ni mayúsculas. */
export const claveNombre = (nombre: string) => quitarAcentos(nombre).toLowerCase().replace(/\s+/g, " ").trim();
const claveColumna = (texto: string) =>
  quitarAcentos(String(texto)).toLowerCase().replace(/₂/g, "2").replace(/[^a-z0-9]+/g, " ").trim();

/** Nombres aceptados para cada columna (se comparan sin acentos ni signos). */
const COLUMNAS = {
  numero: ["no de arbol", "numero de arbol", "numero", "no", "id"],
  placa: ["placa"],
  estado: ["estado"],
  nombreComun: ["especie", "nombre comun"],
  cientifico: ["nombre cientifico", "cientifico"],
  zona: ["sector", "zona"],
  latitud: ["latitud", "lat"],
  longitud: ["longitud", "lng", "lon"],
  fecha: ["fecha de registro", "fecha"],
  fitosanitario: ["estado fitosanitario"],
  altura: ["altura m", "altura"],
  copa: ["ancho de la copa m", "ancho de copa m", "ancho de la copa"],
  circunferencia: ["vuelta del tronco cm", "circunferencia cm", "vuelta del tronco"],
  co2: ["co2 almacenado kg", "co2 almacenado", "co2"],
  familia: ["familia"],
  follaje: ["follaje"],
  clima: ["clima"],
  floracion: ["floracion y fruto", "floracion"],
  campus: ["campus"],
} as const;

type Columna = keyof typeof COLUMNAS;
const OBLIGATORIAS: Columna[] = ["numero", "cientifico", "latitud", "longitud"];

export function mapearColumnas(encabezados: unknown[]): { indices: Partial<Record<Columna, number>>; faltan: Columna[] } {
  const claves = encabezados.map((e) => (e == null ? "" : claveColumna(String(e))));
  const indices: Partial<Record<Columna, number>> = {};
  for (const [columna, alias] of Object.entries(COLUMNAS) as [Columna, readonly string[]][]) {
    const i = claves.findIndex((c) => (alias as readonly string[]).includes(c));
    if (i >= 0) indices[columna] = i;
  }
  return { indices, faltan: OBLIGATORIAS.filter((c) => indices[c] === undefined) };
}

// ───────────────────────── valores ─────────────────────────

function texto(valor: unknown): string | null {
  if (valor == null) return null;
  const t = String(valor).replace(/\s+/g, " ").trim();
  return t === "" ? null : t;
}

export function numero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const t = texto(valor);
  if (!t) return null;
  const n = Number(t.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function fecha(valor: unknown): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor.toISOString().slice(0, 10);
  const t = texto(valor);
  if (!t) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  return dmy ? `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}` : null;
}

/** «Malvaceae (antes Bombacaceae)» → «Malvaceae». Solo acepta nombres de familia (-aceae). */
function familiaLimpia(valor: string | null): string | null {
  const nombre = valor?.replace(/\([^)]*\)/g, " ").trim().split(/\s+/)[0];
  return nombre && /aceae$/i.test(nombre) ? nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase() : null;
}

const redondear = (n: number | null, decimales = 1) => (n == null ? null : Math.round(n * 10 ** decimales) / 10 ** decimales);

// ───────────────────────── nombres científicos ─────────────────────────

/** Textos del inventario que no son nombres científicos. */
const CORRECCIONES: Record<string, string> = {
  "dracena de madagascar": "Dracaena marginata",
};

/** Sinónimos: se agrupan bajo el nombre aceptado. */
const SINONIMOS: Record<string, string> = {
  "Myrciaria cauliflora": "Plinia cauliflora",
  "Hesperocyparis macrocarpa": "Cupressus macrocarpa",
  "Cheiranthus cheiri": "Erysimum cheiri",
  "Tabebuia donnell-smithii": "Roseodendron donnell-smithii",
  "Acacia farnesiana": "Vachellia farnesiana",
};

/**
 * Deja «Género epíteto» quitando autores («L.», «(Bertol.) DC.»), cultivares entre comillas,
 * notas entre paréntesis y el signo de híbrido. Si no hay epíteto queda «Género spp.».
 */
export function normalizarCientifico(original: string): string {
  let t = original.replace(/\s+/g, " ").trim();
  const corregido = CORRECCIONES[quitarAcentos(t).toLowerCase()];
  if (corregido) return corregido;
  // «Bougainvillea glabra o Bougainvillea spectabilis»: mismo género, especie dudosa.
  const alternativas = t.split(/\s+o\s+/i);
  if (alternativas.length > 1) {
    const generos = new Set(alternativas.map((a) => a.trim().split(" ")[0].toLowerCase()));
    if (generos.size === 1) t = `${alternativas[0].trim().split(" ")[0]} spp.`;
    else t = alternativas[0];
  }
  t = t.replace(/\([^)]*\)/g, " ").replace(/['‘’"“”][^'‘’"“”]*['‘’"“”]/g, " ").replace(/\s+/g, " ").trim();
  const partes = t.split(" ").filter((p) => p !== "×" && p.toLowerCase() !== "x");
  const genero = partes[0] ? partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase() : "";
  // El epíteto va en minúsculas; uno con mayúscula inicial suele ser el autor («Magnolia Linnaeus»).
  // Solo se acepta en mayúsculas si todo el nombre viene así («FICUS BENJAMINA»).
  const segundo = partes[1] && /^[A-ZÀ-Ý-]{3,}$/.test(partes[1]) && partes[0] === partes[0].toUpperCase() ? partes[1].toLowerCase() : partes[1];
  const epiteto = segundo && /^[a-zà-ÿ-]+$/.test(segundo) && segundo !== "spp" ? segundo : null;
  const nombre = epiteto ? `${genero} ${epiteto}` : `${genero} spp.`;
  return SINONIMOS[nombre] ?? nombre;
}

/** «Ceiba (caiba)» → nombre «Ceiba» y alternativa «Caiba». */
export function separarNombreComun(original: string): { nombre: string; otros: string[] } {
  const otros = [...original.matchAll(/\(([^)]+)\)/g)].map((m) => capitalizar(m[1].trim()));
  const nombre = capitalizar(original.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim());
  return { nombre, otros };
}

const capitalizar = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

export const aSlug = (t: string) =>
  quitarAcentos(t)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Código visible del árbol: campus + número con 4 cifras (CUCEI-0027). */
export function codigoArbol(campus: string, numero: number) {
  const prefijo = quitarAcentos(campus).toUpperCase().replace(/[^A-Z0-9]/g, "") || "CUCEI";
  return `${prefijo}-${String(numero).padStart(4, "0")}`;
}

// ───────────────────────── filas ─────────────────────────

export function leerFilas(filas: unknown[][]): ResultadoLectura {
  const resultado: ResultadoLectura = { arboles: [], errores: [], avisos: [] };
  if (filas.length === 0) {
    resultado.errores.push({ fila: 1, mensaje: "La hoja está vacía." });
    return resultado;
  }
  const { indices, faltan } = mapearColumnas(filas[0]);
  if (faltan.length) {
    resultado.errores.push({ fila: 1, mensaje: `Faltan columnas: ${faltan.join(", ")}.` });
    return resultado;
  }
  const vistos = new Set<string>();
  filas.slice(1).forEach((celdas, i) => {
    const fila = i + 2;
    if (!celdas || celdas.every((c) => c == null || c === "")) return;
    const valor = (c: Columna) => (indices[c] === undefined ? null : celdas[indices[c]!]);
    const num = numero(valor("numero"));
    const original = texto(valor("cientifico"));
    const latitud = numero(valor("latitud"));
    const longitud = numero(valor("longitud"));
    if (num == null || !Number.isInteger(num) || num <= 0) return resultado.errores.push({ fila, mensaje: "Número de árbol inválido." });
    if (!original) return resultado.errores.push({ fila, mensaje: `Árbol ${num}: falta el nombre científico.` });
    if (latitud == null || longitud == null || Math.abs(latitud) > 90 || Math.abs(longitud) > 180) {
      return resultado.errores.push({ fila, mensaje: `Árbol ${num}: coordenadas inválidas.` });
    }
    const campus = texto(valor("campus")) ?? "CUCEI";
    const codigo = codigoArbol(campus, num);
    if (vistos.has(codigo)) return resultado.errores.push({ fila, mensaje: `${codigo} está repetido.` });
    vistos.add(codigo);
    const zona = texto(valor("zona"));
    if (!zona) resultado.avisos.push({ fila, mensaje: `${codigo}: sin sector (queda como «Sin sector»).` });
    const circunferencia = numero(valor("circunferencia"));
    const estado = texto(valor("estado"));
    resultado.arboles.push({
      numero: num,
      codigo,
      campus,
      activo: estado == null || quitarAcentos(estado).toLowerCase() === "activo",
      nombreComun: texto(valor("nombreComun")) ?? normalizarCientifico(original),
      cientifico: normalizarCientifico(original),
      cientificoOriginal: original,
      familia: familiaLimpia(texto(valor("familia"))),
      zona: zona ?? "Sin sector",
      latitud,
      longitud,
      fechaRegistro: fecha(valor("fecha")),
      estadoFitosanitario: texto(valor("fitosanitario")),
      alturaM: redondear(numero(valor("altura"))),
      anchoCopaM: redondear(numero(valor("copa"))),
      circunferenciaCm: redondear(circunferencia),
      diametroCm: redondear(circunferencia == null ? null : circunferencia / Math.PI),
      co2Kg: redondear(numero(valor("co2"))),
      follaje: texto(valor("follaje")),
      clima: texto(valor("clima")),
      floracion: texto(valor("floracion")),
    });
  });
  for (const a of fueraDeLugar(resultado.arboles)) {
    resultado.avisos.push({ fila: 0, mensaje: `${a.codigo}: coordenadas a ${(a.distancia / 1000).toFixed(1)} km del resto del campus.` });
  }
  return resultado;
}

/** Lee la primera hoja de un .xlsx. */
export async function leerExcel(contenido: Buffer): Promise<ResultadoLectura> {
  const { readSheet } = await import("read-excel-file/node");
  return leerFilas((await readSheet(contenido)) as unknown[][]);
}

// ───────────────────────── especies ─────────────────────────

export function follajeTipo(textoFollaje: string | null): "perenne" | "caducifolio" | "semicaducifolio" | null {
  if (!textoFollaje) return null;
  const t = quitarAcentos(textoFollaje).toLowerCase();
  if (t.includes("semi")) return "semicaducifolio";
  if (/caduc|decidu|caduco/.test(t)) return "caducifolio";
  if (/perenn|siempre ?verde|persistente/.test(t)) return "perenne";
  return null;
}

const COLORES_FLOR: [RegExp, string][] = [
  [/morad|lila|violet|purpura|lavanda/, "#8E6CC4"],
  [/magenta|fucsia/, "#D94F9A"],
  [/rosa/, "#E58DBB"],
  [/roj|escarlata|carmes/, "#D7263D"],
  [/naranja|anaranj/, "#F2994A"],
  [/amarill|dorad/, "#EDBB1F"],
  [/blanc|crema/, "#F4F1E8"],
];

export function colorDeFlor(textoFloracion: string | null): string | null {
  if (!textoFloracion) return null;
  const t = quitarAcentos(textoFloracion).toLowerCase();
  return COLORES_FLOR.find(([patron]) => patron.test(t))?.[1] ?? null;
}

const COPA_POR_FAMILIA: Record<string, FormaCopa> = {
  Arecaceae: "palmera",
  Asparagaceae: "palmera",
  Musaceae: "palmera",
  Cupressaceae: "conica",
  Pinaceae: "conica",
  Araucariaceae: "conica",
  Casuarinaceae: "conica",
  Taxaceae: "conica",
  Fabaceae: "paraguas",
  Bignoniaceae: "abierta",
  Malvaceae: "abierta",
  Lythraceae: "abierta",
  Combretaceae: "abierta",
  Cactaceae: "abierta",
  Euphorbiaceae: "abierta",
  Poaceae: "columnar",
  Proteaceae: "columnar",
};

const VERDES: [string, string, string][] = [
  ["#2F5E35", "#4A8044", "#78AA5A"],
  ["#3E6A3A", "#5C8C49", "#8AB463"],
  ["#24502E", "#3B7140", "#5F9850"],
  ["#4A6B3E", "#6A8D52", "#98B677"],
  ["#2C5A32", "#447A42", "#6CA05A"],
  ["#3A6439", "#58884A", "#87B064"],
];
const TRONCOS = ["#6B5444", "#7C6A58", "#5E4B3D", "#8A7B6A", "#76675A"];

/** Sprite inicial para una especie nueva, a partir de su familia y su floración. */
export function proponerSprite(
  familia: string | null,
  cientifico: string,
  floracion: string | null,
  forzarCopa?: FormaCopa,
): GenomaSprite {
  let h = 0;
  for (const c of cientifico) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  let copa: FormaCopa = (familia && COPA_POR_FAMILIA[familia]) || "redonda";
  const genero = cientifico.split(" ")[0];
  if (["Eucalyptus", "Melaleuca", "Grevillea"].includes(genero)) copa = "columnar";
  if (genero === "Salix" || cientifico === "Schinus molle") copa = "llorona";
  if (forzarCopa) copa = forzarCopa;
  const flor = colorDeFlor(floracion);
  const vistosa = floracion ? /espectacular|vistos|abundante|llamativ|racimos/.test(quitarAcentos(floracion).toLowerCase()) : false;
  const proporciones: Partial<Record<FormaCopa, { alto: number; ancho: number }>> = {
    conica: { alto: 1.2, ancho: 0.85 },
    columnar: { alto: 1.3, ancho: 0.85 },
    palmera: { alto: 1.3, ancho: 0.9 },
    paraguas: { alto: 0.95, ancho: 1.25 },
    llorona: { alto: 1, ancho: 1.15 },
  };
  return {
    copa,
    hojas: VERDES[h % VERDES.length],
    tronco: TRONCOS[(h >>> 3) % TRONCOS.length],
    ...(flor && copa !== "palmera" && copa !== "conica" ? { flor, densidadFlor: vistosa ? 0.85 : 0.45 } : {}),
    ...(proporciones[copa] ?? { alto: 1, ancho: 1 }),
  };
}

/** Valor más frecuente (no vacío) de una lista. */
export function masFrecuente<T>(valores: (T | null)[]): T | null {
  const conteo = new Map<T, number>();
  for (const v of valores) if (v != null) conteo.set(v, (conteo.get(v) ?? 0) + 1);
  let mejor: T | null = null;
  let maximo = 0;
  for (const [v, n] of conteo) {
    if (n > maximo) {
      mejor = v;
      maximo = n;
    }
  }
  return mejor;
}

/** Especie del catálogo (data/especies.json y tabla especies). */
export interface EspecieCatalogo {
  slug: string;
  nombre_comun: string;
  otros_nombres: string[];
  nombre_cientifico: string;
  familia: string;
  origen: "nativa" | "introducida" | null;
  distribucion: string | null;
  descripcion: string;
  dato_curioso: string | null;
  beneficios: string[];
  altura_max_m: number | null;
  follaje: "perenne" | "caducifolio" | "semicaducifolio" | null;
  floracion_meses: number[];
  color_flor: string | null;
  sprite: GenomaSprite;
  follaje_texto?: string | null;
  clima?: string | null;
  floracion_texto?: string | null;
  fuente?: string | null;
  /** Creada automáticamente desde el inventario: falta curar nombre, origen y descripción. */
  revisar?: boolean;
  [otra: string]: unknown;
}

/** Textos de la especie según el inventario: el valor más repetido entre sus árboles. */
export function textosDeEspecie(arboles: ArbolInventario[]) {
  return {
    follaje_texto: masFrecuente(arboles.map((a) => a.follaje)),
    clima: masFrecuente(arboles.map((a) => a.clima)),
    floracion_texto: masFrecuente(arboles.map((a) => a.floracion)),
  };
}

/**
 * Especie nueva a partir de sus árboles del inventario. El nombre común es el más frecuente que no
 * sea el científico ni nombre de otra especie (`usados` se actualiza con el slug y los nombres).
 */
export function especieDesdeInventario(
  cientifico: string,
  arboles: ArbolInventario[],
  usados: { slugs: Set<string>; nombres: Map<string, string> },
): EspecieCatalogo {
  const textos = textosDeEspecie(arboles);
  const conteo = new Map<string, number>();
  for (const a of arboles) conteo.set(a.nombreComun, (conteo.get(a.nombreComun) ?? 0) + 1);
  const candidatos = [...conteo.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([n]) => separarNombreComun(n))
    .filter(({ nombre }) => normalizarCientifico(nombre) !== cientifico && !usados.nombres.has(claveNombre(nombre)));
  const elegido = candidatos[0] ?? { nombre: cientifico, otros: [] };
  let slug = aSlug(elegido.nombre);
  if (!slug || usados.slugs.has(slug)) slug = aSlug(cientifico);
  for (let n = 2; usados.slugs.has(slug); n++) slug = `${aSlug(cientifico)}-${n}`;
  usados.slugs.add(slug);
  const familia = masFrecuente(arboles.map((a) => a.familia)) ?? "Sin dato";
  const especie: EspecieCatalogo = {
    slug,
    nombre_comun: elegido.nombre,
    otros_nombres: [...new Set(elegido.otros)].filter((n) => !usados.nombres.has(claveNombre(n))).slice(0, 4),
    nombre_cientifico: cientifico,
    familia,
    origen: null,
    distribucion: null,
    descripcion: `${elegido.nombre} (${cientifico}) es una especie de la familia ${familia} registrada en el inventario de árboles de CUCEI.`,
    dato_curioso: null,
    beneficios: [],
    altura_max_m: null,
    follaje: follajeTipo(textos.follaje_texto),
    floracion_meses: [],
    color_flor: colorDeFlor(textos.floracion_texto),
    sprite: proponerSprite(familia, cientifico, textos.floracion_texto),
    ...textos,
    fuente: "Inventario de árboles de CUCEI",
    revisar: true,
  };
  for (const n of [especie.nombre_comun, ...especie.otros_nombres]) usados.nombres.set(claveNombre(n), cientifico);
  return especie;
}

/** Agrupa los árboles por nombre científico normalizado. */
export function agruparPorEspecie(arboles: ArbolInventario[]) {
  const grupos = new Map<string, ArbolInventario[]>();
  for (const a of arboles) grupos.set(a.cientifico, [...(grupos.get(a.cientifico) ?? []), a]);
  return grupos;
}
