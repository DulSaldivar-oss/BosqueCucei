/**
 * Árboles cercanos (PostgreSQL): la distancia de la consulta coincide con la de lib/geo.
 *   DATABASE_URL_PRUEBAS=postgres://bosque:bosque@localhost:5432/bosque_test npm test
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { distanciaMetros } from "@/lib/geo";
import type { FilaInventario } from "@/lib/inventario-sql";

const url = process.env.DATABASE_URL_PRUEBAS;
const raiz = path.resolve(import.meta.dirname, "..");

describe.skipIf(!url)("arbolesCerca (PostgreSQL)", () => {
  let cerca: typeof import("@/lib/consultas/publico").arbolesCerca;
  let pool: typeof import("@/lib/db").pool;
  let inventario: FilaInventario[];

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    const cliente = new pg.Client({ connectionString: url });
    await cliente.connect();
    await cliente.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    for (const carpeta of ["migraciones", "semillas"]) {
      const dir = path.join(raiz, "db", carpeta);
      for (const archivo of (await readdir(dir)).sort()) await cliente.query(await readFile(path.join(dir, archivo), "utf8"));
    }
    await cliente.end();
    ({ arbolesCerca: cerca } = await import("@/lib/consultas/publico"));
    ({ pool } = await import("@/lib/db"));
    inventario = JSON.parse(await readFile(path.join(raiz, "data/arboles.json"), "utf8")).arboles.filter((a: FilaInventario) => a.activo);
  });

  afterAll(async () => {
    await pool?.().end();
  });

  it.each([10, 50, 120])("devuelve exactamente los árboles a %i m, del más cercano al más lejano", async (radio) => {
    for (const centro of [inventario[0], inventario[300], inventario[800]]) {
      const esperados = inventario
        .map((a) => ({ codigo: a.codigo, d: distanciaMetros([centro.latitud, centro.longitud], [a.latitud, a.longitud]) }))
        .filter((a) => a.d <= radio)
        .map((a) => a.codigo)
        .sort();
      const { puntos, masCercano } = await cerca(null, centro.latitud, centro.longitud, radio);
      expect(puntos.map((p) => p.codigo).sort()).toEqual(esperados);
      expect(puntos.map((p) => p.distancia)).toEqual([...puntos.map((p) => p.distancia)].sort((a, b) => a - b));
      expect(masCercano).toMatchObject({ codigo: centro.codigo, distancia: 0 });
    }
  });

  it("lejos del campus no devuelve árboles, pero sí a cuánto está el más cercano", async () => {
    const { puntos, masCercano } = await cerca(null, 20.6597, -103.3496, 50); // centro de Guadalajara
    expect(puntos).toEqual([]);
    expect(masCercano!.distancia).toBeGreaterThan(2000);
  });
});
