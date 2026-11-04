/**
 * Reglas antitrampa (puras, sin base de datos): la observación debe hacerse junto al árbol.
 * El GPS del teléfono lo envía el navegador, así que se puede falsear; por eso además se limita
 * la velocidad entre árboles y la placa con QR verificable cuenta como prueba alternativa.
 */
import { distanciaMetros } from "@/lib/geo";

/** Distancia máxima al árbol para que la visita cuente. */
export const RADIO_VISITA_M = 50;
/** Del error que reporta el GPS se descuenta como mucho esto (bajo los árboles es de 10 a 30 m). */
export const TOLERANCIA_GPS_M = 15;
/** Con un GPS más impreciso que esto no se puede saber si estás junto al árbol. */
export const PRECISION_MAXIMA_M = 100;
/** Cuánto vale el escaneo de una placa como prueba de que estuviste ahí. */
export const VIGENCIA_PLACA_MIN = 30;
/** Velocidad máxima creíble entre dos árboles (a pie o en bici): ~29 km/h. */
export const VELOCIDAD_MAXIMA_MS = 8;
/** Debajo de esta distancia entre árboles no se revisa la velocidad (error del GPS). */
const SALTO_MINIMO_M = 75;

export interface PosicionGps {
  latitud: number;
  longitud: number;
  /** Radio de error que reporta el navegador, en metros. */
  precision: number;
}

export type ResultadoGps =
  | { valida: true; distancia: number }
  | { valida: false; distancia: number | null; motivo: "sin-datos" | "impreciso" | "lejos" };

export function evaluarGps(arbol: { latitud: number; longitud: number }, posicion: Partial<PosicionGps> | null): ResultadoGps {
  const { latitud, longitud, precision } = posicion ?? {};
  if (
    latitud == null || longitud == null || !Number.isFinite(latitud) || !Number.isFinite(longitud) ||
    Math.abs(latitud) > 90 || Math.abs(longitud) > 180
  ) {
    return { valida: false, distancia: null, motivo: "sin-datos" };
  }
  const distancia = distanciaMetros([arbol.latitud, arbol.longitud], [latitud, longitud]);
  const error = Number.isFinite(precision) && precision! > 0 ? precision! : 0;
  if (error > PRECISION_MAXIMA_M) return { valida: false, distancia, motivo: "impreciso" };
  if (distancia - Math.min(error, TOLERANCIA_GPS_M) > RADIO_VISITA_M) return { valida: false, distancia, motivo: "lejos" };
  return { valida: true, distancia };
}

/** ¿Es imposible haber llegado de un árbol al otro en ese tiempo? */
export function viajeImposible(
  desde: { latitud: number; longitud: number; fecha: Date },
  hasta: { latitud: number; longitud: number; fecha: Date },
): boolean {
  const metros = distanciaMetros([desde.latitud, desde.longitud], [hasta.latitud, hasta.longitud]);
  if (metros < SALTO_MINIMO_M) return false;
  const segundos = Math.max(1, (hasta.fecha.getTime() - desde.fecha.getTime()) / 1000);
  return metros / segundos > VELOCIDAD_MAXIMA_MS;
}
