import { describe, expect, it } from "vitest";
import { candidatosQr } from "@/lib/codigos";

describe("candidatosQr", () => {
  it.each([
    ["48", "CUCEI-0048"],
    ["#48", "CUCEI-0048"],
    ["0048", "CUCEI-0048"],
    ["cucei 48", "CUCEI-0048"],
    ["CUCEI-0048", "CUCEI-0048"],
    ["Espécimen 48", "CUCEI-0048"],
    ["ESPECIMEN: 1255", "CUCEI-1255"],
    ["https://sustentabilidad.cucei.udg.mx/arbol/48", "CUCEI-0048"],
    ["https://sustentabilidad.cucei.udg.mx/arboles/48/", "CUCEI-0048"],
    ["https://sustentabilidad.cucei.udg.mx/?id=48", "CUCEI-0048"],
    ["https://sustentabilidad.cucei.udg.mx/arbol#48", "CUCEI-0048"],
    ["https://bosque.ejemplo.mx/a/CUCEI-0048", "CUCEI-0048"],
  ])("%s → %s", (texto, codigo) => {
    expect(candidatosQr(texto)).toContain(codigo);
  });

  it("conserva el texto completo para los QR registrados a mano en qr_id", () => {
    expect(candidatosQr(" https://qr.ejemplo/x/abc ")).toEqual(expect.arrayContaining(["https://qr.ejemplo/x/abc", "abc"]));
  });

  it("no convierte en código un texto sin número", () => {
    expect(candidatosQr("https://sustentabilidad.cucei.udg.mx/").some((c) => c.startsWith("CUCEI-"))).toBe(false);
  });
});
