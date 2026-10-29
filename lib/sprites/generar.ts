/**
 * Generador procedural de sprites de árboles.
 *
 * Cada especie trae un "genoma" (forma de copa y colores). Con él y la etapa de
 * crecimiento (0 = semilla … 6 = majestuoso) se dibuja un SVG plano en capas, estilo
 * papel recortado. La `semilla` hace que cada árbol del jardín sea ligeramente distinto
 * pero siempre igual a sí mismo.
 *
 * No usa ids ni gradientes para que varios sprites puedan convivir en la misma página.
 */

export type FormaCopa = "redonda" | "paraguas" | "conica" | "columnar" | "llorona" | "palmera" | "abierta";

export interface GenomaSprite {
  copa: FormaCopa;
  /** Tres tonos de follaje: sombra, medio y luz. */
  hojas: [string, string, string];
  tronco: string;
  /** Color de flor o fruto llamativo; se dibuja en las etapas 5 y 6. */
  flor?: string | null;
  /** 0 a 1. */
  densidadFlor?: number;
  /** Proporción de altura (≈0.6 a 1.4). */
  alto?: number;
  /** Proporción de ancho de copa (≈0.8 a 1.5). */
  ancho?: number;
}

export interface OpcionesSprite {
  semilla?: string | number;
  /** Dibuja todo de un solo color (especies por descubrir). */
  silueta?: string | false;
  sombra?: boolean;
  /** Acerca la cámara en las etapas tempranas (semilla a plántula), que son pequeñas. */
  encuadre?: "completo" | "ajustado";
}

export const ETAPAS = [
  { n: 0, nombre: "Semilla" },
  { n: 1, nombre: "Brote" },
  { n: 2, nombre: "Plántula" },
  { n: 3, nombre: "Joven" },
  { n: 4, nombre: "Adulto" },
  { n: 5, nombre: "Frondoso" },
  { n: 6, nombre: "Majestuoso" },
] as const;

export const ETAPA_MAX = ETAPAS.length - 1;

const ANCHO = 200;
const ALTO = 240;
const SUELO = 222;
const CX = ANCHO / 2;
const TIERRA = "#8B6A4E";
const FALDA_PALMA = "#B79D6E";

// ───────────────────────── utilidades ─────────────────────────

function hashTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function crearAzar(semilla: number) {
  let a = semilla || 1;
  const siguiente = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    n: siguiente,
    entre: (min: number, max: number) => min + (max - min) * siguiente(),
  };
}
type Azar = ReturnType<typeof crearAzar>;

/** Aclara (cantidad > 0) u oscurece (cantidad < 0) un color hex. */
export function ajustarColor(hex: string, cantidad: number): string {
  const limpio = hex.replace("#", "");
  const num = parseInt(limpio.length === 3 ? limpio.replace(/./g, "$&$&") : limpio, 16);
  const canales = [(num >> 16) & 255, (num >> 8) & 255, num & 255].map((c) =>
    Math.round(cantidad >= 0 ? c + (255 - c) * cantidad : c * (1 + cantidad)),
  );
  return "#" + canales.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("");
}

const r1 = (v: number) => Math.round(v * 10) / 10;

class Lienzo {
  partes: string[] = [];
  constructor(private silueta: string | false) {}
  color(c: string) {
    return this.silueta || c;
  }
  circulo(x: number, y: number, r: number, fill: string, extra = "") {
    this.partes.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${this.color(fill)}"${extra}/>`);
  }
  elipse(x: number, y: number, rx: number, ry: number, fill: string, extra = "") {
    this.partes.push(
      `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${this.color(fill)}"${extra}/>`,
    );
  }
  ruta(d: string, fill: string, extra = "") {
    this.partes.push(`<path d="${d}" fill="${fill === "none" ? "none" : this.color(fill)}"${extra}/>`);
  }
  trazo(d: string, stroke: string, ancho: number, extra = "") {
    this.partes.push(
      `<path d="${d}" fill="none" stroke="${this.color(stroke)}" stroke-width="${r1(ancho)}" stroke-linecap="round"${extra}/>`,
    );
  }
  abrir(clase: string, estilo = "") {
    this.partes.push(`<g class="${clase}"${estilo ? ` style="${estilo}"` : ""}>`);
  }
  cerrar() {
    this.partes.push("</g>");
  }
  texto() {
    return this.partes.join("");
  }
}

interface Burbuja {
  x: number;
  y: number;
  r: number;
}

// ───────────────────────── piezas ─────────────────────────

function hoja(l: Lienzo, x: number, y: number, largo: number, angulo: number, color: string) {
  // Hoja almendrada que nace en (x, y) y apunta según el ángulo (grados, 0 = derecha).
  const rad = (angulo * Math.PI) / 180;
  const px = x + Math.cos(rad) * largo;
  const py = y - Math.sin(rad) * largo;
  const nx = -Math.sin(rad) * largo * 0.38;
  const ny = -Math.cos(rad) * largo * 0.38;
  const mx = (x + px) / 2;
  const my = (y + py) / 2;
  l.ruta(
    `M${r1(x)} ${r1(y)} Q${r1(mx + nx)} ${r1(my + ny)} ${r1(px)} ${r1(py)} Q${r1(mx - nx)} ${r1(my - ny)} ${r1(x)} ${r1(y)}Z`,
    color,
  );
}

function montoncito(l: Lienzo) {
  l.elipse(CX, SUELO + 1, 30, 8, ajustarColor(TIERRA, -0.25));
  l.elipse(CX, SUELO - 1, 26, 7, TIERRA);
  l.elipse(CX - 7, SUELO - 3, 10, 2.6, ajustarColor(TIERRA, 0.18));
}

function tronco(l: Lienzo, g: GenomaSprite, base: number, alto: number, anchoBase: number, azar: Azar) {
  const arriba = base - alto;
  const anchoArriba = anchoBase * 0.55;
  const curva = azar.entre(-4, 4);
  const izq = `M${r1(CX - anchoBase)} ${base} C${r1(CX - anchoBase * 0.7 + curva)} ${r1(base - alto * 0.5)} ${r1(CX - anchoArriba + curva)} ${r1(arriba + alto * 0.2)} ${r1(CX - anchoArriba + curva)} ${r1(arriba)}`;
  const der = `L${r1(CX + anchoArriba + curva)} ${r1(arriba)} C${r1(CX + anchoArriba + curva)} ${r1(arriba + alto * 0.2)} ${r1(CX + anchoBase * 0.7 + curva)} ${r1(base - alto * 0.5)} ${r1(CX + anchoBase)} ${base}Z`;
  l.ruta(izq + der, g.tronco);
  // Cara en sombra del tronco.
  l.ruta(
    `M${r1(CX + anchoBase * 0.15)} ${base} C${r1(CX + anchoBase * 0.2 + curva)} ${r1(base - alto * 0.5)} ${r1(CX + curva)} ${r1(arriba + alto * 0.2)} ${r1(CX + curva)} ${r1(arriba)} L${r1(CX + anchoArriba + curva)} ${r1(arriba)} C${r1(CX + anchoArriba + curva)} ${r1(arriba + alto * 0.2)} ${r1(CX + anchoBase * 0.7 + curva)} ${r1(base - alto * 0.5)} ${r1(CX + anchoBase)} ${base}Z`,
    ajustarColor(g.tronco, -0.22),
  );
  return { x: CX + curva, y: arriba };
}

function rama(l: Lienzo, g: GenomaSprite, x0: number, y0: number, x1: number, y1: number, grosor: number) {
  const cx = (x0 + x1) / 2 + (x1 - x0) * 0.1;
  const cy = (y0 + y1) / 2 + Math.abs(x1 - x0) * 0.25;
  l.trazo(`M${r1(x0)} ${r1(y0)} Q${r1(cx)} ${r1(cy)} ${r1(x1)} ${r1(y1)}`, g.tronco, grosor);
}

/** Dibuja un racimo de burbujas en tres capas (sombra, medio, luz). */
function follaje(l: Lienzo, g: GenomaSprite, burbujas: Burbuja[], azar: Azar, aplanar = 1) {
  const [oscuro, medio, claro] = g.hojas;
  for (const b of burbujas) l.elipse(b.x + 2.5, b.y + 3.5, b.r * 1.04, b.r * aplanar * 1.04, ajustarColor(oscuro, -0.18));
  for (const b of burbujas) l.elipse(b.x, b.y, b.r, b.r * aplanar, oscuro);
  for (const b of burbujas) l.elipse(b.x - b.r * 0.12, b.y - b.r * 0.16 * aplanar, b.r * 0.82, b.r * 0.8 * aplanar, medio);
  for (const b of burbujas) {
    if (azar.n() < 0.75) {
      l.elipse(b.x - b.r * 0.32, b.y - b.r * 0.36 * aplanar, b.r * 0.42, b.r * 0.36 * aplanar, claro);
    }
  }
}

function flores(l: Lienzo, color: string, burbujas: Burbuja[], densidad: number, azar: Azar, aplanar = 1) {
  const centro = ajustarColor(color, 0.45);
  const borde = ajustarColor(color, -0.2);
  for (const b of burbujas) {
    const cantidad = Math.round(densidad * 5 + azar.n() * 1.5);
    for (let i = 0; i < cantidad; i++) {
      const a = azar.entre(0, Math.PI * 2);
      const d = Math.sqrt(azar.n()) * b.r * 0.85;
      const x = b.x + Math.cos(a) * d;
      const y = b.y + Math.sin(a) * d * aplanar - b.r * 0.1;
      const r = azar.entre(2.4, 3.6);
      l.circulo(x + 0.6, y + 0.8, r, borde);
      l.circulo(x, y, r, color);
      l.circulo(x - r * 0.3, y - r * 0.3, r * 0.38, centro);
    }
  }
}

function brillos(l: Lienzo, azar: Azar, arriba: number, ancho: number) {
  for (let i = 0; i < 3; i++) {
    const x = CX + azar.entre(-ancho, ancho);
    const y = arriba + azar.entre(-6, 30);
    const s = azar.entre(3.5, 5.5);
    l.ruta(
      `M${r1(x)} ${r1(y - s)} Q${r1(x)} ${r1(y)} ${r1(x + s)} ${r1(y)} Q${r1(x)} ${r1(y)} ${r1(x)} ${r1(y + s)} Q${r1(x)} ${r1(y)} ${r1(x - s)} ${r1(y)} Q${r1(x)} ${r1(y)} ${r1(x)} ${r1(y - s)}Z`,
      "#FFE58A",
      ` class="sp-brillo" style="animation-delay:${r1(i * 0.7)}s"`,
    );
  }
}

// ───────────────────────── copas ─────────────────────────

interface Copa {
  burbujas: Burbuja[];
  aplanar: number;
  /** Punto más alto (y) que alcanza la copa. */
  cima: number;
}

function copaRedonda(cx: number, cy: number, R: number, Rv: number, azar: Azar): Copa {
  const burbujas: Burbuja[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.08 - (1.16 * i) / (n - 1));
    burbujas.push({
      x: cx + Math.cos(a) * R * 0.6 + azar.entre(-3, 3),
      y: cy - Math.sin(a) * Rv * 0.55 + azar.entre(-3, 3),
      r: R * azar.entre(0.4, 0.5),
    });
  }
  burbujas.push({ x: cx + azar.entre(-4, 4), y: cy + Rv * 0.1, r: R * 0.55 });
  burbujas.push({ x: cx - R * 0.25, y: cy + Rv * 0.3, r: R * 0.42 });
  burbujas.push({ x: cx + R * 0.3, y: cy + Rv * 0.28, r: R * 0.4 });
  return { burbujas, aplanar: Rv / R, cima: cy - Rv * 0.55 - R * 0.5 * (Rv / R) };
}

function copaParaguas(cx: number, cy: number, R: number, Rv: number, azar: Azar): Copa {
  const burbujas: Burbuja[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = -1 + (2 * i) / (n - 1);
    burbujas.push({
      x: cx + t * R * 0.82 + azar.entre(-3, 3),
      y: cy - Math.sqrt(Math.max(0, 1 - t * t)) * Rv * 0.5 + azar.entre(-2, 2),
      r: R * azar.entre(0.3, 0.36),
    });
  }
  for (let i = 0; i < 4; i++) {
    burbujas.push({ x: cx + (-0.6 + i * 0.4) * R, y: cy + Rv * 0.12, r: R * 0.3 });
  }
  const aplanar = 0.68;
  return { burbujas, aplanar, cima: cy - Rv * 0.5 - R * 0.36 * aplanar };
}

function copaColumnar(cx: number, cy: number, R: number, Rv: number, azar: Azar): Copa {
  const burbujas: Burbuja[] = [];
  const filas = 6;
  for (let f = 0; f < filas; f++) {
    const t = f / (filas - 1);
    const y = cy + Rv * 0.55 - t * Rv * 1.25;
    const ancho = R * (0.75 - 0.4 * t * t);
    burbujas.push({ x: cx - ancho * 0.45 + azar.entre(-2, 2), y, r: ancho * 0.72 });
    burbujas.push({ x: cx + ancho * 0.45 + azar.entre(-2, 2), y: y - 4, r: ancho * 0.68 });
  }
  const top = burbujas[burbujas.length - 1];
  return { burbujas, aplanar: 1, cima: top.y - top.r };
}

function copaAbierta(cx: number, cy: number, R: number, Rv: number, azar: Azar): Copa {
  const burbujas: Burbuja[] = [];
  const puntas = [
    [-0.78, 0.15],
    [-0.42, -0.42],
    [0.05, -0.62],
    [0.48, -0.38],
    [0.8, 0.12],
  ];
  for (const [px, py] of puntas) {
    const x = cx + px * R + azar.entre(-3, 3);
    const y = cy + py * Rv + azar.entre(-3, 3);
    burbujas.push({ x, y, r: R * 0.27 });
    burbujas.push({ x: x + R * 0.16, y: y + 4, r: R * 0.22 });
    burbujas.push({ x: x - R * 0.15, y: y + 5, r: R * 0.2 });
  }
  return { burbujas, aplanar: 0.85, cima: cy - 0.62 * Rv - R * 0.27 };
}

// ───────────────────────── etapas ─────────────────────────

function etapaTemprana(l: Lienzo, g: GenomaSprite, etapa: number, azar: Azar) {
  montoncito(l);
  if (etapa === 0) {
    l.elipse(CX + 2, SUELO - 5, 6, 4.2, g.tronco, ` transform="rotate(-24 ${CX + 2} ${SUELO - 5})"`);
    l.elipse(CX, SUELO - 6.5, 2.4, 1.3, ajustarColor(g.tronco, 0.35), ` transform="rotate(-24 ${CX} ${SUELO - 6.5})"`);
    l.trazo(`M${CX + 6} ${SUELO - 9} q2 -4 0 -7`, g.hojas[2], 2);
    return;
  }
  const altura = etapa === 1 ? 24 : 52;
  const tallo = etapa === 1 ? g.hojas[1] : ajustarColor(g.tronco, 0.15);
  const punta = SUELO - 4 - altura;
  l.trazo(`M${CX} ${SUELO - 4} Q${CX + 4} ${SUELO - 4 - altura / 2} ${CX} ${punta}`, tallo, etapa === 1 ? 3 : 3.6);
  if (g.copa === "conica") {
    const tiers = etapa === 1 ? 1 : 3;
    for (let i = 0; i < tiers; i++) {
      const y = punta + 6 + i * 13;
      const w = 7 + i * 4;
      l.ruta(`M${CX} ${y - 14} L${CX + w} ${y} L${CX - w} ${y}Z`, g.hojas[i % 2 === 0 ? 1 : 0]);
    }
    return;
  }
  if (g.copa === "palmera") {
    const n = etapa === 1 ? 3 : 5;
    for (let i = 0; i < n; i++) {
      const ang = 150 - (120 * i) / (n - 1);
      hoja(l, CX, punta + 2, etapa === 1 ? 16 : 26, ang, g.hojas[i % 3]);
    }
    return;
  }
  hoja(l, CX, punta + 2, etapa === 1 ? 15 : 18, 150, g.hojas[1]);
  hoja(l, CX, punta + 2, etapa === 1 ? 15 : 18, 30, g.hojas[2]);
  if (etapa === 2) {
    for (let i = 0; i < 4; i++) {
      const y = SUELO - 14 - i * 9;
      hoja(l, CX + 1, y, 13 - i, i % 2 === 0 ? 20 + azar.entre(0, 10) : 160 - azar.entre(0, 10), g.hojas[i % 2]);
    }
  }
}

function palmera(l: Lienzo, g: GenomaSprite, escala: number, azar: Azar, etapa: number) {
  const alto = 150 * (g.alto ?? 1) * escala;
  const base = SUELO;
  const arriba = base - alto;
  const anchoBase = 8 * escala + 2;
  const curva = azar.entre(-6, 6);
  l.ruta(
    `M${r1(CX - anchoBase)} ${base} Q${r1(CX + curva - anchoBase * 0.4)} ${r1(base - alto * 0.5)} ${r1(CX + curva - anchoBase * 0.6)} ${r1(arriba)} L${r1(CX + curva + anchoBase * 0.6)} ${r1(arriba)} Q${r1(CX + curva + anchoBase * 0.4)} ${r1(base - alto * 0.5)} ${r1(CX + anchoBase)} ${base}Z`,
    g.tronco,
  );
  for (let y = base - 8; y > arriba + 14; y -= 9) {
    const t = (base - y) / alto;
    const x = CX + curva * t * (2 - t);
    l.trazo(`M${r1(x - anchoBase * 0.55)} ${r1(y)} L${r1(x + anchoBase * 0.55)} ${r1(y - 1.5)}`, ajustarColor(g.tronco, -0.25), 1.2);
  }
  const tx = CX + curva;
  const largo = 56 * escala * (g.ancho ?? 1);
  // Falda de hojas secas que cuelga bajo la corona.
  const falda = largo * 0.62;
  const ancho = largo * 0.26;
  let d = `M${r1(tx - ancho)} ${r1(arriba)} L${r1(tx + ancho)} ${r1(arriba)}`;
  const picos = 6;
  for (let k = picos; k >= 0; k--) {
    const x = tx - ancho * 0.7 + (1.4 * ancho * k) / picos;
    d += ` L${r1(x)} ${r1(arriba + falda * (k % 2 === 0 ? 0.82 : 1) + azar.entre(-3, 3))}`;
  }
  l.ruta(d + "Z", FALDA_PALMA);
  l.ruta(
    `M${r1(tx + ancho * 0.1)} ${r1(arriba)} L${r1(tx + ancho)} ${r1(arriba)} L${r1(tx + ancho * 0.7)} ${r1(arriba + falda * 0.9)} L${r1(tx + ancho * 0.1)} ${r1(arriba + falda)}Z`,
    ajustarColor(FALDA_PALMA, -0.2),
  );
  l.abrir("sp-copa", `transform-origin:${r1(tx)}px ${r1(arriba)}px`);
  const n = 13;
  for (let i = 0; i < n; i++) {
    const ang = (215 - (250 * i) / (n - 1)) * (Math.PI / 180);
    const ex = tx + Math.cos(ang) * largo;
    const ey = arriba - Math.sin(ang) * largo * 0.62 + largo * 0.05;
    const px = -Math.sin(ang) * 9 * escala;
    const py = -Math.cos(ang) * 9 * escala;
    const color = g.hojas[i % 3];
    l.ruta(
      `M${r1(tx)} ${r1(arriba)} L${r1(ex + px)} ${r1(ey + py)} L${r1(ex + px * 0.3)} ${r1(ey + 5)} L${r1(ex - px * 0.3)} ${r1(ey + 3)} L${r1(ex - px)} ${r1(ey - py)}Z`,
      color,
    );
  }
  l.circulo(tx, arriba, 6 * escala, ajustarColor(g.hojas[0], -0.2));
  l.cerrar();
  if (etapa === 6) brillos(l, azar, arriba - largo * 0.6, largo);
  return arriba - largo * 0.8;
}

function conica(l: Lienzo, g: GenomaSprite, escala: number, azar: Azar, etapa: number) {
  const alto = 34 * escala;
  const pie = tronco(l, g, SUELO, alto, 7 * escala + 2, azar);
  const anchoMax = 50 * escala * (g.ancho ?? 1);
  const altoCopa = 150 * escala * (g.alto ?? 1) * 0.85;
  const pisos = 4;
  l.abrir("sp-copa", `transform-origin:${r1(pie.x)}px ${r1(pie.y + 10)}px`);
  for (let p = 0; p < pisos; p++) {
    const t = p / pisos;
    const base = pie.y + 12 - t * altoCopa * 0.72;
    const w = anchoMax * (1 - t * 0.68);
    const cima = base - altoCopa * 0.42;
    const dientes = 5;
    let d = `M${r1(pie.x)} ${r1(cima)} L${r1(pie.x + w)} ${r1(base)}`;
    for (let k = dientes; k >= 0; k--) {
      const x = pie.x - w + (2 * w * k) / dientes;
      d += ` L${r1(x)} ${r1(base + (k % 2 === 0 ? 0 : 5 + azar.entre(0, 3)))}`;
    }
    d += "Z";
    l.ruta(d, ajustarColor(g.hojas[0], -0.15), ` transform="translate(2.5 3.5)"`);
    l.ruta(d, g.hojas[0]);
    l.ruta(`M${r1(pie.x)} ${r1(cima)} L${r1(pie.x - w * 0.92)} ${r1(base - 1)} L${r1(pie.x - w * 0.1)} ${r1(base - 2)}Z`, g.hojas[1]);
    l.ruta(
      `M${r1(pie.x)} ${r1(cima + 4)} L${r1(pie.x - w * 0.45)} ${r1(base - (base - cima) * 0.45)} L${r1(pie.x - w * 0.12)} ${r1(base - (base - cima) * 0.4)}Z`,
      g.hojas[2],
    );
  }
  l.cerrar();
  const cima = pie.y + 12 - ((pisos - 1) / pisos) * altoCopa * 0.72 - altoCopa * 0.42;
  if (etapa === 6) brillos(l, azar, cima + 10, anchoMax * 0.8);
  return cima;
}

function llorona(l: Lienzo, g: GenomaSprite, escala: number, azar: Azar, etapa: number) {
  const alto = 70 * (g.alto ?? 1) * escala;
  const R = 52 * (g.ancho ?? 1) * escala;
  const pie = tronco(l, g, SUELO, alto, 8 * escala + 2, azar);
  const cy = pie.y - R * 0.18;
  l.abrir("sp-copa", `transform-origin:${r1(pie.x)}px ${r1(pie.y)}px`);
  const copa = copaRedonda(pie.x, cy, R, R * 0.7, azar);
  follaje(l, g, copa.burbujas, azar, copa.aplanar);
  // Ramillas colgantes.
  const n = 16;
  for (let i = 0; i < n; i++) {
    const t = -1 + (2 * i) / (n - 1);
    const x = pie.x + t * R * 0.95;
    const y = cy - Math.sqrt(Math.max(0, 1 - t * t)) * R * 0.35 + R * 0.1;
    const caida = R * azar.entre(0.7, 1.05);
    const color = g.hojas[i % 3];
    l.trazo(`M${r1(x)} ${r1(y)} Q${r1(x + t * 12)} ${r1(y + caida * 0.4)} ${r1(x + t * 8)} ${r1(y + caida)}`, color, 3.2 * escala + 1);
    if (g.flor && etapa >= 5 && azar.n() < (g.densidadFlor ?? 0.5)) {
      for (let k = 0; k < 3; k++) {
        l.circulo(x + t * (6 + k * 1.5), y + caida * (0.45 + k * 0.18), 2.4, g.flor);
      }
    }
  }
  l.cerrar();
  if (etapa === 6) brillos(l, azar, copa.cima, R * 0.8);
  return copa.cima;
}

function frondosa(l: Lienzo, g: GenomaSprite, escala: number, azar: Azar, etapa: number) {
  const proporcionAlto = g.alto ?? 1;
  const R = 54 * (g.ancho ?? 1) * escala;
  let altoTronco = 62 * proporcionAlto * escala;
  let Rv = R * 0.95;
  if (g.copa === "paraguas") {
    altoTronco *= 1.1;
    Rv = R * 0.6;
  } else if (g.copa === "columnar") {
    Rv = R * 1.1 * proporcionAlto;
    altoTronco *= 0.85;
  } else if (g.copa === "abierta") {
    Rv = R * 0.85;
    altoTronco *= 0.95;
  }
  const pie = tronco(l, g, SUELO, altoTronco, 8 * escala + 2.5, azar);
  const cy = pie.y - Rv * (g.copa === "paraguas" ? 0.18 : g.copa === "columnar" ? 0.55 : 0.4);

  let copa: Copa;
  if (g.copa === "paraguas") copa = copaParaguas(pie.x, cy, R, Rv, azar);
  else if (g.copa === "columnar") copa = copaColumnar(pie.x, cy, R * 0.75, Rv, azar);
  else if (g.copa === "abierta") copa = copaAbierta(pie.x, cy, R, Rv, azar);
  else copa = copaRedonda(pie.x, cy, R, Rv, azar);

  if (g.copa === "paraguas" || g.copa === "abierta") {
    // Ramas visibles hacia los racimos de la copa.
    const destinos = g.copa === "paraguas" ? [-0.6, -0.2, 0.25, 0.65] : [-0.75, -0.4, 0.05, 0.45, 0.78];
    for (const t of destinos) {
      const dx = pie.x + t * R;
      const dy = cy + (g.copa === "paraguas" ? 0 : -Math.abs(Math.cos(t * 1.6)) * Rv * 0.5);
      rama(l, g, pie.x, pie.y + 6, dx, dy, (4.5 - Math.abs(t) * 2) * escala + 1);
    }
  }

  l.abrir("sp-copa", `transform-origin:${r1(pie.x)}px ${r1(pie.y)}px`);
  follaje(l, g, copa.burbujas, azar, copa.aplanar);
  const densidad = g.densidadFlor ?? 0;
  if (g.flor && densidad > 0 && etapa >= 5) {
    if (etapa === 6 && densidad >= 0.85) {
      // En plena floración la copa entera se tiñe del color de la flor.
      for (const b of copa.burbujas) {
        if (azar.n() < 0.8) {
          l.elipse(b.x - b.r * 0.2, b.y - b.r * 0.25 * copa.aplanar, b.r * 0.62, b.r * 0.55 * copa.aplanar, ajustarColor(g.flor, -0.08));
        }
      }
    }
    l.abrir("sp-flores");
    flores(l, g.flor, copa.burbujas, etapa === 6 ? densidad : densidad * 0.35, azar, copa.aplanar);
    l.cerrar();
  }
  l.cerrar();
  if (etapa === 6) brillos(l, azar, copa.cima, R * 0.85);
  return copa.cima;
}

// ───────────────────────── API ─────────────────────────

const ESCALA_POR_ETAPA = [0, 0, 0, 0.5, 0.72, 0.9, 1];

/** Devuelve el SVG completo del árbol en la etapa indicada. */
export function generarSprite(genoma: GenomaSprite, etapa: number, opciones: OpcionesSprite = {}): string {
  const e = Math.max(0, Math.min(ETAPA_MAX, Math.round(etapa)));
  const semilla = hashTexto(`${genoma.copa}|${genoma.hojas.join()}|${opciones.semilla ?? 0}`);
  const azar = crearAzar(semilla);
  const l = new Lienzo(opciones.silueta ?? false);
  const conSombra = opciones.sombra ?? true;

  if (e <= 2) {
    l.abrir("sp-arbol", `transform-origin:${CX}px ${SUELO}px`);
    etapaTemprana(l, genoma, e, azar);
    l.cerrar();
    // Misma proporción 5:6, al doble de acercamiento y apoyado en el suelo.
    const vista = opciones.encuadre === "ajustado" ? `${CX - ANCHO / 4} ${ALTO / 2} ${ANCHO / 2} ${ALTO / 2}` : undefined;
    return envolver(l.texto(), vista);
  }

  const escala = ESCALA_POR_ETAPA[e];
  const cuerpo = new Lienzo(opciones.silueta ?? false);
  let cima: number;
  if (genoma.copa === "palmera") cima = palmera(cuerpo, genoma, escala, azar, e);
  else if (genoma.copa === "conica") cima = conica(cuerpo, genoma, escala, azar, e);
  else if (genoma.copa === "llorona") cima = llorona(cuerpo, genoma, escala, azar, e);
  else cima = frondosa(cuerpo, genoma, escala, azar, e);

  // Si la copa se sale del lienzo, se reduce todo desde la base.
  const margen = 6;
  const k = cima < margen ? (SUELO - margen) / (SUELO - cima) : 1;
  const sombraAncho = (genoma.copa === "palmera" ? 34 : 50 * (genoma.ancho ?? 1)) * escala * k;

  if (conSombra && !opciones.silueta) {
    l.elipse(CX, SUELO + 1, sombraAncho, 5 + 3 * escala, "#1E2B22", ` opacity="0.14"`);
  }
  const transformacion = k < 1 ? ` transform="translate(${CX} ${SUELO}) scale(${k.toFixed(3)}) translate(${-CX} ${-SUELO})"` : "";
  l.partes.push(`<g${transformacion}>`);
  l.abrir("sp-arbol", `transform-origin:${CX}px ${SUELO}px`);
  l.partes.push(cuerpo.texto());
  l.cerrar();
  l.partes.push("</g>");
  return envolver(l.texto());
}

function envolver(contenido: string, vista = `0 0 ${ANCHO} ${ALTO}`) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vista}" fill="none" aria-hidden="true">${contenido}</svg>`;
}

export const VIEWBOX_SPRITE = { ancho: ANCHO, alto: ALTO, suelo: SUELO };
