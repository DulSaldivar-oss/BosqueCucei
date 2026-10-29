/** Límite sencillo de intentos en memoria (basta para un solo servidor). */
const intentos = new Map<string, { cuenta: number; reinicia: number }>();

export function permitir(clave: string, maximo: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const actual = intentos.get(clave);
  if (!actual || actual.reinicia < ahora) {
    intentos.set(clave, { cuenta: 1, reinicia: ahora + ventanaMs });
    if (intentos.size > 5000) {
      for (const [k, v] of intentos) if (v.reinicia < ahora) intentos.delete(k);
    }
    return true;
  }
  actual.cuenta++;
  return actual.cuenta <= maximo;
}
