/**
 * Exporta los sprites de cada especie a public/sprites/<slug>/:
 *   etapa-0.svg … etapa-6.svg   un archivo por etapa de crecimiento
 *   hoja.svg                    hoja de sprites con las 7 etapas en fila
 *   silueta.svg                 versión bloqueada para el herbario
 * y public/sprites/indice.json con la lista.
 *
 *   npm run sprites            solo SVG
 *   npm run sprites -- --png   además PNG (usa el Chromium de Playwright)
 *
 * La aplicación dibuja los sprites en línea con el mismo generador; estos archivos
 * sirven para imprimir, redes sociales o para usarlos en otros proyectos.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ETAPAS, generarSprite, VIEWBOX_SPRITE, type GenomaSprite } from "../lib/sprites/generar";

interface Especie {
  slug: string;
  nombre_comun: string;
  nombre_cientifico: string;
  sprite: GenomaSprite;
}

const raiz = path.resolve(import.meta.dirname, "..");
const destino = path.join(raiz, "public", "sprites");
const conPng = process.argv.includes("--png");

const { especies } = JSON.parse(await readFile(path.join(raiz, "data", "especies.json"), "utf8")) as {
  especies: Especie[];
};

const { ancho, alto } = VIEWBOX_SPRITE;
const indice: { slug: string; nombre: string; etapas: string[]; hoja: string }[] = [];
const paraPng: { archivo: string; svg: string; ancho: number; alto: number }[] = [];

for (const especie of especies) {
  const carpeta = path.join(destino, especie.slug);
  await mkdir(carpeta, { recursive: true });
  const etapas: string[] = [];
  const cuerpos: string[] = [];
  for (const { n } of ETAPAS) {
    const svg = generarSprite(especie.sprite, n, { semilla: especie.slug });
    await writeFile(path.join(carpeta, `etapa-${n}.svg`), svg);
    etapas.push(`/sprites/${especie.slug}/etapa-${n}.svg`);
    cuerpos.push(`<g transform="translate(${n * ancho} 0)">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`);
    paraPng.push({ archivo: path.join(carpeta, `etapa-${n}.png`), svg, ancho: ancho * 2, alto: alto * 2 });
  }
  const hoja = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho * ETAPAS.length} ${alto}">${cuerpos.join("")}</svg>`;
  await writeFile(path.join(carpeta, "hoja.svg"), hoja);
  await writeFile(
    path.join(carpeta, "silueta.svg"),
    generarSprite(especie.sprite, 5, { semilla: especie.slug, silueta: "#CFC5B3" }),
  );
  paraPng.push({ archivo: path.join(carpeta, "hoja.png"), svg: hoja, ancho: ancho * ETAPAS.length, alto });
  indice.push({ slug: especie.slug, nombre: especie.nombre_comun, etapas, hoja: `/sprites/${especie.slug}/hoja.svg` });
}

await writeFile(path.join(destino, "indice.json"), JSON.stringify(indice, null, 2) + "\n");
console.log(`✓ ${especies.length} especies × ${ETAPAS.length} etapas en public/sprites`);

if (conPng) {
  // Playwright es opcional: solo se necesita para exportar PNG (npm i -D playwright).
  const modulo = "playwright";
  const { chromium } = await import(modulo);
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  for (const item of paraPng) {
    await pagina.setViewportSize({ width: item.ancho, height: item.alto });
    await pagina.setContent(
      `<html><body style="margin:0;background:transparent">${item.svg.replace("<svg ", `<svg width="${item.ancho}" height="${item.alto}" `)}</body></html>`,
    );
    await pagina.screenshot({ path: item.archivo, omitBackground: true });
  }
  await navegador.close();
  console.log(`✓ ${paraPng.length} PNG`);
}
