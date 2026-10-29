import { describe, expect, it } from "vitest";
import especies from "@/data/especies.json";
import { ETAPAS, generarSprite, type GenomaSprite } from "@/lib/sprites/generar";

describe("sprites", () => {
  const lista = especies.especies as unknown as { slug: string; sprite: GenomaSprite }[];

  it("genera un SVG válido para cada especie y etapa", () => {
    for (const e of lista) {
      for (const { n } of ETAPAS) {
        const svg = generarSprite(e.sprite, n, { semilla: e.slug });
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg).not.toContain("NaN");
        expect(svg).not.toContain("undefined");
        expect(svg).not.toMatch(/ id=/);
      }
    }
  });

  it("es determinista por semilla y varía entre semillas", () => {
    const g = lista[0].sprite;
    expect(generarSprite(g, 5, { semilla: "a" })).toBe(generarSprite(g, 5, { semilla: "a" }));
    expect(generarSprite(g, 5, { semilla: "a" })).not.toBe(generarSprite(g, 5, { semilla: "b" }));
  });

  it("la silueta usa un solo color y omite flores", () => {
    const svg = generarSprite(lista[0].sprite, 6, { semilla: "x", silueta: "#cccccc" });
    const colores = new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g)].map((m) => m[1].toLowerCase()));
    expect([...colores].filter((c) => c !== "#ffe58a")).toEqual(["#cccccc"]);
  });
});
