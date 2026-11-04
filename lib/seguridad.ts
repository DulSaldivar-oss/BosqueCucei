/**
 * Destino seguro tras iniciar sesión o registrarse: solo rutas de este mismo sitio. Evita las
 * redirecciones abiertas (`?siguiente=//sitio-malo.com` o `/\sitio-malo.com`, que el navegador
 * trata como otro dominio), útiles para engañar con enlaces que parecen del bosque.
 */
export function destinoSeguro(valor: unknown, porDefecto = "/"): string {
  if (typeof valor !== "string" || !valor.startsWith("/") || /[\\\u0000-\u001f]/.test(valor)) return porDefecto;
  try {
    const base = "https://bosque.invalid";
    const url = new URL(valor, base);
    if (url.origin !== base) return porDefecto;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return porDefecto;
  }
}
