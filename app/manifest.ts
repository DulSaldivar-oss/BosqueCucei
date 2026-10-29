import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bosque CUCEI",
    short_name: "Bosque CUCEI",
    description: "Conoce, cuida y haz crecer el arbolado de CUCEI.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#2d5a3d",
    lang: "es-MX",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
