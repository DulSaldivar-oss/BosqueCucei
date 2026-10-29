import { describe, expect, it } from "vitest";
import {
  claveSemana,
  estadoRiego,
  inicioDeSemana,
  inicioProximaSemana,
  semanaAnterior,
  semanasEntre,
} from "@/lib/juego/semana";

describe("semanas en hora de Guadalajara", () => {
  it("usa la semana ISO local, no la de UTC", () => {
    // Domingo 1 nov 2026, 23:30 en Guadalajara = lunes 05:30 UTC.
    expect(claveSemana(new Date("2026-11-02T05:30:00Z"))).toBe("2026-W44");
    // Lunes 2 nov 2026, 00:30 en Guadalajara.
    expect(claveSemana(new Date("2026-11-02T06:30:00Z"))).toBe("2026-W45");
  });

  it("maneja el cambio de año ISO", () => {
    expect(claveSemana(new Date("2027-01-01T18:00:00Z"))).toBe("2026-W53");
    expect(claveSemana(new Date("2027-01-04T18:00:00Z"))).toBe("2027-W01");
    expect(semanaAnterior("2027-W01")).toBe("2026-W53");
    expect(semanaAnterior("2026-W45")).toBe("2026-W44");
  });

  it("calcula el próximo lunes a medianoche local", () => {
    const jueves = new Date("2026-10-29T19:00:00Z");
    expect(inicioProximaSemana(jueves).toISOString()).toBe("2026-11-02T06:00:00.000Z");
    expect(inicioDeSemana("2026-W44").toISOString()).toBe("2026-10-26T06:00:00.000Z");
  });

  it("cuenta semanas entre claves", () => {
    expect(semanasEntre("2026-W40", "2026-W44")).toBe(4);
    expect(semanasEntre("2026-W52", "2027-W02")).toBe(3);
  });

  it("deriva el estado de riego del árbol virtual", () => {
    expect(estadoRiego(null, "2026-W44")).toBe("nuevo");
    expect(estadoRiego("2026-W44", "2026-W44")).toBe("regado");
    expect(estadoRiego("2026-W43", "2026-W44")).toBe("listo");
    expect(estadoRiego("2026-W41", "2026-W44")).toBe("sediento");
  });
});
