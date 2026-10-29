import { describe, expect, it } from "vitest";
import { leerCsv } from "@/lib/csv";

describe("leerCsv", () => {
  it("lee comas, comillas y saltos de línea dentro de comillas", () => {
    const { encabezados, filas } = leerCsv('Codigo,Especie,Apodo\nCUCEI-1,jacaranda,"La de ""siempre"", junto\na la fuente"\r\nCUCEI-2,fresno,\n');
    expect(encabezados).toEqual(["codigo", "especie", "apodo"]);
    expect(filas).toEqual([
      { codigo: "CUCEI-1", especie: "jacaranda", apodo: 'La de "siempre", junto\na la fuente' },
      { codigo: "CUCEI-2", especie: "fresno", apodo: "" },
    ]);
  });

  it("detecta punto y coma de Excel en español", () => {
    const { filas } = leerCsv("﻿codigo;latitud;longitud\nCUCEI-9;20,65;-103,32\n");
    expect(filas[0]).toEqual({ codigo: "CUCEI-9", latitud: "20,65", longitud: "-103,32" });
  });
});
