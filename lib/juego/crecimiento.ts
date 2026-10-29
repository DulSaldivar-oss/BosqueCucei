import { ETAPAS } from "@/lib/sprites/generar";

/** Visitas válidas (una por semana) que necesita el árbol virtual para cada etapa. */
export const VISITAS_POR_ETAPA = [0, 1, 2, 3, 5, 8, 12] as const;

export function etapaPorVisitas(visitas: number): number {
  let etapa = 0;
  VISITAS_POR_ETAPA.forEach((minimo, i) => {
    if (visitas >= minimo) etapa = i;
  });
  return etapa;
}

export function nombreEtapa(etapa: number): string {
  return ETAPAS[Math.max(0, Math.min(ETAPAS.length - 1, etapa))].nombre;
}

/** Cuántas visitas faltan para la siguiente etapa, o null si ya es majestuoso. */
export function siguienteEtapa(visitas: number): { etapa: number; faltan: number } | null {
  const actual = etapaPorVisitas(visitas);
  if (actual >= VISITAS_POR_ETAPA.length - 1) return null;
  return { etapa: actual + 1, faltan: VISITAS_POR_ETAPA[actual + 1] - visitas };
}
