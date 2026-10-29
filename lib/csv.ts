/**
 * Lector de CSV sencillo: soporta comillas, saltos de línea dentro de comillas y
 * separador coma o punto y coma (Excel en español usa «;»). Encabezados en minúsculas.
 */
export function leerCsv(texto: string): { encabezados: string[]; filas: Record<string, string>[] } {
  const limpio = texto.replace(/^﻿/, "");
  const primeraLinea = limpio.split(/\r?\n/, 1)[0] ?? "";
  const separador = (primeraLinea.match(/;/g)?.length ?? 0) > (primeraLinea.match(/,/g)?.length ?? 0) ? ";" : ",";
  const registros: string[][] = [];
  let campo = "";
  let registro: string[] = [];
  let entreComillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === separador) {
      registro.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      registro.push(campo);
      registros.push(registro);
      registro = [];
      campo = "";
    } else campo += c;
  }
  if (campo !== "" || registro.length) {
    registro.push(campo);
    registros.push(registro);
  }
  const utiles = registros.filter((r) => r.some((v) => v.trim() !== ""));
  const encabezados = (utiles.shift() ?? []).map((e) => e.trim().toLowerCase());
  return {
    encabezados,
    filas: utiles.map((r) => Object.fromEntries(encabezados.map((e, i) => [e, (r[i] ?? "").trim()]))),
  };
}
