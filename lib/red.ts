/**
 * IP de quien hace la petición, para los límites de intentos. En producción la app solo es
 * accesible a través de Caddy, que pone la IP real al final de X-Forwarded-For: se toma la
 * última entrada, porque las anteriores las puede escribir el propio cliente.
 */
export function ipCliente(cabeceras: Headers): string {
  const reenviada = cabeceras.get("x-forwarded-for");
  if (reenviada) {
    const ultima = reenviada.split(",").map((p) => p.trim()).filter(Boolean).pop();
    if (ultima) return ultima;
  }
  return cabeceras.get("x-real-ip") ?? "local";
}
