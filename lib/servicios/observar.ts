import { leerAjustes } from "@/lib/ajustes";
import { consulta, transaccion, una } from "@/lib/db";
import { ESTADOS_REPORTE, CATEGORIAS } from "@/lib/juego/catalogos";
import { etapaPorVisitas } from "@/lib/juego/crecimiento";
import { nivelPorXp } from "@/lib/juego/niveles";
import { calcularXp, type PartidaXp } from "@/lib/juego/reglas";
import { claveSemana, inicioProximaSemana, semanaAnterior } from "@/lib/juego/semana";
import { reevaluarArbol } from "./alertas";
import { completarMisiones } from "./misiones";

export interface DatosObservacion {
  usuarioId: number;
  arbolId: number;
  estado: string;
  categorias: string[];
  comentario?: string | null;
  fotografia?: string | null;
  duracionMs?: number | null;
}

export interface ResultadoObservacion {
  observacionId: number;
  cuenta: boolean;
  semana: string;
  proximaSemana: string;
  xp: { ganada: number; desglose: PartidaXp[]; total: number; nivelAntes: number; nivelDespues: number };
  arbol: { etapaAntes: number; etapaDespues: number; visitas: number; descubrimiento: boolean; especieNueva: boolean };
  misiones: { titulo: string; recompensa: number }[];
  racha: number;
}

export class ErrorObservacion extends Error {}

const ESTADOS_VALIDOS = new Set<string>(ESTADOS_REPORTE.map((e) => e.valor));
const CATEGORIAS_VALIDAS = new Set<string>(CATEGORIAS.map((c) => c.valor));

/**
 * Registra una observación. Siempre se guarda (sirve para el monitoreo), pero solo la
 * primera de la semana por persona y árbol da experiencia y hace crecer el árbol virtual.
 */
export async function registrarObservacion(datos: DatosObservacion, ahora: Date = new Date()): Promise<ResultadoObservacion> {
  if (!ESTADOS_VALIDOS.has(datos.estado)) throw new ErrorObservacion("Elige cómo ves el árbol.");
  const categorias = [...new Set(datos.categorias)].filter((c) => CATEGORIAS_VALIDAS.has(c));
  const comentario = datos.comentario?.trim().slice(0, 500) || null;
  const duracion = datos.duracionMs && datos.duracionMs > 0 ? Math.min(Math.round(datos.duracionMs), 3_600_000) : null;

  return transaccion(async (c) => {
    // Bloquear a la persona serializa sus observaciones simultáneas (racha y semana).
    const usuario = await una<{ xp: number; nivel: number; racha_semanas: number; ultima_semana_activa: string | null }>(
      "SELECT xp, nivel, racha_semanas, ultima_semana_activa FROM usuarios WHERE id = $1 FOR UPDATE",
      [datos.usuarioId],
      c,
    );
    if (!usuario) throw new ErrorObservacion("Tu sesión ya no es válida.");
    const arbol = await una<{ id: number; especie_id: number }>(
      "SELECT id, especie_id FROM arboles WHERE id = $1 AND activo",
      [datos.arbolId],
      c,
    );
    if (!arbol) throw new ErrorObservacion("Ese árbol no existe.");

    const ajustes = await leerAjustes(c);
    const semana = claveSemana(ahora);
    const relacion = await una<{ numero_visitas: number }>(
      "SELECT numero_visitas FROM usuario_arbol WHERE usuario_id = $1 AND arbol_id = $2 FOR UPDATE",
      [datos.usuarioId, arbol.id],
      c,
    );
    const yaConto = await una(
      "SELECT 1 FROM observaciones WHERE usuario_id = $1 AND arbol_id = $2 AND semana = $3 AND cuenta",
      [datos.usuarioId, arbol.id, semana],
      c,
    );
    const cuenta = !yaConto;
    const descubrimiento = !relacion;
    const especieNueva =
      descubrimiento &&
      !(await una(
        `SELECT 1 FROM usuario_arbol ua JOIN arboles a ON a.id = ua.arbol_id
         WHERE ua.usuario_id = $1 AND a.especie_id = $2`,
        [datos.usuarioId, arbol.especie_id],
        c,
      ));

    let racha = usuario.racha_semanas;
    let rachaParaBono: number | null = null;
    if (cuenta && usuario.ultima_semana_activa !== semana) {
      racha = usuario.ultima_semana_activa === semanaAnterior(semana) ? racha + 1 : 1;
      rachaParaBono = racha;
    }

    const xp = calcularXp(
      { cuenta, descubrimiento, especieNueva, conFoto: !!datos.fotografia, racha: rachaParaBono },
      ajustes,
    );

    const [{ id: observacionId }] = await consulta<{ id: number }>(
      `INSERT INTO observaciones (arbol_id, usuario_id, fecha, semana, cuenta, estado_reportado, categorias,
                                  comentario, fotografia, xp_otorgada, duracion_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [arbol.id, datos.usuarioId, ahora, semana, cuenta, datos.estado, categorias, comentario,
        datos.fotografia ?? null, xp.total, duracion],
      c,
    );

    const visitasAntes = relacion?.numero_visitas ?? 0;
    const visitas = cuenta ? visitasAntes + 1 : visitasAntes;
    await consulta(
      `INSERT INTO usuario_arbol (usuario_id, arbol_id, fecha_descubrimiento, numero_visitas, ultima_visita,
                                  ultima_semana, nivel_arbol_virtual)
       VALUES ($1, $2, $3, $4, $3, $5, $6)
       ON CONFLICT (usuario_id, arbol_id) DO UPDATE SET
         numero_visitas = EXCLUDED.numero_visitas,
         ultima_visita = EXCLUDED.ultima_visita,
         ultima_semana = CASE WHEN $7 THEN EXCLUDED.ultima_semana ELSE usuario_arbol.ultima_semana END,
         nivel_arbol_virtual = EXCLUDED.nivel_arbol_virtual`,
      [datos.usuarioId, arbol.id, ahora, visitas, semana, etapaPorVisitas(visitas), cuenta],
      c,
    );

    for (const partida of xp.desglose) {
      await consulta(
        `INSERT INTO xp_eventos (usuario_id, cantidad, motivo, detalle, observacion_id, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [datos.usuarioId, partida.cantidad, partida.motivo, partida.etiqueta, observacionId, ahora],
        c,
      );
    }

    const misiones = cuenta ? await completarMisiones(c, datos.usuarioId, ahora) : [];
    const xpMisiones = misiones.reduce((s, m) => s + m.recompensa_xp, 0);
    const xpTotal = usuario.xp + xp.total + xpMisiones;
    const nivel = nivelPorXp(xpTotal);
    await consulta(
      `UPDATE usuarios SET xp = $2, nivel = $3, racha_semanas = $4,
         ultima_semana_activa = CASE WHEN $5 THEN $6 ELSE ultima_semana_activa END
       WHERE id = $1`,
      [datos.usuarioId, xpTotal, nivel, racha, cuenta, semana],
      c,
    );

    await reevaluarArbol(c, arbol.id, ajustes, ahora);

    return {
      observacionId,
      cuenta,
      semana,
      proximaSemana: inicioProximaSemana(ahora).toISOString(),
      xp: {
        ganada: xp.total + xpMisiones,
        desglose: [
          ...xp.desglose,
          ...misiones.map((m) => ({ motivo: "mision" as const, etiqueta: `Misión: ${m.titulo}`, cantidad: m.recompensa_xp })),
        ],
        total: xpTotal,
        nivelAntes: usuario.nivel,
        nivelDespues: nivel,
      },
      arbol: {
        etapaAntes: descubrimiento ? 0 : etapaPorVisitas(visitasAntes),
        etapaDespues: etapaPorVisitas(visitas),
        visitas,
        descubrimiento,
        especieNueva,
      },
      misiones: misiones.map((m) => ({ titulo: m.titulo, recompensa: m.recompensa_xp })),
      racha,
    };
  });
}
