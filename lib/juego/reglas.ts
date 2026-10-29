/**
 * Reglas puras del juego: experiencia de una observación, generación de alertas
 * (sección 7 de la propuesta) y estado del semáforo de cada árbol.
 */
import { etiquetaCategoria } from "./catalogos";
import type { EstadoArbol } from "./catalogos";

export interface Ajustes {
  alerta_ventana_dias: number;
  alerta_min_usuarios: number;
  alerta_min_anomalias: number;
  categorias_criticas: string[];
  dias_sin_datos: number;
  xp_visita: number;
  xp_descubrimiento: number;
  xp_especie_nueva: number;
  xp_foto: number;
  xp_racha_por_semana: number;
  xp_racha_max: number;
  xp_validacion: number;
}

export const AJUSTES_BASE: Ajustes = {
  alerta_ventana_dias: 7,
  alerta_min_usuarios: 3,
  alerta_min_anomalias: 2,
  categorias_criticas: ["rama_peligrosa", "arbol_inclinado"],
  dias_sin_datos: 30,
  xp_visita: 10,
  xp_descubrimiento: 25,
  xp_especie_nueva: 40,
  xp_foto: 5,
  xp_racha_por_semana: 5,
  xp_racha_max: 25,
  xp_validacion: 15,
};

export interface PartidaXp {
  motivo: "visita" | "descubrimiento" | "especie_nueva" | "foto" | "racha" | "mision" | "validacion";
  etiqueta: string;
  cantidad: number;
}

export function calcularXp(
  datos: { cuenta: boolean; descubrimiento: boolean; especieNueva: boolean; conFoto: boolean; racha: number | null },
  ajustes: Ajustes,
): { total: number; desglose: PartidaXp[] } {
  if (!datos.cuenta) return { total: 0, desglose: [] };
  const desglose: PartidaXp[] = [{ motivo: "visita", etiqueta: "Visita de la semana", cantidad: ajustes.xp_visita }];
  if (datos.descubrimiento) {
    desglose.push({ motivo: "descubrimiento", etiqueta: "Árbol descubierto", cantidad: ajustes.xp_descubrimiento });
  }
  if (datos.especieNueva) {
    desglose.push({ motivo: "especie_nueva", etiqueta: "Especie nueva en tu herbario", cantidad: ajustes.xp_especie_nueva });
  }
  if (datos.conFoto) desglose.push({ motivo: "foto", etiqueta: "Con fotografía", cantidad: ajustes.xp_foto });
  if (datos.racha !== null && datos.racha >= 2) {
    desglose.push({
      motivo: "racha",
      etiqueta: `Racha de ${datos.racha} semanas`,
      cantidad: Math.min(datos.racha * ajustes.xp_racha_por_semana, ajustes.xp_racha_max),
    });
  }
  return { total: desglose.reduce((s, p) => s + p.cantidad, 0), desglose };
}

export interface ReporteReciente {
  usuarioId: number;
  estado: string;
  categorias: string[];
}

export interface AlertaPropuesta {
  nivel: "media" | "alta" | "critica";
  motivo: string;
  categorias: string[];
}

/**
 * Regla inicial (parametrizable): alerta cuando N personas distintas reportan el árbol
 * dentro de la ventana y al menos M indican una anomalía. Las categorías críticas
 * (riesgo para personas) generan alerta con un solo reporte.
 */
export function evaluarAlerta(reportes: ReporteReciente[], ajustes: Ajustes): AlertaPropuesta | null {
  if (reportes.length === 0) return null;
  const conteo = new Map<string, number>();
  for (const r of reportes) for (const c of r.categorias) conteo.set(c, (conteo.get(c) ?? 0) + 1);
  const categorias = [...conteo.keys()];
  const resumen = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${etiquetaCategoria(c)}${n > 1 ? ` ×${n}` : ""}`)
    .join(", ");

  const criticas = categorias.filter((c) => ajustes.categorias_criticas.includes(c));
  if (criticas.length > 0) {
    return {
      nivel: "critica",
      motivo: `Reporte de riesgo: ${criticas.map(etiquetaCategoria).join(", ")}.`,
      categorias,
    };
  }

  const personas = new Set(reportes.map((r) => r.usuarioId));
  const conAnomalia = new Set(reportes.filter((r) => r.estado !== "bien").map((r) => r.usuarioId));
  if (personas.size < ajustes.alerta_min_usuarios || conAnomalia.size < ajustes.alerta_min_anomalias) return null;

  const urgente = reportes.some((r) => r.estado === "revision") || conAnomalia.size >= ajustes.alerta_min_usuarios;
  return {
    nivel: urgente ? "alta" : "media",
    motivo:
      `${personas.size} personas reportaron el árbol en ${ajustes.alerta_ventana_dias} días; ` +
      `${conAnomalia.size} señalaron anomalías${resumen ? ` (${resumen})` : ""}.`,
    categorias,
  };
}

const PESO_NIVEL = { media: 1, alta: 2, critica: 3 } as const;

export function nivelMayor(a: AlertaPropuesta["nivel"], b: AlertaPropuesta["nivel"]) {
  return PESO_NIVEL[a] >= PESO_NIVEL[b] ? a : b;
}

export function estadoDelArbol(
  datos: { alertaAbierta: AlertaPropuesta["nivel"] | null; anomaliasRecientes: number; ultimaObservacion: Date | null },
  ajustes: Ajustes,
  ahora: Date = new Date(),
): EstadoArbol {
  if (datos.alertaAbierta === "critica" || datos.alertaAbierta === "alta") return "revision_requerida";
  if (datos.alertaAbierta === "media") return "posible_problema";
  if (datos.anomaliasRecientes > 0) return "pendiente";
  if (!datos.ultimaObservacion) return "sin_datos";
  const dias = (ahora.getTime() - datos.ultimaObservacion.getTime()) / 86_400_000;
  return dias > ajustes.dias_sin_datos ? "sin_datos" : "normal";
}
