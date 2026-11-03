import jsQR from "jsqr";
import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { leerImagen, leerQr, recortarYEscalar, VARIANTES_CAMARA, type Imagen } from "@/lib/escaneo";

const TEXTO = "https://sustentabilidad.cucei.udg.mx/arbol/48";

/** Cuadro de cámara con una placa sintética: QR grabado en acero cepillado, con luz y ruido. */
function placa({
  claroSobreOscuro = false,
  ladoQr = 360,
  luz = [110, 110] as [number, number],
  contraste = 60,
  ruido = 22,
  ancho = 1280,
  alto = 720,
}): Imagen {
  const { modules } = QRCode.create(TEXTO, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const modulo = ladoQr / (n + 8);
  const x0 = (ancho - ladoQr) / 2;
  const y0 = (alto - ladoQr) / 2;
  // mulberry32: ruido determinista y sin patrones.
  let semilla = 7;
  const azar = () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
  const data = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const metal = luz[0] + ((luz[1] - luz[0]) * x) / ancho + 6 * Math.sin(y * 1.7);
      const mx = Math.floor((x - x0) / modulo) - 4;
      const my = Math.floor((y - y0) / modulo) - 4;
      const grabado = mx >= 0 && my >= 0 && mx < n && my < n && modules.get(my, mx) === 1;
      const v = (grabado ? metal + (claroSobreOscuro ? contraste : -contraste) : metal) + azar() * ruido;
      const i = (y * ancho + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, width: ancho, height: alto };
}

/** Lo que hacía el escáner antes: todo el cuadro reducido a 520 px y solo códigos oscuros sobre claro. */
function lecturaAnterior(img: Imagen) {
  const chica = recortarYEscalar(img, { recorte: 1, lado: 520, suavizado: 0, igualar: false });
  return jsQR(chica.data, chica.width, chica.height, { inversionAttempts: "dontInvert" })?.data ?? null;
}

/** Como en la cámara: una variante por cuadro hasta leerlo. */
function lecturaCamara(img: Imagen) {
  for (const v of VARIANTES_CAMARA) {
    const texto = leerQr(recortarYEscalar(img, v), v);
    if (texto) return texto;
  }
  return null;
}

describe("lectura de placas grabadas", () => {
  it.each([
    ["grabado claro sobre metal oscuro", { claroSobreOscuro: true, ruido: 15 }],
    ["grabado claro, luz muy dispareja y ruido", { claroSobreOscuro: true, luz: [40, 220] as [number, number], contraste: 50, ruido: 30 }],
    ["código pequeño en el cuadro, con ruido", { ladoQr: 200, ruido: 30 }],
    ["código pequeño, claro sobre oscuro", { ladoQr: 200, claroSobreOscuro: true, ruido: 15 }],
    ["sombra: poco contraste y mucho ruido", { contraste: 40, ruido: 30, luz: [60, 60] as [number, number] }],
  ])("%s: antes no se leía y ahora sí", (_, condiciones) => {
    const img = placa(condiciones);
    expect(lecturaAnterior(img)).toBeNull();
    expect(lecturaCamara(img)).toBe(TEXTO);
  });

  it("sigue leyendo un QR impreso normal", () => {
    const img = placa({ ruido: 4, contraste: 120, luz: [200, 200] });
    expect(lecturaAnterior(img)).toBe(TEXTO);
    expect(lecturaCamara(img)).toBe(TEXTO);
  });

  it("una foto se analiza con todas las variantes", () => {
    expect(leerImagen(placa({ claroSobreOscuro: true, ladoQr: 220, luz: [60, 160], ruido: 20 }))).toBe(TEXTO);
  });

  it("no inventa lecturas en una imagen sin código", () => {
    expect(leerImagen(placa({ ladoQr: 0 }))).toBeNull();
  });
});
