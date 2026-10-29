/**
 * Prueba de integración contra PostgreSQL. Necesita una base vacía de pruebas:
 *   DATABASE_URL_PRUEBAS=postgres://bosque:bosque@localhost:5432/bosque_test npm test
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL_PRUEBAS;

describe.skipIf(!url)("registrarObservacion (PostgreSQL)", () => {
  let cliente: pg.Client;
  let registrar: typeof import("@/lib/servicios/observar").registrarObservacion;
  let pool: typeof import("@/lib/db").pool;
  const ids: Record<string, number> = {};

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    cliente = new pg.Client({ connectionString: url });
    await cliente.connect();
    await cliente.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    const raiz = path.resolve(import.meta.dirname, "..");
    for (const carpeta of ["migraciones", "semillas"]) {
      const dir = path.join(raiz, "db", carpeta);
      for (const archivo of (await readdir(dir)).sort()) {
        await cliente.query(await readFile(path.join(dir, archivo), "utf8"));
      }
    }
    for (const alias of ["ana", "beto", "caro"]) {
      const { rows } = await cliente.query(
        `INSERT INTO usuarios (nombre, alias, correo, hash_contrasena, tipo_usuario)
         VALUES ($1, $1, $1 || '@prueba.mx', 'x', 'alumno') RETURNING id`,
        [alias],
      );
      ids[alias] = rows[0].id;
    }
    const arboles = await cliente.query("SELECT id, codigo FROM arboles WHERE codigo IN ('CUCEI-0001','CUCEI-0002')");
    for (const a of arboles.rows) ids[a.codigo] = a.id;
    ({ registrarObservacion: registrar } = await import("@/lib/servicios/observar"));
    ({ pool } = await import("@/lib/db"));
  });

  afterAll(async () => {
    await cliente?.end();
    await pool?.().end();
  });

  const lunes = new Date("2026-10-26T15:00:00Z");
  const miercoles = new Date("2026-10-28T15:00:00Z");
  const lunesSiguiente = new Date("2026-11-02T15:00:00Z");

  it("la primera observación descubre el árbol y da experiencia", async () => {
    const r = await registrar(
      { usuarioId: ids.ana, arbolId: ids["CUCEI-0001"], estado: "bien", categorias: [], fotografia: null },
      lunes,
    );
    expect(r.cuenta).toBe(true);
    expect(r.arbol).toMatchObject({ descubrimiento: true, especieNueva: true, etapaAntes: 0, etapaDespues: 1, visitas: 1 });
    expect(r.xp.ganada).toBe(10 + 25 + 40);
    expect(r.semana).toBe("2026-W44");
  });

  it("una segunda observación en la misma semana se guarda pero no cuenta", async () => {
    const r = await registrar(
      { usuarioId: ids.ana, arbolId: ids["CUCEI-0001"], estado: "diferente", categorias: ["hojas_secas"] },
      miercoles,
    );
    expect(r.cuenta).toBe(false);
    expect(r.xp.ganada).toBe(0);
    expect(r.arbol.visitas).toBe(1);
    const { rows } = await cliente.query("SELECT count(*)::int AS n FROM observaciones WHERE usuario_id = $1", [ids.ana]);
    expect(rows[0].n).toBe(2);
  });

  it("la semana siguiente vuelve a contar, hace crecer el árbol y suma racha", async () => {
    const r = await registrar(
      { usuarioId: ids.ana, arbolId: ids["CUCEI-0001"], estado: "bien", categorias: [], fotografia: "x.jpg" },
      lunesSiguiente,
    );
    expect(r.cuenta).toBe(true);
    expect(r.arbol).toMatchObject({ descubrimiento: false, etapaAntes: 1, etapaDespues: 2, visitas: 2 });
    expect(r.racha).toBe(2);
    expect(r.xp.desglose.map((p) => p.motivo)).toEqual(["visita", "foto", "racha"]);
  });

  it("tres personas con dos anomalías generan una alerta y cambian el semáforo", async () => {
    const arbol = ids["CUCEI-0002"];
    await registrar({ usuarioId: ids.ana, arbolId: arbol, estado: "problema", categorias: ["insectos"] }, lunesSiguiente);
    let estado = await cliente.query("SELECT estado_actual FROM arboles WHERE id = $1", [arbol]);
    expect(estado.rows[0].estado_actual).toBe("pendiente");
    await registrar({ usuarioId: ids.beto, arbolId: arbol, estado: "diferente", categorias: ["insectos"] }, lunesSiguiente);
    await registrar({ usuarioId: ids.caro, arbolId: arbol, estado: "bien", categorias: [] }, lunesSiguiente);
    const alertas = await cliente.query("SELECT nivel, estado_revision FROM alertas WHERE arbol_id = $1", [arbol]);
    expect(alertas.rows).toEqual([{ nivel: "media", estado_revision: "abierta" }]);
    estado = await cliente.query("SELECT estado_actual FROM arboles WHERE id = $1", [arbol]);
    expect(estado.rows[0].estado_actual).toBe("posible_problema");
  });

  it("completa la misión semanal de visitar tres árboles una sola vez", async () => {
    const otros = await cliente.query("SELECT id FROM arboles WHERE codigo IN ('CUCEI-0003','CUCEI-0004') ORDER BY id");
    const r1 = await registrar({ usuarioId: ids.beto, arbolId: otros.rows[0].id, estado: "bien", categorias: [] }, lunesSiguiente);
    expect(r1.misiones.map((m) => m.titulo)).not.toContain("Guardián semanal");
    const r2 = await registrar({ usuarioId: ids.beto, arbolId: otros.rows[1].id, estado: "bien", categorias: [] }, lunesSiguiente);
    // Beto ya llevaba CUCEI-0002 esta semana: con este son 3.
    expect(r2.misiones.map((m) => m.titulo)).toContain("Guardián semanal");
    const completadas = await cliente.query(
      "SELECT count(*)::int AS n FROM misiones_completadas WHERE usuario_id = $1",
      [ids.beto],
    );
    expect(completadas.rows[0].n).toBeGreaterThanOrEqual(1);
    const usuario = await cliente.query("SELECT xp FROM usuarios WHERE id = $1", [ids.beto]);
    const eventos = await cliente.query("SELECT sum(cantidad)::int AS s FROM xp_eventos WHERE usuario_id = $1", [ids.beto]);
    expect(usuario.rows[0].xp).toBe(eventos.rows[0].s);
  });
});
