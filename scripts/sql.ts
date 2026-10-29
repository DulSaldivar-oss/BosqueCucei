/** Utilidades para escribir literales SQL seguros en los scripts generados. */

export function lit(valor: unknown): string {
  if (valor === null || valor === undefined) return "NULL";
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) throw new Error(`Número inválido: ${valor}`);
    return String(valor);
  }
  if (typeof valor === "boolean") return valor ? "true" : "false";
  if (typeof valor === "string") return `'${valor.replace(/'/g, "''")}'`;
  throw new Error(`Tipo no soportado: ${typeof valor}`);
}

export function arregloTexto(valores: string[]): string {
  return valores.length === 0 ? "'{}'::text[]" : `ARRAY[${valores.map(lit).join(", ")}]::text[]`;
}

export function arregloEntero(valores: number[]): string {
  return valores.length === 0 ? "'{}'::int[]" : `ARRAY[${valores.map((v) => lit(Math.trunc(v))).join(", ")}]::int[]`;
}

export function jsonb(valor: unknown): string {
  return `${lit(JSON.stringify(valor))}::jsonb`;
}
