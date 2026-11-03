/**
 * Lectura de QR difíciles: las placas del campus están grabadas con láser en acero inoxidable.
 * El grabado puede verse más claro que el metal (al revés de un QR impreso), la luz cae
 * dispareja, el sensor mete ruido en la sombra y el código suele ocupar poco del cuadro.
 * Por eso cada intento:
 *   - recorta el centro (donde está el recuadro guía) y lo lee a buena resolución,
 *   - suaviza el ruido (jsQR falla con poco ruido si no se filtra),
 *   - prueba el código normal y en negativo (claro sobre oscuro),
 *   - y, en algunas variantes, iguala la iluminación (resta el fondo local y estira el contraste).
 * En la cámara se prueba una variante por cuadro, en rotación; con una foto se prueban todas.
 * Funciones puras sobre píxeles RGBA: se usan en el navegador y en las pruebas.
 */
import jsQR from "jsqr";

export interface Imagen {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface Variante {
  /** Fracción del lado menor que se recorta al centro (1 = cuadro completo). */
  recorte: number;
  /** Lado mayor, en píxeles, al que se escala el recorte antes de leerlo. */
  lado: number;
  /** Radio del suavizado contra el ruido (0 = sin suavizar). */
  suavizado: number;
  /** Igualar la iluminación antes de leer. */
  igualar: boolean;
}

/** Rotación de la cámara en vivo: barata por cuadro, cubre de lejos a cerca. */
export const VARIANTES_CAMARA: Variante[] = [
  { recorte: 0.75, lado: 640, suavizado: 1, igualar: false },
  { recorte: 0.5, lado: 520, suavizado: 1, igualar: false },
  { recorte: 0.75, lado: 640, suavizado: 2, igualar: false },
  { recorte: 0.5, lado: 520, suavizado: 1, igualar: true },
  { recorte: 0.75, lado: 640, suavizado: 1, igualar: true },
  { recorte: 0.5, lado: 520, suavizado: 2, igualar: false },
  { recorte: 1, lado: 800, suavizado: 0, igualar: false },
];

/** Una foto se analiza una sola vez: se pueden probar más tamaños. */
export const VARIANTES_FOTO: Variante[] = [
  ...VARIANTES_CAMARA,
  { recorte: 1, lado: 1200, suavizado: 1, igualar: false },
  { recorte: 1, lado: 1200, suavizado: 2, igualar: true },
  { recorte: 0.6, lado: 900, suavizado: 2, igualar: false },
  { recorte: 0.6, lado: 900, suavizado: 1, igualar: true },
  { recorte: 0.35, lado: 600, suavizado: 1, igualar: false },
  { recorte: 0.35, lado: 600, suavizado: 2, igualar: true },
];

/** Rectángulo del recorte centrado, en coordenadas de la imagen original. */
export function rectanguloRecorte(ancho: number, alto: number, recorte: number) {
  if (recorte >= 1) return { x: 0, y: 0, ancho, alto };
  const lado = Math.round(Math.min(ancho, alto) * recorte);
  return { x: Math.round((ancho - lado) / 2), y: Math.round((alto - lado) / 2), ancho: lado, alto: lado };
}

/** Tamaño final de un rectángulo escalado para que su lado mayor sea `lado` (sin agrandar). */
export function tamanoEscalado(ancho: number, alto: number, lado: number) {
  const escala = Math.min(1, lado / Math.max(ancho, alto));
  return { ancho: Math.max(1, Math.round(ancho * escala)), alto: Math.max(1, Math.round(alto * escala)) };
}

/** Recorta y escala en JavaScript (promedio por área). En el navegador lo hace el canvas. */
export function recortarYEscalar(img: Imagen, variante: Variante): Imagen {
  const r = rectanguloRecorte(img.width, img.height, variante.recorte);
  const t = tamanoEscalado(r.ancho, r.alto, variante.lado);
  const salida = new Uint8ClampedArray(t.ancho * t.alto * 4);
  const fx = r.ancho / t.ancho;
  const fy = r.alto / t.alto;
  for (let y = 0; y < t.alto; y++) {
    const y0 = r.y + Math.floor(y * fy);
    const y1 = Math.max(y0 + 1, r.y + Math.floor((y + 1) * fy));
    for (let x = 0; x < t.ancho; x++) {
      const x0 = r.x + Math.floor(x * fx);
      const x1 = Math.max(x0 + 1, r.x + Math.floor((x + 1) * fx));
      let rr = 0;
      let gg = 0;
      let bb = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * img.width + xx) * 4;
          rr += img.data[i];
          gg += img.data[i + 1];
          bb += img.data[i + 2];
          n++;
        }
      }
      const o = (y * t.ancho + x) * 4;
      salida[o] = rr / n;
      salida[o + 1] = gg / n;
      salida[o + 2] = bb / n;
      salida[o + 3] = 255;
    }
  }
  return { data: salida, width: t.ancho, height: t.alto };
}

/** Suaviza el ruido del sensor (promedio en una ventana de (2·radio+1)²): jsQR es muy sensible a él. */
export function suavizar(img: Imagen, radio = 1): Imagen {
  if (radio < 1) return img;
  const { width: w, height: h, data } = img;
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let fila = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      fila += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + fila;
    }
  }
  const salida = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const ya = Math.max(0, y - radio);
    const yb = Math.min(h, y + radio + 1);
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - radio);
      const xb = Math.min(w, x + radio + 1);
      const v =
        (integral[yb * (w + 1) + xb] - integral[ya * (w + 1) + xb] - integral[yb * (w + 1) + xa] + integral[ya * (w + 1) + xa]) /
        ((yb - ya) * (xb - xa));
      const o = (y * w + x) * 4;
      salida[o] = salida[o + 1] = salida[o + 2] = v;
      salida[o + 3] = 255;
    }
  }
  return { data: salida, width: w, height: h };
}

/** Iguala la iluminación: a cada píxel le resta el promedio de su vecindario y estira el contraste. */
export function igualarIluminacion(img: Imagen, radio = Math.max(8, Math.round(Math.min(img.width, img.height) / 14))): Imagen {
  const { width: w, height: h, data } = img;
  const gris = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) gris[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  // Imagen integral para el promedio de cada ventana en tiempo constante.
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let fila = 0;
    for (let x = 0; x < w; x++) {
      fila += gris[y * w + x];
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + fila;
    }
  }
  const diferencia = new Float32Array(w * h);
  let suma = 0;
  for (let y = 0; y < h; y++) {
    const ya = Math.max(0, y - radio);
    const yb = Math.min(h, y + radio + 1);
    for (let x = 0; x < w; x++) {
      const xa = Math.max(0, x - radio);
      const xb = Math.min(w, x + radio + 1);
      const area = (yb - ya) * (xb - xa);
      const promedio =
        (integral[yb * (w + 1) + xb] - integral[ya * (w + 1) + xb] - integral[yb * (w + 1) + xa] + integral[ya * (w + 1) + xa]) / area;
      const d = gris[y * w + x] - promedio;
      diferencia[y * w + x] = d;
      suma += Math.abs(d);
    }
  }
  const ganancia = 70 / (suma / (w * h) + 1);
  const salida = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = 128 + diferencia[i] * ganancia;
    salida[i * 4] = salida[i * 4 + 1] = salida[i * 4 + 2] = v;
    salida[i * 4 + 3] = 255;
  }
  return { data: salida, width: w, height: h };
}

/** Negativo de la imagen (el grabado claro sobre metal oscuro pasa a ser un QR normal). */
export function invertir(img: Imagen): Imagen {
  const data = new Uint8ClampedArray(img.data.length);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - img.data[i];
    data[i + 1] = 255 - img.data[i + 1];
    data[i + 2] = 255 - img.data[i + 2];
    data[i + 3] = 255;
  }
  return { data, width: img.width, height: img.height };
}

/**
 * Lee un QR ya recortado y escalado, normal y en negativo; null si no hay. El negativo se arma
 * aquí: la opción «attemptBoth» de jsQR no lee algunos códigos invertidos que así sí lee.
 */
export function leerQr(img: Imagen, variante: Pick<Variante, "suavizado" | "igualar">): string | null {
  const suave = suavizar(img, variante.suavizado);
  const fuente = variante.igualar ? igualarIluminacion(suave) : suave;
  for (const candidata of [fuente, invertir(fuente)]) {
    const qr = jsQR(candidata.data, candidata.width, candidata.height, { inversionAttempts: "dontInvert" });
    if (qr?.data) return qr.data;
  }
  return null;
}

/** Prueba todas las variantes sobre una imagen completa (una foto). */
export function leerImagen(img: Imagen, variantes: Variante[] = VARIANTES_FOTO): string | null {
  for (const v of variantes) {
    const texto = leerQr(recortarYEscalar(img, v), v);
    if (texto) return texto;
  }
  return null;
}
