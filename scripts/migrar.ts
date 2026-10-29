/**
 * Aplica el esquema y las semillas a PostgreSQL.
 *
 *   npm run db:migrar            migraciones pendientes + semillas que cambiaron
 *   npm run db:migrar -- --demo  además el inventario de demostración (03_arboles_demo.sql)
 *
 * db/migraciones/*.sql  se aplican una sola vez, en orden. No se editan una vez aplicadas:
 *                       los cambios van en un archivo nuevo (002_…sql).
 * db/semillas/*.sql     son idempotentes y se vuelven a correr cuando cambia su contenido.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { urlBaseDatos } from "./entorno";

const raiz = path.resolve(import.meta.dirname, "..");
const conDemo = process.argv.includes("--demo");
const cliente = new pg.Client({ connectionString: urlBaseDatos() });

async function archivosSql(carpeta: string) {
  const dir = path.join(raiz, "db", carpeta);
  const nombres = (await readdir(dir)).filter((n) => n.endsWith(".sql")).sort();
  return Promise.all(
    nombres.map(async (nombre) => {
      const sql = await readFile(path.join(dir, nombre), "utf8");
      return { nombre: `${carpeta}/${nombre}`, sql, suma: createHash("sha256").update(sql).digest("hex") };
    }),
  );
}

async function aplicar(nombre: string, sql: string, suma: string) {
  await cliente.query("BEGIN");
  try {
    await cliente.query(sql);
    await cliente.query(
      `INSERT INTO _migraciones (archivo, suma) VALUES ($1, $2)
       ON CONFLICT (archivo) DO UPDATE SET suma = EXCLUDED.suma, aplicada_en = now()`,
      [nombre, suma],
    );
    await cliente.query("COMMIT");
    console.log(`  ✓ ${nombre}`);
  } catch (error) {
    await cliente.query("ROLLBACK");
    console.error(`  ✗ ${nombre}`);
    throw error;
  }
}

await cliente.connect();
try {
  await cliente.query(`CREATE TABLE IF NOT EXISTS _migraciones (
    archivo text PRIMARY KEY, suma text NOT NULL, aplicada_en timestamptz NOT NULL DEFAULT now())`);
  const { rows } = await cliente.query<{ archivo: string; suma: string }>("SELECT archivo, suma FROM _migraciones");
  const aplicadas = new Map(rows.map((r) => [r.archivo, r.suma]));

  console.log("Migraciones:");
  for (const m of await archivosSql("migraciones")) {
    const previa = aplicadas.get(m.nombre);
    if (!previa) await aplicar(m.nombre, m.sql, m.suma);
    else if (previa !== m.suma) {
      throw new Error(`${m.nombre} cambió después de aplicarse. Crea una migración nueva en lugar de editarla.`);
    }
  }

  console.log("Semillas:");
  for (const s of await archivosSql("semillas")) {
    if (s.nombre.includes("arboles_demo") && !conDemo) continue;
    if (aplicadas.get(s.nombre) !== s.suma) await aplicar(s.nombre, s.sql, s.suma);
  }
  console.log("Listo.");
} finally {
  await cliente.end();
}
