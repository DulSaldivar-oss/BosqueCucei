/**
 * Genera los scripts SQL de semillas a partir de los datos en /data:
 *   db/semillas/02_especies.sql      catálogo de especies (con su genoma de sprite)
 *   db/semillas/03_arboles.sql       inventario oficial de árboles (data/arboles.json)
 *
 *   npm run db:sql
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  COLUMNAS_INVENTARIO,
  SQL_BAJAS,
  SQL_FIN,
  SQL_SINCRONIZAR,
  SQL_TABLA_INVENTARIO,
  SQL_VERIFICAR_ESPECIES,
  type FilaInventario,
} from "../lib/inventario-sql";
import { arregloEntero, arregloTexto, jsonb, lit } from "./sql";

const raiz = path.resolve(import.meta.dirname, "..");
const leer = async (archivo: string) => JSON.parse(await readFile(path.join(raiz, "data", archivo), "utf8"));

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
  sprite: object;
  gbif_id?: number | null;
  wikipedia_url?: string | null;
  foto_url?: string | null;
  foto_credito?: string | null;
  fuente?: string | null;
  follaje_texto?: string | null;
  clima?: string | null;
  floracion_texto?: string | null;
}

const { especies } = (await leer("especies.json")) as { especies: Especie[] };
const columnas = [
  "slug", "nombre_comun", "otros_nombres", "nombre_cientifico", "familia", "origen", "distribucion",
  "descripcion", "dato_curioso", "beneficios", "altura_max_m", "follaje", "floracion_meses", "color_flor",
  "sprite", "gbif_id", "wikipedia_url", "foto_url", "foto_credito", "fuente", "follaje_texto", "clima", "floracion_texto",
];
const filas = especies.map((e) =>
  [
    lit(e.slug), lit(e.nombre_comun), arregloTexto(e.otros_nombres), lit(e.nombre_cientifico), lit(e.familia),
    lit(e.origen), lit(e.distribucion), lit(e.descripcion), lit(e.dato_curioso), arregloTexto(e.beneficios),
    lit(e.altura_max_m), lit(e.follaje), arregloEntero(e.floracion_meses), lit(e.color_flor), jsonb(e.sprite),
    lit(e.gbif_id ?? null), lit(e.wikipedia_url ?? null), lit(e.foto_url ?? null), lit(e.foto_credito ?? null),
    lit(e.fuente ?? "Catálogo curado Bosque CUCEI"), lit(e.follaje_texto ?? null), lit(e.clima ?? null),
    lit(e.floracion_texto ?? null),
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

const { arboles, fuente } = (await leer("arboles.json")) as { arboles: FilaInventario[]; fuente: string };
const slugs = new Set(especies.map((e) => e.slug));
for (const a of arboles) if (!slugs.has(a.especie)) throw new Error(`${a.codigo}: especie desconocida ${a.especie}`);
const sqlArboles = `-- Generado por scripts/generar-sql.ts a partir de data/arboles.json (${fuente}). No editar a mano:
-- corrige el Excel y corre «npm run inventario:importar && npm run db:sql».
-- Inventario oficial: ${arboles.length} árboles. Se vuelve a aplicar en cada despliegue en que cambie
-- (reglas en lib/inventario-sql.ts). Los árboles que salgan del Excel quedan inactivos.
${SQL_TABLA_INVENTARIO}

INSERT INTO inventario VALUES
${arboles.map((a) => `  (${COLUMNAS_INVENTARIO.map(([c]) => lit(a[c])).join(", ")})`).join(",\n")};

${SQL_VERIFICAR_ESPECIES}

${SQL_SINCRONIZAR}

${SQL_BAJAS}

${SQL_FIN}
`;
await writeFile(path.join(raiz, "db", "semillas", "03_arboles.sql"), sqlArboles);

console.log(`✓ db/semillas/02_especies.sql (${especies.length} especies)`);
console.log(`✓ db/semillas/03_arboles.sql (${arboles.length} árboles del inventario)`);
