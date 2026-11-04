import { describe, expect, it } from "vitest";
import { evaluarGps, PRECISION_MAXIMA_M, RADIO_VISITA_M, viajeImposible } from "@/lib/juego/presencia";
import { RADIO_CERCA_M } from "@/lib/mapa";
import { ipCliente } from "@/lib/red";
import { destinoSeguro } from "@/lib/seguridad";

const ARBOL = { latitud: 20.655674, longitud: -103.326779 };
/** Punto a `metros` al norte del árbol (1° de latitud ≈ 111.2 km). */
const alNorte = (metros: number) => ({ latitud: ARBOL.latitud + metros / 111_195, longitud: ARBOL.longitud });

describe("presencia por GPS", () => {
  it("acepta dentro de 50 m", () => {
    expect(evaluarGps(ARBOL, { ...alNorte(30), precision: 8 })).toMatchObject({ valida: true });
    expect(evaluarGps(ARBOL, { ...alNorte(49), precision: 0 })).toMatchObject({ valida: true });
  });

  it("descuenta hasta 15 m del error del GPS, no más", () => {
    expect(evaluarGps(ARBOL, { ...alNorte(60), precision: 12 })).toMatchObject({ valida: true });
    expect(evaluarGps(ARBOL, { ...alNorte(70), precision: 60 })).toMatchObject({ valida: false, motivo: "lejos" });
  });

  it("rechaza lejos del árbol y dice a cuánto", () => {
    const r = evaluarGps(ARBOL, { ...alNorte(230), precision: 10 });
    expect(r).toMatchObject({ valida: false, motivo: "lejos" });
    expect(Math.round(r.distancia!)).toBe(230);
  });

  it("rechaza una ubicación demasiado imprecisa o ausente", () => {
    expect(evaluarGps(ARBOL, { ...alNorte(5), precision: PRECISION_MAXIMA_M + 1 })).toMatchObject({ valida: false, motivo: "impreciso" });
    expect(evaluarGps(ARBOL, null)).toMatchObject({ valida: false, motivo: "sin-datos" });
    expect(evaluarGps(ARBOL, { latitud: NaN, longitud: 3, precision: 5 })).toMatchObject({ valida: false, motivo: "sin-datos" });
    expect(evaluarGps(ARBOL, { latitud: 200, longitud: 3, precision: 5 })).toMatchObject({ valida: false, motivo: "sin-datos" });
  });

  it("el mapa «cerca de mí» usa el mismo radio que la visita", () => {
    expect(RADIO_CERCA_M).toBe(RADIO_VISITA_M);
  });
});

describe("velocidad entre árboles", () => {
  const t0 = new Date("2026-11-04T16:00:00Z");
  const despues = (s: number) => new Date(t0.getTime() + s * 1000);

  it("permite caminar o ir en bici de un árbol a otro", () => {
    expect(viajeImposible({ ...ARBOL, fecha: t0 }, { ...alNorte(300), fecha: despues(240) })).toBe(false); // 1.25 m/s
    expect(viajeImposible({ ...ARBOL, fecha: t0 }, { ...alNorte(300), fecha: despues(45) })).toBe(false); // 6.7 m/s
  });

  it("rechaza saltos imposibles (GPS falso)", () => {
    expect(viajeImposible({ ...ARBOL, fecha: t0 }, { ...alNorte(400), fecha: despues(20) })).toBe(true); // 20 m/s
    expect(viajeImposible({ ...ARBOL, fecha: t0 }, { ...alNorte(8000), fecha: despues(600) })).toBe(true);
  });

  it("no castiga árboles vecinos aunque sea seguido", () => {
    expect(viajeImposible({ ...ARBOL, fecha: t0 }, { ...alNorte(40), fecha: despues(1) })).toBe(false);
  });
});

describe("redirección segura", () => {
  it.each([
    ["/jardin", "/jardin"],
    ["/arbol/CUCEI-0048/observar?x=1#a", "/arbol/CUCEI-0048/observar?x=1#a"],
    ["//sitio-malo.com", "/"],
    ["/\\sitio-malo.com", "/"],
    ["https://sitio-malo.com", "/"],
    ["javascript:alert(1)", "/"],
    ["/%2F%2Fsitio-malo.com", "/%2F%2Fsitio-malo.com"],
    ["/\tsitio", "/"],
    [undefined, "/"],
  ])("%s → %s", (entrada, salida) => {
    expect(destinoSeguro(entrada)).toBe(salida);
  });
});

describe("IP del cliente", () => {
  it("toma la que agregó Caddy (la última), no la que escribió el cliente", () => {
    expect(ipCliente(new Headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" }))).toBe("203.0.113.9");
    expect(ipCliente(new Headers({ "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(ipCliente(new Headers())).toBe("local");
  });
});
