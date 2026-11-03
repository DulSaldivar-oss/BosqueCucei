import { describe, expect, it } from "vitest";
import { FONDO_OSM, fondoMapa } from "@/lib/mapa";

describe("fondoMapa", () => {
  it("sin configuración usa OpenStreetMap, que no pide llave", () => {
    expect(fondoMapa({})).toEqual(FONDO_OSM);
    expect(fondoMapa({ MAPA_TILES_URL: "  " })).toEqual(FONDO_OSM);
    expect(FONDO_OSM.url).not.toMatch(/key|token|cartocdn/i);
  });

  it("pone la llave en la plantilla del proveedor", () => {
    const fondo = fondoMapa({
      MAPA_TILES_URL: "https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key={llave}",
      MAPA_TILES_LLAVE: "abc123",
      MAPA_TILES_ATRIBUCION: "&copy; MapTiler",
      MAPA_TILES_ZOOM_MAX: "20",
    });
    expect(fondo).toEqual({
      url: "https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=abc123",
      atribucion: "&copy; MapTiler",
      zoomMaxNativo: 20,
      subdominios: "abc",
    });
  });

  it("si la plantilla pide llave y no hay, vuelve a OpenStreetMap", () => {
    expect(fondoMapa({ MAPA_TILES_URL: "https://ejemplo.com/{z}/{x}/{y}.png?key={llave}" })).toEqual(FONDO_OSM);
  });

  it("ignora un zoom máximo inválido", () => {
    expect(fondoMapa({ MAPA_TILES_URL: "https://ejemplo.com/{z}/{x}/{y}.png", MAPA_TILES_ZOOM_MAX: "abc" }).zoomMaxNativo).toBe(19);
  });
});
