import { RADIO_VISITA_M } from "@/lib/juego/presencia";

/**
 * Fondo del mapa (teselas). Por defecto OpenStreetMap, que no pide llave. Se puede cambiar sin tocar
 * el código con variables de entorno del servidor (se leen al mostrar la página, no al compilar):
 *
 *   MAPA_TILES_URL          plantilla de Leaflet, p. ej. https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key={llave}
 *   MAPA_TILES_LLAVE        reemplaza {llave} en la URL (las llaves de teselas son públicas: restríngelas a tu dominio)
 *   MAPA_TILES_ATRIBUCION   texto de créditos que exige el proveedor (HTML)
 *   MAPA_TILES_ZOOM_MAX     último nivel de zoom que entrega el proveedor (más cerca se amplía la imagen)
 */

/** Radio del mapa «cerca de mí»: el mismo de la visita válida (lib/juego/presencia.ts). */
export const RADIO_CERCA_M = RADIO_VISITA_M;

export interface FondoMapa {
  url: string;
  atribucion: string;
  zoomMaxNativo: number;
  subdominios: string;
}

export const FONDO_OSM: FondoMapa = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  atribucion: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  zoomMaxNativo: 19,
  subdominios: "abc",
};

export function fondoMapa(entorno: Record<string, string | undefined> = process.env): FondoMapa {
  const plantilla = entorno.MAPA_TILES_URL?.trim();
  if (!plantilla) return FONDO_OSM;
  const llave = entorno.MAPA_TILES_LLAVE?.trim() ?? "";
  // Sin la llave que pide la plantilla, ese proveedor respondería con error: mejor OpenStreetMap.
  if (plantilla.includes("{llave}") && !llave) return FONDO_OSM;
  const zoom = Number(entorno.MAPA_TILES_ZOOM_MAX);
  return {
    url: plantilla.replaceAll("{llave}", encodeURIComponent(llave)),
    atribucion: entorno.MAPA_TILES_ATRIBUCION?.trim() || FONDO_OSM.atribucion,
    zoomMaxNativo: Number.isInteger(zoom) && zoom >= 10 && zoom <= 22 ? zoom : 19,
    subdominios: entorno.MAPA_TILES_SUBDOMINIOS?.trim() || "abc",
  };
}
