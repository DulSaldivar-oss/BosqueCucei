/** Utilidades geográficas compartidas por el importador y el mapa (sin dependencias de Node). */

export function distanciaMetros(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

const mediana = (valores: number[]) => {
  const v = [...valores].sort((x, y) => x - y);
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};

/** Árboles a más de `limite` metros de la mediana del conjunto (coordenadas probablemente erróneas). */
export function fueraDeLugar<T extends { latitud: number; longitud: number }>(puntos: T[], limite = 2000) {
  if (puntos.length < 5) return [];
  const centro: [number, number] = [mediana(puntos.map((p) => p.latitud)), mediana(puntos.map((p) => p.longitud))];
  return puntos
    .map((p) => ({ ...p, distancia: distanciaMetros(centro, [p.latitud, p.longitud]) }))
    .filter((p) => p.distancia > limite);
}
