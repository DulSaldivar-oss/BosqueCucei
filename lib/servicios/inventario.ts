import type pg from "pg";
import {
  COLUMNAS_INVENTARIO,
  SQL_BAJAS,
  SQL_FIN,
  SQL_SINCRONIZAR,
  SQL_TABLA_INVENTARIO,
  SQL_VERIFICAR_ESPECIES,
  type FilaInventario,
} from "@/lib/inventario-sql";

/**
 * Aplica un inventario completo con las mismas reglas que la semilla 03_arboles.sql.
 * Debe correr dentro de una transacción para que un error no deje cambios a medias.
 */
export async function sincronizarInventario(cliente: pg.PoolClient, filas: FilaInventario[], { bajas }: { bajas: boolean }) {
  await cliente.query(SQL_TABLA_INVENTARIO);
  await cliente.query(
    `INSERT INTO inventario SELECT * FROM unnest(${COLUMNAS_INVENTARIO.map(([, tipo], i) => `$${i + 1}::${tipo}[]`).join(", ")})`,
    COLUMNAS_INVENTARIO.map(([columna]) => filas.map((f) => f[columna])),
  );
  await cliente.query(SQL_VERIFICAR_ESPECIES);
  const sincronizados = (await cliente.query(SQL_SINCRONIZAR)).rowCount ?? 0;
  const dadosDeBaja = bajas ? ((await cliente.query(SQL_BAJAS)).rowCount ?? 0) : 0;
  await cliente.query(SQL_FIN);
  return { sincronizados, dadosDeBaja };
}
