/*
 * Service worker de Bosque CUCEI. Es mínimo a propósito: no guarda páginas ni datos en caché
 * (todo se pide siempre a la red), solo muestra una página amable cuando no hay conexión.
 * Con él, Chrome, Edge y Samsung Internet ofrecen instalar la app con un toque.
 */
const CACHE = "bosque-cucei-v1";
const SIN_CONEXION = "/sin-conexion.html";
const RECURSOS = [SIN_CONEXION, "/icono-192.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(RECURSOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin && RECURSOS.includes(url.pathname)) {
    evento.respondWith(caches.match(request).then((r) => r || fetch(request)));
    return;
  }
  // Solo las navegaciones: si falla la red, la página sin conexión. Lo demás no se toca.
  if (request.mode !== "navigate") return;
  evento.respondWith(fetch(request).catch(() => caches.match(SIN_CONEXION)));
});
