import { consulta, pool, type Cliente } from "@/lib/db";
import { claveSemana, diaLocal, diaSiguiente, inicioDeDia, inicioDeSemana, inicioProximaSemana } from "@/lib/juego/semana";

export interface Mision {
  id: number;
  slug: string;
  titulo: string;
  descripcion: string;
  tipo: "visitar_arboles" | "descubrir_especies" | "constancia" | "zona" | "fotografo";
  meta: number;
  zona: string | null;
  recompensa_xp: number;
  icono: string;
  periodicidad: "semanal" | "unica";
  inicia: string;
  termina: string;
  activa: boolean;
}

export interface ProgresoMision {
  mision: Mision;
  periodo: string;
  progreso: number;
  completada: boolean;
  /** Cuándo termina el periodo actual de la misión. */
  cierra: Date;
}

function ventana(m: Mision, ahora: Date) {
  const inicio = inicioDeDia(m.inicia);
  const fin = inicioDeDia(diaSiguiente(m.termina));
  if (m.periodicidad === "unica") return { periodo: "unica", desde: inicio, hasta: fin };
  const semana = claveSemana(ahora);
  const desde = new Date(Math.max(inicioDeSemana(semana).getTime(), inicio.getTime()));
  const hasta = new Date(Math.min(inicioProximaSemana(ahora).getTime(), fin.getTime()));
  return { periodo: semana, desde, hasta };
}

const CONSULTAS: Record<Mision["tipo"], string> = {
  visitar_arboles: `SELECT count(DISTINCT arbol_id) AS n FROM observaciones
                    WHERE usuario_id = $1 AND cuenta AND fecha >= $2 AND fecha < $3`,
  fotografo: `SELECT count(*) AS n FROM observaciones
              WHERE usuario_id = $1 AND cuenta AND fotografia IS NOT NULL AND fecha >= $2 AND fecha < $3`,
  zona: `SELECT count(DISTINCT o.arbol_id) AS n FROM observaciones o JOIN arboles a ON a.id = o.arbol_id
         WHERE o.usuario_id = $1 AND o.cuenta AND o.fecha >= $2 AND o.fecha < $3 AND a.zona = $4`,
  constancia: `SELECT coalesce(max(semanas), 0) AS n FROM (
                 SELECT count(DISTINCT semana) AS semanas FROM observaciones
                 WHERE usuario_id = $1 AND cuenta AND fecha >= $2 AND fecha < $3 GROUP BY arbol_id) t`,
  descubrir_especies: `SELECT count(*) AS n FROM (
                         SELECT a.especie_id, min(ua.fecha_descubrimiento) AS primera
                         FROM usuario_arbol ua JOIN arboles a ON a.id = ua.arbol_id
                         WHERE ua.usuario_id = $1 GROUP BY a.especie_id) t
                       WHERE primera >= $2 AND primera < $3`,
};

export async function misionesActivas(ahora: Date = new Date(), cliente: Cliente = pool()) {
  const hoy = diaLocal(ahora);
  return consulta<Mision>(
    `SELECT * FROM misiones WHERE activa AND inicia <= $1 AND termina >= $1
     ORDER BY periodicidad DESC, recompensa_xp`,
    [hoy],
    cliente,
  );
}

export async function progresoMisiones(usuarioId: number, ahora: Date = new Date(), cliente: Cliente = pool()) {
  const misiones = await misionesActivas(ahora, cliente);
  const completadas = await consulta<{ mision_id: number; periodo: string }>(
    "SELECT mision_id, periodo FROM misiones_completadas WHERE usuario_id = $1",
    [usuarioId],
    cliente,
  );
  const hechas = new Set(completadas.map((c) => `${c.mision_id}|${c.periodo}`));
  const resultado: ProgresoMision[] = [];
  for (const mision of misiones) {
    const { periodo, desde, hasta } = ventana(mision, ahora);
    const params: unknown[] = [usuarioId, desde, hasta];
    if (mision.tipo === "zona") params.push(mision.zona);
    const [{ n }] = await consulta<{ n: number }>(CONSULTAS[mision.tipo], params, cliente);
    resultado.push({
      mision,
      periodo,
      progreso: Math.min(n, mision.meta),
      completada: hechas.has(`${mision.id}|${periodo}`),
      cierra: hasta,
    });
  }
  return resultado;
}

/** Registra las misiones recién cumplidas y devuelve la experiencia que otorgan. */
export async function completarMisiones(cliente: Cliente, usuarioId: number, ahora: Date) {
  const nuevas: Mision[] = [];
  for (const p of await progresoMisiones(usuarioId, ahora, cliente)) {
    if (p.completada || p.progreso < p.mision.meta) continue;
    const insertada = await consulta(
      `INSERT INTO misiones_completadas (usuario_id, mision_id, periodo, completada_en) VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING RETURNING mision_id`,
      [usuarioId, p.mision.id, p.periodo, ahora],
      cliente,
    );
    if (insertada.length === 0) continue;
    await consulta(
      "INSERT INTO xp_eventos (usuario_id, cantidad, motivo, detalle, creado_en) VALUES ($1, $2, 'mision', $3, $4)",
      [usuarioId, p.mision.recompensa_xp, p.mision.titulo, ahora],
      cliente,
    );
    nuevas.push(p.mision);
  }
  return nuevas;
}
