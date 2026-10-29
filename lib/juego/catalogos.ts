/** Catálogos de la sección 6 de la propuesta y del semáforo del mapa. */

export const ESTADOS_REPORTE = [
  { valor: "bien", etiqueta: "Se ve bien", detalle: "Sano y sin cambios", color: "#3F8F4F" },
  { valor: "diferente", etiqueta: "Algo diferente", detalle: "Notas un cambio", color: "#D9A21B" },
  { valor: "problema", etiqueta: "Parece tener un problema", detalle: "Algo no está bien", color: "#E07B39" },
  { valor: "revision", etiqueta: "Necesita revisión", detalle: "Urge que lo vean", color: "#D64545" },
] as const;

export type EstadoReporte = (typeof ESTADOS_REPORTE)[number]["valor"];

export const CATEGORIAS = [
  { valor: "hojas_secas", etiqueta: "Hojas secas o amarillas" },
  { valor: "manchas_hojas", etiqueta: "Manchas en hojas" },
  { valor: "insectos", etiqueta: "Insectos visibles" },
  { valor: "hongos", etiqueta: "Hongos o crecimiento extraño" },
  { valor: "ramas_secas", etiqueta: "Ramas secas" },
  { valor: "dano_tronco", etiqueta: "Daño en tronco" },
  { valor: "dano_personas", etiqueta: "Daño por personas" },
  { valor: "basura", etiqueta: "Basura alrededor" },
  { valor: "falta_agua", etiqueta: "Posible falta de agua" },
  { valor: "arbol_inclinado", etiqueta: "Árbol inclinado" },
  { valor: "rama_peligrosa", etiqueta: "Rama peligrosa" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["valor"];

export function etiquetaCategoria(valor: string): string {
  return CATEGORIAS.find((c) => c.valor === valor)?.etiqueta ?? valor;
}

export function etiquetaEstadoReporte(valor: string): string {
  return ESTADOS_REPORTE.find((e) => e.valor === valor)?.etiqueta ?? valor;
}

export const ESTADOS_ARBOL = {
  normal: { etiqueta: "Normal", corta: "Normal", color: "#3F8F4F", fondo: "#E3F1E2" },
  pendiente: { etiqueta: "Observación pendiente", corta: "Pendiente", color: "#C9930F", fondo: "#FBF0CF" },
  posible_problema: { etiqueta: "Posible problema", corta: "Problema", color: "#E07B39", fondo: "#FCE6D6" },
  revision_requerida: { etiqueta: "Revisión requerida", corta: "Revisión", color: "#D64545", fondo: "#F9DCDC" },
  sin_datos: { etiqueta: "Sin datos recientes", corta: "Sin datos", color: "#8E978F", fondo: "#ECEDE8" },
} as const;

export type EstadoArbol = keyof typeof ESTADOS_ARBOL;

export const TIPOS_USUARIO = [
  { valor: "alumno", etiqueta: "Alumna o alumno" },
  { valor: "academico", etiqueta: "Personal académico" },
  { valor: "administrativo", etiqueta: "Personal administrativo" },
  { valor: "visitante", etiqueta: "Visitante" },
] as const;

export const RAREZAS = {
  comun: { etiqueta: "Común", color: "#6B8F5E" },
  poco_comun: { etiqueta: "Poco común", color: "#3B82C4" },
  rara: { etiqueta: "Rara", color: "#8E6CC4" },
  legendaria: { etiqueta: "Legendaria", color: "#D9A21B" },
} as const;

export type Rareza = keyof typeof RAREZAS;

/** La rareza depende de cuántos ejemplares hay en el campus. */
export function rarezaPorEjemplares(ejemplares: number): Rareza {
  if (ejemplares >= 8) return "comun";
  if (ejemplares >= 4) return "poco_comun";
  if (ejemplares >= 2) return "rara";
  return "legendaria";
}

export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
