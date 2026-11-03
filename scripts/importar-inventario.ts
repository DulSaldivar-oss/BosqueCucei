/**
 * Convierte el inventario oficial (Excel) en los datos de la semilla:
 *   data/arboles.json            árboles normalizados (fuente de db/semillas/03_arboles.sql)
 *   data/especies.json           agrega las especies nuevas con un sprite propuesto
 *   data/inventario/REPORTE.md   avisos y filas a revisar en campo
 *
 *   npm run inventario:importar                         usa data/inventario/arboles-cucei.xlsx
 *   npm run inventario:importar -- otra/ruta.xlsx
 *
 * Después: npm run db:sql && npm run sprites  (y al desplegar, migrar aplica la semilla nueva).
 * El nombre científico define la especie; los nombres comunes de cada especie se curan en
 * data/especies.json y se conservan entre importaciones.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  agruparPorEspecie,
  claveNombre,
  especieDesdeInventario,
  leerExcel,
  normalizarCientifico,
  separarNombreComun,
  textosDeEspecie,
  type EspecieCatalogo,
} from "../lib/inventario";

const raiz = path.resolve(import.meta.dirname, "..");
const archivo = path.resolve(process.argv[2] ?? path.join(raiz, "data/inventario/arboles-cucei.xlsx"));
const rutaEspecies = path.join(raiz, "data/especies.json");

const lectura = await leerExcel(await readFile(archivo));
if (lectura.errores.length) {
  console.error(`✗ ${lectura.errores.length} filas con errores:`);
  for (const e of lectura.errores.slice(0, 30)) console.error(`  fila ${e.fila}: ${e.mensaje}`);
  process.exit(1);
}

const catalogo = JSON.parse(await readFile(rutaEspecies, "utf8")) as { _nota: string; especies: EspecieCatalogo[] };
const porCientifico = new Map(catalogo.especies.map((e) => [normalizarCientifico(e.nombre_cientifico), e]));
// Slugs y nombres que ya identifican a una especie del catálogo: no se reutilizan para otra.
const usados = { slugs: new Set(catalogo.especies.map((e) => e.slug)), nombres: new Map<string, string>() };
for (const e of catalogo.especies) {
  for (const n of [e.nombre_comun, ...e.otros_nombres]) usados.nombres.set(claveNombre(n), e.nombre_cientifico);
}
const nombresUsados = usados.nombres;

const grupos = agruparPorEspecie(lectura.arboles);
const nuevas: EspecieCatalogo[] = [];
for (const [cientifico, arboles] of grupos) {
  const existente = porCientifico.get(cientifico);
  if (existente) {
    // El catálogo curado manda; solo se completan los textos que falten.
    for (const [clave, valor] of Object.entries(textosDeEspecie(arboles))) if (existente[clave] == null && valor) existente[clave] = valor;
    continue;
  }
  const especie = especieDesdeInventario(cientifico, arboles, usados);
  catalogo.especies.push(especie);
  porCientifico.set(cientifico, especie);
  nuevas.push(especie);
}

// ───────────────────────── árboles ─────────────────────────

const arboles = lectura.arboles
  .sort((a, b) => a.codigo.localeCompare(b.codigo))
  .map((a) => ({
    codigo: a.codigo,
    numero: a.numero,
    campus: a.campus,
    activo: a.activo,
    especie: porCientifico.get(a.cientifico)!.slug,
    latitud: a.latitud,
    longitud: a.longitud,
    zona: a.zona,
    fecha_registro: a.fechaRegistro,
    estado_fitosanitario: a.estadoFitosanitario,
    altura_m: a.alturaM,
    ancho_copa_m: a.anchoCopaM,
    circunferencia_cm: a.circunferenciaCm,
    diametro_cm: a.diametroCm,
    co2_kg: a.co2Kg,
  }));

await writeFile(
  path.join(raiz, "data/arboles.json"),
  JSON.stringify(
    {
      _nota: "Generado por scripts/importar-inventario.ts a partir del inventario oficial. No editar a mano: corrige el Excel y vuelve a importar.",
      fuente: path.relative(raiz, archivo),
      arboles,
    },
    null,
    1,
  ) + "\n",
);
await writeFile(rutaEspecies, JSON.stringify(catalogo, null, 2) + "\n");

// ───────────────────────── reporte ─────────────────────────

const conflictos = lectura.arboles.filter((a) => {
  const dueno = nombresUsados.get(claveNombre(separarNombreComun(a.nombreComun).nombre));
  return dueno !== undefined && dueno !== a.cientifico && normalizarCientifico(a.nombreComun) !== a.cientifico;
});
const unificados = [...grupos].filter(([c, l]) => l.some((a) => a.cientificoOriginal !== c));
const porRevisar = catalogo.especies.filter((e) => e.revisar && grupos.has(normalizarCientifico(e.nombre_cientifico)));
const fila = (...celdas: (string | number)[]) => `| ${celdas.join(" | ")} |`;
const reporte = [
  "# Reporte de la importación del inventario",
  "",
  `Generado por \`npm run inventario:importar\` a partir de \`${path.relative(raiz, archivo)}\`.`,
  "",
  `- Árboles: **${arboles.length}** (${arboles.filter((a) => a.activo).length} activos)`,
  `- Especies distintas: **${grupos.size}** (${nuevas.length} nuevas en esta importación)`,
  `- Especies que falta curar (nombre, origen, descripción): **${porRevisar.length}**`,
  `- Avisos: **${lectura.avisos.length}** · Filas con nombre común de otra especie: **${conflictos.length}**`,
  "",
  "## Avisos",
  "",
  ...(lectura.avisos.length ? lectura.avisos.map((a) => `- ${a.mensaje}`) : ["Sin avisos."]),
  "",
  "## Nombres científicos unificados",
  "",
  "Variantes del mismo nombre (autores, sinónimos o texto descriptivo) que se agruparon en una especie.",
  "",
  fila("Especie", "Escrito en el Excel como"),
  fila("---", "---"),
  ...unificados.map(([c, l]) => fila(`*${c}*`, [...new Set(l.map((a) => a.cientificoOriginal))].join(" · "))),
  "",
  "## Filas a verificar en campo",
  "",
  "El nombre común de estas filas corresponde a otra especie del catálogo. La app usa el nombre científico; si el error está ahí, corrígelo en el Excel y vuelve a importar.",
  "",
  fila("Código", "Nombre científico (se usa)", "Nombre común en el Excel", "Ese nombre corresponde a"),
  fila("---", "---", "---", "---"),
  ...conflictos.map((a) =>
    fila(a.codigo, `*${a.cientifico}*`, a.nombreComun, `*${nombresUsados.get(claveNombre(separarNombreComun(a.nombreComun).nombre))}*`),
  ),
  "",
  "## Especies por curar",
  "",
  "Tienen `\"revisar\": true` en `data/especies.json`: falta confirmar nombre común, origen (nativa o introducida), descripción y calendario de floración. `npm run especies:importar` puede completar parte desde GBIF, Wikipedia e iNaturalist.",
  "",
  fila("Especie", "Nombre común", "Familia", "Árboles"),
  fila("---", "---", "---", "---:"),
  ...porRevisar
    .map((e) => ({ e, n: grupos.get(normalizarCientifico(e.nombre_cientifico))!.length }))
    .sort((x, y) => y.n - x.n)
    .map(({ e, n }) => fila(`*${e.nombre_cientifico}*`, e.nombre_comun, e.familia, n)),
  "",
];
await writeFile(path.join(raiz, "data/inventario/REPORTE.md"), reporte.join("\n"));

console.log(`✓ ${arboles.length} árboles · ${grupos.size} especies (${nuevas.length} nuevas) · ${lectura.avisos.length} avisos · ${conflictos.length} filas a verificar`);
console.log("  data/arboles.json, data/especies.json y data/inventario/REPORTE.md actualizados");
console.log("  Siguiente: npm run db:sql && npm run sprites");
