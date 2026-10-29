/**
 * Genera los scripts SQL de semillas a partir de los datos en /data:
 *   db/semillas/02_especies.sql      catálogo de especies (con su genoma de sprite)
 *   db/semillas/03_arboles_demo.sql  inventario de demostración
 *
 *   npm run db:sql
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { arregloEntero, arregloTexto, jsonb, lit } from "./sql";

const raiz = path.resolve(import.meta.dirname, "..");
const leer = async (archivo: string) => JSON.parse(await readFile(path.join(raiz, "data", archivo), "utf8"));

interface Especie {
  slug: string;
  nombre_comun: string;
  otros_nombres: string[];
  nombre_cientifico: string;
  familia: string;
  origen: string;
  distribucion: string | null;
  descripcion: string;
  dato_curioso: string | null;
  beneficios: string[];
  altura_max_m: number | null;
  follaje: string | null;
  floracion_meses: number[];
  color_flor: string | null;
  sprite: object;
  gbif_id?: number | null;
  wikipedia_url?: string | null;
  foto_url?: string | null;
  foto_credito?: string | null;
  fuente?: string | null;
}

const { especies } = (await leer("especies.json")) as { especies: Especie[] };
const columnas = [
  "slug", "nombre_comun", "otros_nombres", "nombre_cientifico", "familia", "origen", "distribucion",
  "descripcion", "dato_curioso", "beneficios", "altura_max_m", "follaje", "floracion_meses", "color_flor",
  "sprite", "gbif_id", "wikipedia_url", "foto_url", "foto_credito", "fuente",
];
const filas = especies.map((e) =>
  [
    lit(e.slug), lit(e.nombre_comun), arregloTexto(e.otros_nombres), lit(e.nombre_cientifico), lit(e.familia),
    lit(e.origen), lit(e.distribucion), lit(e.descripcion), lit(e.dato_curioso), arregloTexto(e.beneficios),
    lit(e.altura_max_m), lit(e.follaje), arregloEntero(e.floracion_meses), lit(e.color_flor), jsonb(e.sprite),
    lit(e.gbif_id ?? null), lit(e.wikipedia_url ?? null), lit(e.foto_url ?? null), lit(e.foto_credito ?? null),
    lit(e.fuente ?? "Catálogo curado Bosque CUCEI"),
  ].join(", "),
);
const sqlEspecies = `-- Generado por scripts/generar-sql.ts a partir de data/especies.json. No editar a mano.
-- ${especies.length} especies.
INSERT INTO especies (${columnas.join(", ")}) VALUES
${filas.map((f) => `  (${f})`).join(",\n")}
ON CONFLICT (slug) DO UPDATE SET
${columnas
  .filter((c) => c !== "slug")
  .map((c) => `  ${c} = EXCLUDED.${c}`)
  .join(",\n")};
`;
await writeFile(path.join(raiz, "db", "semillas", "02_especies.sql"), sqlEspecies);

interface ArbolDemo {
  codigo: string;
  qr_id: string;
  especie: string;
  latitud: number;
  longitud: number;
  zona: string;
  altura_m: number | null;
  diametro_cm: number | null;
  fecha_registro: string;
  apodo: string | null;
}
const { arboles } = (await leer("arboles-demo.json")) as { arboles: ArbolDemo[] };
const slugs = new Set(especies.map((e) => e.slug));
for (const a of arboles) if (!slugs.has(a.especie)) throw new Error(`${a.codigo}: especie desconocida ${a.especie}`);
const sqlArboles = `-- Generado por scripts/generar-sql.ts a partir de data/arboles-demo.json. No editar a mano.
-- Inventario de DEMOSTRACIÓN (${arboles.length} árboles). Solo se aplica con: npm run db:migrar -- --demo
INSERT INTO arboles (codigo, qr_id, especie_id, apodo, latitud, longitud, zona, fecha_registro, altura_m, diametro_cm)
SELECT v.codigo, v.qr_id, e.id, v.apodo, v.latitud, v.longitud, v.zona, v.fecha_registro::date, v.altura_m, v.diametro_cm
FROM (VALUES
${arboles
  .map(
    (a) =>
      `  (${[lit(a.codigo), lit(a.qr_id), lit(a.especie), lit(a.apodo), lit(a.latitud), lit(a.longitud), lit(a.zona), lit(a.fecha_registro), `${lit(a.altura_m)}::numeric`, `${lit(a.diametro_cm)}::numeric`].join(", ")})`,
  )
  .join(",\n")}
) AS v (codigo, qr_id, especie, apodo, latitud, longitud, zona, fecha_registro, altura_m, diametro_cm)
JOIN especies e ON e.slug = v.especie
ON CONFLICT (codigo) DO NOTHING;
`;
await writeFile(path.join(raiz, "db", "semillas", "03_arboles_demo.sql"), sqlArboles);

console.log(`✓ db/semillas/02_especies.sql (${especies.length} especies)`);
console.log(`✓ db/semillas/03_arboles_demo.sql (${arboles.length} árboles)`);
