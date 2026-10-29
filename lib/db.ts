import pg from "pg";

// count(*) y bigint llegan como texto; numeric también. Para esta app caben en number.
pg.types.setTypeParser(20, (v) => Number.parseInt(v, 10));
pg.types.setTypeParser(1700, (v) => Number.parseFloat(v));
// Las columnas date se quedan como texto «AAAA-MM-DD» para no moverlas de zona horaria.
pg.types.setTypeParser(1082, (v) => v);

const global = globalThis as unknown as { __poolBosque?: pg.Pool };

export function pool(): pg.Pool {
  if (!global.__poolBosque) {
    if (!process.env.DATABASE_URL) throw new Error("Falta la variable DATABASE_URL");
    global.__poolBosque = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return global.__poolBosque;
}

export type Cliente = pg.Pool | pg.PoolClient;

export async function consulta<T extends pg.QueryResultRow>(sql: string, params: unknown[] = [], cliente: Cliente = pool()) {
  const { rows } = await cliente.query<T>(sql, params);
  return rows;
}

export async function una<T extends pg.QueryResultRow>(sql: string, params: unknown[] = [], cliente: Cliente = pool()) {
  const filas = await consulta<T>(sql, params, cliente);
  return filas[0] ?? null;
}

export async function transaccion<T>(fn: (cliente: pg.PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool().connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}
