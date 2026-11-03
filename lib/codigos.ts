/**
 * Candidatos de código de árbol a partir de lo que trae un QR o lo que escribe la persona.
 * Las placas de metal del campus muestran el número de espécimen y su QR lleva a
 * sustentabilidad.cucei.udg.mx, así que se aceptan, entre otros:
 *   «48», «#48», «CUCEI-0048», «cucei 48», «Espécimen 48», y URLs que terminan en el número
 *   (…/arbol/48, …?id=48, …#48) o que contienen el código.
 * El número se convierte al código del inventario: 48 → CUCEI-0048.
 */
const conCeros = (numero: string) => `CUCEI-${numero.padStart(4, "0")}`;

export function candidatosQr(texto: string): string[] {
  const limpio = texto.trim();
  const candidatos = new Set([limpio]);
  try {
    const url = new URL(limpio);
    const segmentos = url.pathname.split("/").filter(Boolean);
    if (segmentos.length) candidatos.add(decodeURIComponent(segmentos[segmentos.length - 1]));
    for (const valor of url.searchParams.values()) candidatos.add(valor.trim());
    if (url.hash.length > 1) candidatos.add(decodeURIComponent(url.hash.slice(1)));
  } catch {
    // No es URL.
  }
  const codigo = /CUCEI[-_ ]?(\d{1,5})/i.exec(limpio);
  if (codigo) {
    candidatos.add(codigo[0].replace(/[_ ]/, "-").toUpperCase());
    candidatos.add(conCeros(codigo[1]));
  }
  const especimen = /esp[eé]cimen\D{0,3}(\d{1,5})/i.exec(limpio);
  if (especimen) candidatos.add(conCeros(especimen[1]));
  // Cualquier candidato que sea solo un número («48», «#48», «0048») es el número del árbol.
  for (const c of [...candidatos]) {
    const numero = /^#?\s*0*(\d{1,5})$/.exec(c)?.[1];
    if (numero) candidatos.add(conCeros(numero));
  }
  return [...candidatos].filter(Boolean);
}
