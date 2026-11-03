import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { distanciaMetros, fueraDeLugar } from "@/lib/geo";
import {
  claveNombre,
  codigoArbol,
  especieDesdeInventario,
  leerExcel,
  leerFilas,
  mapearColumnas,
  normalizarCientifico,
  numero,
  proponerSprite,
  separarNombreComun,
  type ArbolInventario,
} from "@/lib/inventario";
import type { FilaInventario } from "@/lib/inventario-sql";
import { sincronizarInventario } from "@/lib/servicios/inventario";

const raiz = path.resolve(import.meta.dirname, "..");

describe("normalizarCientifico", () => {
  it.each([
    ["Lagerstroemia indica L.", "Lagerstroemia indica"],
    ["Tabebuia rosea (Bertol.) DC.", "Tabebuia rosea"],
    ["Citrus × aurantium", "Citrus aurantium"],
    ["Prunus serrulata 'Kanzan'", "Prunus serrulata"],
    ["Magnolia", "Magnolia spp."],
    ["Bougainvillea glabra o Bougainvillea spectabilis", "Bougainvillea spp."],
    ["Hesperocyparis macrocarpa", "Cupressus macrocarpa"],
    ["Drácena de Madagascar", "Dracaena marginata"],
    ["  FICUS   BENJAMINA ", "Ficus benjamina"],
    ["Magnolia Linnaeus", "Magnolia spp."],
  ])("%s → %s", (original, esperado) => {
    expect(normalizarCientifico(original)).toBe(esperado);
  });
});

describe("valores del Excel", () => {
  it("lee números con coma decimal y descarta texto", () => {
    expect(numero("20,6566")).toBe(20.6566);
    expect(numero(" 12 ")).toBe(12);
    expect(numero(3.5)).toBe(3.5);
    expect(numero("s/d")).toBeNull();
    expect(numero("")).toBeNull();
  });

  it("reconoce las columnas sin importar acentos, mayúsculas ni signos", () => {
    const { indices, faltan } = mapearColumnas(["NO. DE ARBOL", "Nombre Cientifico", "latitud", "Longitud", "CO₂ almacenado (kg)", "Sector"]);
    expect(faltan).toEqual([]);
    expect(indices).toMatchObject({ numero: 0, cientifico: 1, latitud: 2, longitud: 3, co2: 4, zona: 5 });
    expect(mapearColumnas(["codigo", "especie"]).faltan).toEqual(["numero", "cientifico", "latitud", "longitud"]);
  });

  it("separa el nombre común de su alternativa entre paréntesis", () => {
    expect(separarNombreComun("Ceiba (caiba)")).toEqual({ nombre: "Ceiba", otros: ["Caiba"] });
    expect(claveNombre("  Tulipán  Africano")).toBe("tulipan africano");
  });

  it("arma el código con el campus y el número", () => {
    expect(codigoArbol("CUCEI", 27)).toBe("CUCEI-0027");
    expect(codigoArbol("Cu Valles", 1255)).toBe("CUVALLES-1255");
  });
});

describe("leerFilas", () => {
  const encabezados = ["No. de árbol", "Estado", "Especie", "Nombre científico", "Sector", "Latitud", "Longitud", "Vuelta del tronco (cm)", "Familia"];

  it("normaliza cada árbol y calcula el diámetro desde la vuelta del tronco", () => {
    const r = leerFilas([encabezados, [27, "Activo", "Ceiba (caiba)", "Ceiba pentandra (L.) Gaertn.", "Sector 3", 20.6566, "-103,3253", 31.4, "Malvaceae (antes Bombacaceae)"]]);
    expect(r.errores).toEqual([]);
    expect(r.arboles[0]).toMatchObject({
      codigo: "CUCEI-0027",
      activo: true,
      cientifico: "Ceiba pentandra",
      familia: "Malvaceae",
      zona: "Sector 3",
      longitud: -103.3253,
      circunferenciaCm: 31.4,
      diametroCm: 10,
    });
  });

  it("reporta errores y avisos por fila", () => {
    const r = leerFilas([
      encabezados,
      [1, "Activo", "A", "Ficus benjamina", null, 20.65, -103.32],
      [1, "Activo", "B", "Ficus benjamina", "Sector 1", 20.65, -103.32],
      ["x", "Activo", "C", "Ficus benjamina", "Sector 1", 20.65, -103.32],
      [3, "Activo", "D", null, "Sector 1", 20.65, -103.32],
      [4, "Activo", "E", "Ficus benjamina", "Sector 1", 200, -103.32],
      [5, "Baja", "F", "Ficus benjamina", "Sector 1", 20.65, -103.32],
    ]);
    expect(r.errores.map((e) => e.fila)).toEqual([3, 4, 5, 6]);
    expect(r.avisos[0].mensaje).toContain("sin sector");
    expect(r.arboles.find((a) => a.numero === 1)!.zona).toBe("Sin sector");
    expect(r.arboles.find((a) => a.numero === 5)!.activo).toBe(false);
  });
});

describe("coordenadas", () => {
  it("detecta los árboles lejos del resto del campus", () => {
    const campus = Array.from({ length: 20 }, (_, i) => ({ codigo: `A${i}`, latitud: 20.656 + i * 1e-4, longitud: -103.325 }));
    const lejos = fueraDeLugar([...campus, { codigo: "X", latitud: 20.629, longitud: -103.399 }]);
    expect(lejos.map((p) => p.codigo)).toEqual(["X"]);
    expect(lejos[0].distancia / 1000).toBeGreaterThan(8);
    expect(distanciaMetros([20.656, -103.325], [20.657, -103.325])).toBeCloseTo(111.2, 0);
  });
});

describe("especies nuevas del inventario", () => {
  const arbol = (nombreComun: string): ArbolInventario =>
    ({ nombreComun, cientifico: "Bombax ceiba", familia: "Malvaceae", follaje: "Caducifolio", clima: "Tropical", floracion: "Flores rojas vistosas" }) as ArbolInventario;

  it("usa el nombre común más frecuente que no pertenezca a otra especie", () => {
    const usados = { slugs: new Set(["ceiba"]), nombres: new Map([[claveNombre("Ceiba"), "Ceiba pentandra"]]) };
    const e = especieDesdeInventario("Bombax ceiba", [arbol("Ceiba"), arbol("Ceiba"), arbol("Ceiba roja")], usados);
    expect(e).toMatchObject({ slug: "ceiba-roja", nombre_comun: "Ceiba roja", origen: null, follaje: "caducifolio", color_flor: "#D7263D", revisar: true });
    expect(e.sprite.copa).toBe("abierta");
    expect(usados.slugs.has("ceiba-roja")).toBe(true);
  });

  it("si no hay nombre libre usa el científico", () => {
    const usados = { slugs: new Set<string>(), nombres: new Map([[claveNombre("Ceiba"), "Ceiba pentandra"]]) };
    expect(especieDesdeInventario("Bombax ceiba", [arbol("Ceiba")], usados)).toMatchObject({ slug: "bombax-ceiba", nombre_comun: "Bombax ceiba" });
  });

  it("propone la copa según la familia y deja forzarla", () => {
    expect(proponerSprite("Arecaceae", "Cocos nucifera", null).copa).toBe("palmera");
    expect(proponerSprite("Myrtaceae", "Eucalyptus robusta", null).copa).toBe("columnar");
    expect(proponerSprite("Apocynaceae", "Pachypodium lamerei", null, "palmera").copa).toBe("palmera");
  });
});

describe("Excel oficial del repositorio", () => {
  it("se lee sin errores y coincide con data/arboles.json", async () => {
    const lectura = await leerExcel(await readFile(path.join(raiz, "data/inventario/arboles-cucei.xlsx")));
    const { arboles } = JSON.parse(await readFile(path.join(raiz, "data/arboles.json"), "utf8")) as { arboles: FilaInventario[] };
    expect(lectura.errores).toEqual([]);
    expect(lectura.arboles.length).toBe(arboles.length);
    expect(new Set(lectura.arboles.map((a) => a.codigo))).toEqual(new Set(arboles.map((a) => a.codigo)));
  });
});

const url = process.env.DATABASE_URL_PRUEBAS;

describe.skipIf(!url)("sincronización del inventario (PostgreSQL)", () => {
  let cliente: pg.Client;
  let inventario: FilaInventario[];
  const db = () => cliente as unknown as pg.PoolClient;
  const contar = async (sql: string) => Number((await cliente.query(sql)).rows[0].n);

  beforeAll(async () => {
    cliente = new pg.Client({ connectionString: url });
    await cliente.connect();
    await cliente.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    for (const carpeta of ["migraciones", "semillas"]) {
      const dir = path.join(raiz, "db", carpeta);
      for (const archivo of (await readdir(dir)).sort()) await cliente.query(await readFile(path.join(dir, archivo), "utf8"));
    }
    ({ arboles: inventario } = JSON.parse(await readFile(path.join(raiz, "data/arboles.json"), "utf8")));
  });

  afterAll(async () => {
    await cliente?.end();
  });

  it("la semilla carga todo el inventario y se puede volver a aplicar", async () => {
    expect(await contar("SELECT count(*) AS n FROM arboles WHERE fuente = 'inventario' AND activo")).toBe(inventario.length);
    await cliente.query(await readFile(path.join(raiz, "db/semillas/03_arboles.sql"), "utf8"));
    expect(await contar("SELECT count(*) AS n FROM arboles")).toBe(inventario.length);
  });

  it("actualiza por código, conserva lo del panel y da de baja lo que ya no viene", async () => {
    const [a, b, c] = inventario;
    await cliente.query("UPDATE arboles SET apodo = 'El consentido', altura_m = 9.5 WHERE codigo = $1", [a.codigo]);
    await cliente.query(
      `INSERT INTO arboles (codigo, qr_id, especie_id, latitud, longitud, zona)
       SELECT 'PANEL-1', 'PANEL-1', id, 20.65, -103.32, 'Jardín' FROM especies LIMIT 1`,
    );
    const otraEspecie = (await cliente.query("SELECT slug FROM especies WHERE slug <> $1 LIMIT 1", [a.especie])).rows[0].slug;
    await cliente.query("BEGIN");
    const r = await sincronizarInventario(
      db(),
      [
        { ...a, especie: otraEspecie, zona: "Sector 99", altura_m: null },
        { ...b, altura_m: 7.5 },
        c,
      ],
      { bajas: true },
    );
    await cliente.query("COMMIT");
    expect(r).toEqual({ sincronizados: 3, dadosDeBaja: inventario.length - 3 });
    const { rows } = await cliente.query(
      `SELECT a.codigo, e.slug, a.zona, a.apodo, a.altura_m, a.activo FROM arboles a JOIN especies e ON e.id = a.especie_id
       WHERE codigo = ANY($1) ORDER BY codigo`,
      [[a.codigo, b.codigo, "PANEL-1"]],
    );
    expect(rows).toEqual([
      { codigo: a.codigo, slug: otraEspecie, zona: "Sector 99", apodo: "El consentido", altura_m: "9.5", activo: true },
      { codigo: b.codigo, slug: b.especie, zona: b.zona, apodo: null, altura_m: "7.5", activo: true },
      { codigo: "PANEL-1", slug: expect.any(String), zona: "Jardín", apodo: null, altura_m: null, activo: true },
    ]);
    expect(await contar("SELECT count(*) AS n FROM arboles WHERE activo")).toBe(4);
  });

  it("no importa nada si falta una especie del catálogo", async () => {
    await cliente.query("BEGIN");
    await expect(sincronizarInventario(db(), [{ ...inventario[0], especie: "no-existe" }], { bajas: false })).rejects.toThrow(/no-existe/);
    await cliente.query("ROLLBACK");
  });
});
