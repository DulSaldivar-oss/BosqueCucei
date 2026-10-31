/**
 * SQL de sincronización del inventario. Lo comparten la semilla generada (db/semillas/03_arboles.sql)
 * y la importación desde el panel, para que ambas apliquen exactamente las mismas reglas:
 *   · altas y cambios por código: especie, ubicación, sector, estado y medidas
 *     (una medida vacía en el Excel no borra la que ya tenga la base);
 *   · bajas opcionales: los árboles del inventario que ya no vienen quedan inactivos;
 *   · el apodo, la foto, las notas públicas y el QR se administran en el panel y no se tocan.
 * Todo lee de la tabla temporal «inventario», que se crea al inicio y se borra al final (también
 * funciona fuera de una transacción, p. ej. con «psql -f»; si algo falla, ROLLBACK la descarta).
 */

/** Columnas de la tabla temporal, en orden, con su tipo de PostgreSQL. */
export const COLUMNAS_INVENTARIO = [
  ["codigo", "text"],
  ["campus", "text"],
  ["activo", "boolean"],
  ["especie", "text"],
  ["latitud", "double precision"],
  ["longitud", "double precision"],
  ["zona", "text"],
  ["fecha_registro", "date"],
  ["estado_fitosanitario", "text"],
  ["altura_m", "numeric"],
  ["ancho_copa_m", "numeric"],
  ["circunferencia_cm", "numeric"],
  ["diametro_cm", "numeric"],
  ["co2_kg", "numeric"],
] as const;

export type FilaInventario = {
  [K in (typeof COLUMNAS_INVENTARIO)[number] as K[0]]: K[1] extends "boolean"
    ? boolean
    : K[1] extends "double precision"
      ? number
      : K[1] extends "numeric"
        ? number | null
        : K[0] extends "codigo" | "campus" | "especie" | "zona"
          ? string
          : string | null;
};

export const SQL_TABLA_INVENTARIO = `DROP TABLE IF EXISTS pg_temp.inventario;
CREATE TEMP TABLE inventario (
${COLUMNAS_INVENTARIO.map(([c, t], i) => `  ${c} ${t}${i === 0 ? " PRIMARY KEY" : ""}`).join(",\n")}
);`;

export const SQL_FIN = "DROP TABLE pg_temp.inventario;";

export const SQL_VERIFICAR_ESPECIES = `DO $$
DECLARE faltan text;
BEGIN
  SELECT string_agg(DISTINCT i.especie, ', ') INTO faltan
  FROM inventario i LEFT JOIN especies e ON e.slug = i.especie WHERE e.id IS NULL;
  IF faltan IS NOT NULL THEN
    RAISE EXCEPTION 'El inventario usa especies que no están en el catálogo: %', faltan;
  END IF;
END $$;`;

export const SQL_SINCRONIZAR = `INSERT INTO arboles AS a (
  codigo, qr_id, especie_id, latitud, longitud, zona, campus, fecha_registro, estado_fitosanitario,
  altura_m, ancho_copa_m, circunferencia_cm, diametro_cm, co2_kg, activo, fuente
)
SELECT i.codigo, i.codigo, e.id, i.latitud, i.longitud, i.zona, i.campus, COALESCE(i.fecha_registro, current_date),
       i.estado_fitosanitario, i.altura_m, i.ancho_copa_m, i.circunferencia_cm, i.diametro_cm, i.co2_kg, i.activo, 'inventario'
FROM inventario i JOIN especies e ON e.slug = i.especie
ON CONFLICT (codigo) DO UPDATE SET
  especie_id           = EXCLUDED.especie_id,
  latitud              = EXCLUDED.latitud,
  longitud             = EXCLUDED.longitud,
  zona                 = EXCLUDED.zona,
  campus               = EXCLUDED.campus,
  fecha_registro       = EXCLUDED.fecha_registro,
  estado_fitosanitario = COALESCE(EXCLUDED.estado_fitosanitario, a.estado_fitosanitario),
  altura_m             = COALESCE(EXCLUDED.altura_m, a.altura_m),
  ancho_copa_m         = COALESCE(EXCLUDED.ancho_copa_m, a.ancho_copa_m),
  circunferencia_cm    = COALESCE(EXCLUDED.circunferencia_cm, a.circunferencia_cm),
  diametro_cm          = COALESCE(EXCLUDED.diametro_cm, a.diametro_cm),
  co2_kg               = COALESCE(EXCLUDED.co2_kg, a.co2_kg),
  activo               = EXCLUDED.activo,
  fuente               = 'inventario';`;

export const SQL_BAJAS = `UPDATE arboles SET activo = false
WHERE fuente = 'inventario' AND activo AND codigo NOT IN (SELECT codigo FROM inventario);`;
