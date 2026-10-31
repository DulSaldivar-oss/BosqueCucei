/**
 * Enriquece el catálogo data/especies.json con bases de datos públicas:
 *
 *   GBIF          identificador taxonómico, familia aceptada y nombres comunes en español
 *   Wikipedia     enlace al artículo en español (y resumen, con --sobrescribir)
 *   iNaturalist   fotografía con licencia Creative Commons y su crédito
 *
 * Uso:
 *   npm run especies:importar                    enriquece todas las especies
 *   npm run especies:importar -- --solo jacaranda
 *   npm run especies:importar -- --sobrescribir  reemplaza descripción con el resumen de Wikipedia
 *   npm run especies:importar -- --descubrir     lista especies observadas en iNaturalist cerca de CUCEI
 *                                                (data/candidatas-inaturalist.json)
 *   npm run especies:importar -- --descubrir --agregar
 *                                                además agrega las candidatas leñosas al catálogo con un
 *                                                sprite propuesto según su familia (revisar a mano)
 *
 * Después: npm run db:sql && npm run db:migrar && npm run sprites
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FormaCopa, GenomaSprite } from "../lib/sprites/generar";

const raiz = path.resolve(import.meta.dirname, "..");
const archivoEspecies = path.join(raiz, "data", "especies.json");
const args = process.argv.slice(2);
const opcion = (nombre: string) => args.includes(`--${nombre}`);
const valor = (nombre: string) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const CUCEI = { lat: 20.6566, lng: -103.3253, radioKm: 1.5 };
const ENCABEZADOS = { "User-Agent": "BosqueCUCEI/0.1 (proyecto universitario; CUCEI Sustentable)" };
const LICENCIAS_LIBRES = new Set(["cc0", "cc-by", "cc-by-sa", "cc-by-nc", "cc-by-nc-sa"]);

interface Especie {
  slug: string;
  nombre_comun: string;
  otros_nombres: string[];
  nombre_cientifico: string;
  familia: string;
  origen: string | null;
  distribucion: string | null;
  descripcion: string;
  dato_curioso: string | null;
  beneficios: string[];
  altura_max_m: number | null;
  follaje: string | null;
  floracion_meses: number[];
  color_flor: string | null;
  sprite: GenomaSprite;
  gbif_id?: number | null;
  wikipedia_url?: string | null;
  foto_url?: string | null;
  foto_credito?: string | null;
  fuente?: string | null;
  revisar?: boolean;
}

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function obtenerJson<T>(url: string): Promise<T | null> {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const respuesta = await fetch(url, { headers: ENCABEZADOS });
      if (respuesta.status === 404) return null;
      if (respuesta.status === 429) {
        await pausa(2000 * intento);
        continue;
      }
      if (!respuesta.ok) throw new Error(`${respuesta.status} ${respuesta.statusText}`);
      return (await respuesta.json()) as T;
    } catch (error) {
      if (intento === 3) {
        console.warn(`    ! ${url}: ${(error as Error).message}`);
        return null;
      }
      await pausa(1000 * intento);
    }
  }
  return null;
}

// ───────────────────────── fuentes ─────────────────────────

async function gbif(cientifico: string) {
  const coincidencia = await obtenerJson<{ usageKey?: number; acceptedUsageKey?: number; family?: string; matchType?: string }>(
    `https://api.gbif.org/v1/species/match?kingdom=Plantae&name=${encodeURIComponent(cientifico)}`,
  );
  if (!coincidencia?.usageKey || coincidencia.matchType === "NONE") return null;
  const id = coincidencia.acceptedUsageKey ?? coincidencia.usageKey;
  const vernaculos = await obtenerJson<{ results: { vernacularName: string; language?: string }[] }>(
    `https://api.gbif.org/v1/species/${id}/vernacularNames?limit=300`,
  );
  const nombres = [
    ...new Set(
      (vernaculos?.results ?? [])
        .filter((v) => v.language === "spa")
        .map((v) => v.vernacularName.trim())
        .map((n) => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()),
    ),
  ];
  return { id, familia: coincidencia.family ?? null, nombres };
}

async function wikipedia(cientifico: string) {
  const resumen = await obtenerJson<{ type?: string; extract?: string; content_urls?: { desktop?: { page?: string } } }>(
    `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cientifico.replace(/ /g, "_"))}`,
  );
  if (!resumen || resumen.type === "disambiguation") return null;
  return { url: resumen.content_urls?.desktop?.page ?? null, extracto: resumen.extract ?? null };
}

interface TaxonINat {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  iconic_taxon_name?: string;
  ancestor_ids?: number[];
  default_photo?: { medium_url?: string; attribution?: string; license_code?: string | null };
}

async function inaturalist(cientifico: string) {
  const datos = await obtenerJson<{ results: TaxonINat[] }>(
    `https://api.inaturalist.org/v1/taxa?rank=species&locale=es&q=${encodeURIComponent(cientifico)}`,
  );
  const taxon = datos?.results.find((t) => t.name.toLowerCase() === cientifico.toLowerCase()) ?? datos?.results[0];
  const foto = taxon?.default_photo;
  if (!foto?.medium_url || !foto.license_code || !LICENCIAS_LIBRES.has(foto.license_code)) return null;
  return { url: foto.medium_url, credito: `${foto.attribution} · iNaturalist` };
}

// ───────────────────────── sprite propuesto ─────────────────────────

const COPA_POR_FAMILIA: Record<string, FormaCopa> = {
  Fabaceae: "paraguas",
  Pinaceae: "conica",
  Cupressaceae: "conica",
  Casuarinaceae: "conica",
  Arecaceae: "palmera",
  Salicaceae: "llorona",
  Myrtaceae: "columnar",
  Proteaceae: "columnar",
  Bignoniaceae: "abierta",
  Malvaceae: "abierta",
};

function spritePropuesto(familia: string | null, semilla: string): GenomaSprite {
  let h = 0;
  for (const c of semilla) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const verdes: [string, string, string][] = [
    ["#2F5E35", "#4A8044", "#78AA5A"],
    ["#3E6A3A", "#5C8C49", "#8AB463"],
    ["#24502E", "#3B7140", "#5F9850"],
    ["#4A6B3E", "#6A8D52", "#98B677"],
  ];
  return {
    copa: (familia && COPA_POR_FAMILIA[familia]) || "redonda",
    hojas: verdes[h % verdes.length],
    tronco: ["#6B5444", "#7C6A58", "#5E4B3D"][h % 3],
    alto: 1,
    ancho: 1,
  };
}

const aSlug = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ───────────────────────── descubrir cerca de CUCEI ─────────────────────────

/** Familias de árboles y palmas; evita llenar el catálogo de hierbas y pastos. */
const FAMILIAS_LENOSAS = new Set([
  "Fabaceae", "Bignoniaceae", "Moraceae", "Myrtaceae", "Oleaceae", "Cupressaceae", "Pinaceae", "Casuarinaceae",
  "Anacardiaceae", "Arecaceae", "Salicaceae", "Malvaceae", "Proteaceae", "Lythraceae", "Ulmaceae", "Fagaceae",
  "Meliaceae", "Rutaceae", "Sapindaceae", "Lauraceae", "Rosaceae", "Burseraceae", "Platanaceae", "Magnoliaceae",
  "Annonaceae", "Combretaceae", "Boraginaceae", "Sapotaceae", "Ebenaceae", "Simaroubaceae", "Araucariaceae",
]);

async function descubrir(catalogo: Especie[]) {
  console.log(`Buscando plantas observadas en iNaturalist a ${CUCEI.radioKm} km de CUCEI…`);
  const conteos = await obtenerJson<{ results: { count: number; taxon: TaxonINat }[] }>(
    `https://api.inaturalist.org/v1/observations/species_counts?lat=${CUCEI.lat}&lng=${CUCEI.lng}&radius=${CUCEI.radioKm}` +
      `&iconic_taxa=Plantae&quality_grade=research&locale=es&per_page=200`,
  );
  if (!conteos) {
    console.error("No se pudo consultar iNaturalist.");
    return;
  }
  const conocidas = new Set(catalogo.map((e) => e.nombre_cientifico.toLowerCase()));
  const candidatas = [];
  for (const { count, taxon } of conteos.results) {
    if (taxon.rank !== "species") continue;
    await pausa(350);
    const datos = await gbif(taxon.name);
    candidatas.push({
      nombre_cientifico: taxon.name,
      nombre_comun: taxon.preferred_common_name ?? null,
      familia: datos?.familia ?? null,
      observaciones_cerca: count,
      en_catalogo: conocidas.has(taxon.name.toLowerCase()),
      lenosa_probable: !!datos?.familia && FAMILIAS_LENOSAS.has(datos.familia),
      foto: taxon.default_photo?.medium_url ?? null,
    });
    process.stdout.write(".");
  }
  console.log();
  await writeFile(path.join(raiz, "data", "candidatas-inaturalist.json"), JSON.stringify(candidatas, null, 2) + "\n");
  const nuevas = candidatas.filter((c) => !c.en_catalogo && c.lenosa_probable);
  console.log(`✓ ${candidatas.length} especies cerca de CUCEI; ${nuevas.length} leñosas que no están en el catálogo.`);
  console.log("  Revisa data/candidatas-inaturalist.json");

  if (opcion("agregar")) {
    for (const c of nuevas) {
      const nombre = c.nombre_comun ? c.nombre_comun.charAt(0).toUpperCase() + c.nombre_comun.slice(1) : c.nombre_cientifico;
      catalogo.push({
        slug: aSlug(nombre),
        nombre_comun: nombre,
        otros_nombres: [],
        nombre_cientifico: c.nombre_cientifico,
        familia: c.familia ?? "Desconocida",
        origen: "introducida",
        distribucion: null,
        descripcion: "Pendiente de redactar.",
        dato_curioso: null,
        beneficios: [],
        altura_max_m: null,
        follaje: null,
        floracion_meses: [],
        color_flor: null,
        sprite: spritePropuesto(c.familia, c.nombre_cientifico),
        fuente: "iNaturalist (observaciones cerca de CUCEI)",
        revisar: true,
      });
    }
    console.log(`✓ ${nuevas.length} especies agregadas con "revisar": true. Completa origen, descripción y sprite.`);
  }
}

// ───────────────────────── principal ─────────────────────────

const datos = JSON.parse(await readFile(archivoEspecies, "utf8")) as { _nota: string; especies: Especie[] };

if (opcion("descubrir")) await descubrir(datos.especies);

const solo = valor("solo");
const sobrescribir = opcion("sobrescribir");
const objetivo = datos.especies.filter((e) => !solo || e.slug === solo);
console.log(`Enriqueciendo ${objetivo.length} especies…`);

for (const especie of objetivo) {
  console.log(`  ${especie.nombre_cientifico}`);
  const g = await gbif(especie.nombre_cientifico);
  if (g) {
    especie.gbif_id = g.id;
    if (g.familia && g.familia !== especie.familia) {
      console.warn(`    ! GBIF reporta la familia ${g.familia} (catálogo: ${especie.familia})`);
      if (sobrescribir) especie.familia = g.familia;
    }
    const existentes = new Set([especie.nombre_comun, ...especie.otros_nombres].map((n) => n.toLowerCase()));
    const extra = g.nombres.filter((n) => !existentes.has(n.toLowerCase()));
    especie.otros_nombres = [...especie.otros_nombres, ...extra].slice(0, 6);
  } else {
    console.warn("    ! sin coincidencia en GBIF");
  }

  const w = await wikipedia(especie.nombre_cientifico);
  if (w?.url) especie.wikipedia_url = w.url;
  // Las especies sin curar (las nuevas del inventario o «Pendiente de redactar») toman el resumen de Wikipedia.
  const sinRedactar = especie.revisar || especie.descripcion.startsWith("Pendiente");
  if (w?.extracto && (sobrescribir || sinRedactar)) especie.descripcion = w.extracto;

  if (!especie.foto_url || sobrescribir) {
    const foto = await inaturalist(especie.nombre_cientifico);
    if (foto) {
      especie.foto_url = foto.url;
      especie.foto_credito = foto.credito;
    }
  }
  const base = especie.fuente?.startsWith("Inventario") ? "Inventario de árboles de CUCEI" : "Catálogo curado Bosque CUCEI";
  especie.fuente = `${base} · GBIF · Wikipedia · iNaturalist`;
  await pausa(400);
}

await writeFile(archivoEspecies, JSON.stringify(datos, null, 2) + "\n");
console.log("✓ data/especies.json actualizado. Siguiente: npm run db:sql && npm run db:migrar && npm run sprites");
