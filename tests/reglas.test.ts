import { describe, expect, it } from "vitest";
import { etapaPorVisitas, siguienteEtapa } from "@/lib/juego/crecimiento";
import { nivelPorXp, progresoNivel, xpParaNivel } from "@/lib/juego/niveles";
import { AJUSTES_BASE, calcularXp, estadoDelArbol, evaluarAlerta } from "@/lib/juego/reglas";

describe("niveles", () => {
  it("sube de nivel con la curva definida", () => {
    expect(xpParaNivel(1)).toBe(0);
    expect(xpParaNivel(2)).toBe(60);
    expect(xpParaNivel(3)).toBe(160);
    expect(nivelPorXp(59)).toBe(1);
    expect(nivelPorXp(60)).toBe(2);
    expect(nivelPorXp(161)).toBe(3);
  });

  it("reporta el avance dentro del nivel", () => {
    const p = progresoNivel(110);
    expect(p).toMatchObject({ nivel: 2, enNivel: 50, costo: 100, faltan: 50, porcentaje: 50, titulo: "Germinado" });
  });
});

describe("crecimiento del árbol virtual", () => {
  it("avanza de etapa con las visitas válidas", () => {
    expect([0, 1, 2, 3, 4, 5, 8, 11, 12, 40].map(etapaPorVisitas)).toEqual([0, 1, 2, 3, 3, 4, 5, 5, 6, 6]);
    expect(siguienteEtapa(3)).toEqual({ etapa: 4, faltan: 2 });
    expect(siguienteEtapa(12)).toBeNull();
  });
});

describe("experiencia por observación", () => {
  it("no da experiencia si no es la primera de la semana", () => {
    expect(calcularXp({ cuenta: false, descubrimiento: false, especieNueva: false, conFoto: true, racha: 3 }, AJUSTES_BASE)).toEqual({
      total: 0,
      desglose: [],
    });
  });

  it("suma descubrimiento, especie nueva, foto y racha con tope", () => {
    const r = calcularXp({ cuenta: true, descubrimiento: true, especieNueva: true, conFoto: true, racha: 9 }, AJUSTES_BASE);
    expect(r.desglose.map((p) => p.motivo)).toEqual(["visita", "descubrimiento", "especie_nueva", "foto", "racha"]);
    expect(r.total).toBe(10 + 25 + 40 + 5 + 25);
  });
});

describe("alertas", () => {
  const bien = (usuarioId: number) => ({ usuarioId, estado: "bien", categorias: [] });
  const mal = (usuarioId: number, categorias = ["hojas_secas"], estado = "problema") => ({ usuarioId, estado, categorias });

  it("pide tres personas y dos anomalías", () => {
    expect(evaluarAlerta([mal(1), mal(2)], AJUSTES_BASE)).toBeNull();
    expect(evaluarAlerta([mal(1), bien(2), bien(3)], AJUSTES_BASE)).toBeNull();
    expect(evaluarAlerta([mal(1), mal(1), bien(2), bien(3)], AJUSTES_BASE)).toBeNull();
    const alerta = evaluarAlerta([mal(1), mal(2, ["insectos"]), bien(3)], AJUSTES_BASE);
    expect(alerta?.nivel).toBe("media");
    expect(alerta?.motivo).toContain("3 personas");
  });

  it("escala a alta si todas ven anomalías o alguien pide revisión", () => {
    expect(evaluarAlerta([mal(1), mal(2), mal(3)], AJUSTES_BASE)?.nivel).toBe("alta");
    expect(evaluarAlerta([mal(1, [], "revision"), mal(2), bien(3)], AJUSTES_BASE)?.nivel).toBe("alta");
  });

  it("una rama peligrosa basta para una alerta crítica", () => {
    expect(evaluarAlerta([mal(1, ["rama_peligrosa"])], AJUSTES_BASE)).toMatchObject({ nivel: "critica" });
  });

  it("respeta umbrales ajustados", () => {
    const ajustes = { ...AJUSTES_BASE, alerta_min_usuarios: 1, alerta_min_anomalias: 1 };
    expect(evaluarAlerta([mal(1)], ajustes)?.nivel).toBe("alta");
  });
});

describe("semáforo del árbol", () => {
  const ahora = new Date("2026-10-29T18:00:00Z");
  it("prioriza alertas, luego anomalías y luego frescura", () => {
    expect(estadoDelArbol({ alertaAbierta: "critica", anomaliasRecientes: 0, ultimaObservacion: ahora }, AJUSTES_BASE, ahora)).toBe(
      "revision_requerida",
    );
    expect(estadoDelArbol({ alertaAbierta: "media", anomaliasRecientes: 2, ultimaObservacion: ahora }, AJUSTES_BASE, ahora)).toBe(
      "posible_problema",
    );
    expect(estadoDelArbol({ alertaAbierta: null, anomaliasRecientes: 1, ultimaObservacion: ahora }, AJUSTES_BASE, ahora)).toBe("pendiente");
    expect(estadoDelArbol({ alertaAbierta: null, anomaliasRecientes: 0, ultimaObservacion: null }, AJUSTES_BASE, ahora)).toBe("sin_datos");
    const viejo = new Date(ahora.getTime() - 40 * 86_400_000);
    expect(estadoDelArbol({ alertaAbierta: null, anomaliasRecientes: 0, ultimaObservacion: viejo }, AJUSTES_BASE, ahora)).toBe("sin_datos");
    expect(estadoDelArbol({ alertaAbierta: null, anomaliasRecientes: 0, ultimaObservacion: ahora }, AJUSTES_BASE, ahora)).toBe("normal");
  });
});
