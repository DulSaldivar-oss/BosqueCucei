/** Niveles de experiencia de las personas. */

const TITULOS: [number, string][] = [
  [1, "Semilla"],
  [2, "Germinado"],
  [3, "Brote"],
  [4, "Plántula"],
  [5, "Retoño"],
  [6, "Arbolito"],
  [7, "Árbol joven"],
  [8, "Guardián"],
  [10, "Guardián del bosque"],
  [12, "Custodio"],
  [15, "Sabio del bosque"],
  [20, "Leyenda del bosque"],
];

/** Experiencia para pasar del nivel n al n+1: crece 40 por nivel. */
export function costoNivel(n: number): number {
  return 60 + 40 * (n - 1);
}

/** Experiencia total necesaria para llegar al nivel n. */
export function xpParaNivel(n: number): number {
  const k = Math.max(0, n - 1);
  return 60 * k + 20 * k * (k - 1);
}

export function nivelPorXp(xp: number): number {
  let nivel = 1;
  while (xpParaNivel(nivel + 1) <= xp) nivel++;
  return nivel;
}

export function tituloNivel(nivel: number): string {
  let titulo = TITULOS[0][1];
  for (const [desde, nombre] of TITULOS) if (nivel >= desde) titulo = nombre;
  return titulo;
}

export interface ProgresoNivel {
  nivel: number;
  titulo: string;
  xp: number;
  /** Experiencia acumulada dentro del nivel actual. */
  enNivel: number;
  /** Experiencia que pide el nivel actual para subir. */
  costo: number;
  faltan: number;
  porcentaje: number;
}

export function progresoNivel(xp: number): ProgresoNivel {
  const nivel = nivelPorXp(Math.max(0, xp));
  const enNivel = Math.max(0, xp) - xpParaNivel(nivel);
  const costo = costoNivel(nivel);
  return {
    nivel,
    titulo: tituloNivel(nivel),
    xp,
    enNivel,
    costo,
    faltan: costo - enNivel,
    porcentaje: Math.min(100, Math.round((enNivel / costo) * 100)),
  };
}
