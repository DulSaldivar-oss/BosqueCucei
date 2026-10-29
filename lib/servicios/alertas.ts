import { consulta, una, type Cliente } from "@/lib/db";
import { estadoDelArbol, evaluarAlerta, nivelMayor, type AlertaPropuesta, type Ajustes } from "@/lib/juego/reglas";

/**
 * Revisa los reportes recientes de un árbol: crea o actualiza su alerta y recalcula
 * el semáforo. Solo cuentan los reportes posteriores a la última alerta cerrada.
 */
export async function reevaluarArbol(cliente: Cliente, arbolId: number, ajustes: Ajustes, ahora: Date = new Date()) {
  const cierre = await una<{ ultima: Date | null }>(
    `SELECT max(resuelta_en) AS ultima FROM alertas
     WHERE arbol_id = $1 AND estado_revision IN ('resuelta', 'descartada')`,
    [arbolId],
    cliente,
  );
  const ventana = new Date(ahora.getTime() - ajustes.alerta_ventana_dias * 86_400_000);
  const desde = cierre?.ultima && cierre.ultima > ventana ? cierre.ultima : ventana;

  const reportes = await consulta<{ usuario_id: number; estado_reportado: string; categorias: string[] }>(
    `SELECT usuario_id, estado_reportado, categorias FROM observaciones
     WHERE arbol_id = $1 AND fecha > $2 AND fecha <= $3 AND validada IS DISTINCT FROM false`,
    [arbolId, desde, ahora],
    cliente,
  );
  const propuesta = evaluarAlerta(
    reportes.map((r) => ({ usuarioId: r.usuario_id, estado: r.estado_reportado, categorias: r.categorias })),
    ajustes,
  );

  const abierta = await una<{ id: number; nivel: AlertaPropuesta["nivel"]; categorias: string[] }>(
    `SELECT id, nivel, categorias FROM alertas
     WHERE arbol_id = $1 AND estado_revision IN ('abierta', 'en_revision') FOR UPDATE`,
    [arbolId],
    cliente,
  );
  let nivelAbierta = abierta?.nivel ?? null;
  let alertaNueva = false;
  if (propuesta) {
    if (abierta) {
      nivelAbierta = nivelMayor(abierta.nivel, propuesta.nivel);
      await consulta(
        `UPDATE alertas SET nivel = $2, motivo = $3, categorias = $4, actualizada_en = $5 WHERE id = $1`,
        [abierta.id, nivelAbierta, propuesta.motivo, [...new Set([...abierta.categorias, ...propuesta.categorias])], ahora],
        cliente,
      );
    } else {
      nivelAbierta = propuesta.nivel;
      alertaNueva = true;
      await consulta(
        `INSERT INTO alertas (arbol_id, nivel, motivo, categorias, fecha_generacion, actualizada_en)
         VALUES ($1, $2, $3, $4, $5, $5)`,
        [arbolId, propuesta.nivel, propuesta.motivo, propuesta.categorias, ahora],
        cliente,
      );
    }
  }

  const ultima = await una<{ fecha: Date | null }>(
    "SELECT max(fecha) AS fecha FROM observaciones WHERE arbol_id = $1 AND validada IS DISTINCT FROM false",
    [arbolId],
    cliente,
  );
  const estado = estadoDelArbol(
    {
      alertaAbierta: nivelAbierta,
      anomaliasRecientes: reportes.filter((r) => r.estado_reportado !== "bien").length,
      ultimaObservacion: ultima?.fecha ?? null,
    },
    ajustes,
    ahora,
  );
  await consulta("UPDATE arboles SET estado_actual = $2, ultima_observacion = $3 WHERE id = $1", [
    arbolId,
    estado,
    ultima?.fecha ?? null,
  ], cliente);
  return { estado, alertaNueva };
}

let ultimoRefresco = 0;

/**
 * El semáforo también cambia con el paso del tiempo (reportes que salen de la ventana,
 * árboles que se quedan sin datos). Se refresca como máximo cada 10 minutos al leer.
 */
export async function refrescarEstados(cliente: Cliente, ajustes: Ajustes, forzar = false) {
  if (!forzar && Date.now() - ultimoRefresco < 10 * 60_000) return;
  ultimoRefresco = Date.now();
  const candidatos = await consulta<{ id: number }>(
    `SELECT a.id FROM arboles a
     WHERE a.activo AND (
       (a.estado_actual = 'normal' AND (a.ultima_observacion IS NULL
          OR a.ultima_observacion < now() - make_interval(days => $1)))
       OR (a.estado_actual = 'pendiente' AND NOT EXISTS (
          SELECT 1 FROM observaciones o WHERE o.arbol_id = a.id AND o.estado_reportado <> 'bien'
            AND o.fecha > now() - make_interval(days => $2))))`,
    [ajustes.dias_sin_datos, ajustes.alerta_ventana_dias],
    cliente,
  );
  for (const { id } of candidatos) await reevaluarArbol(cliente, id, ajustes);
}
