import type { MetadataRoute } from "next";

/**
 * Manifiesto de la app instalable. Con él (y public/sw.js), Chrome, Edge y Samsung Internet
 * ofrecen «Instalar» con un toque; iPhone la agrega desde Compartir → Agregar a pantalla de inicio.
 * Las capturas de public/instalar/ son las que muestra Android en la hoja de instalación.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Bosque CUCEI",
    short_name: "Bosque CUCEI",
    description: "Conoce, cuida y haz crecer el arbolado de CUCEI. Escanea un árbol, regístralo y cultiva tu jardín virtual.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f1e7",
    theme_color: "#2d5a3d",
    lang: "es-MX",
    dir: "ltr",
    categories: ["education", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Escanear un árbol", short_name: "Escanear", url: "/escanear", icons: [{ src: "/icono-192.png", sizes: "192x192" }] },
      { name: "Mapa del arbolado", short_name: "Mapa", url: "/mapa", icons: [{ src: "/icono-192.png", sizes: "192x192" }] },
      { name: "Mi jardín", short_name: "Jardín", url: "/jardin", icons: [{ src: "/icono-192.png", sizes: "192x192" }] },
    ],
    screenshots: [
      { src: "/instalar/inicio.jpg", sizes: "780x1688", type: "image/jpeg", form_factor: "narrow", label: "Inicio: tu bosque y las misiones de la semana" },
      { src: "/instalar/ficha.jpg", sizes: "780x1688", type: "image/jpeg", form_factor: "narrow", label: "Ficha de un árbol con su especie y su salud" },
      { src: "/instalar/herbario.jpg", sizes: "780x1688", type: "image/jpeg", form_factor: "narrow", label: "Herbario: las especies que vas descubriendo" },
      { src: "/instalar/escritorio.jpg", sizes: "1440x900", type: "image/jpeg", form_factor: "wide", label: "Bosque CUCEI en la computadora" },
    ],
  };
}
