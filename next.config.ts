import type { NextConfig } from "next";

// La raíz es la carpeta del proyecto (desde donde corre `next build`). Fijarla evita que un
// package-lock.json en una carpeta superior cambie la estructura de .next/standalone.
const raiz = process.cwd();

const nextConfig: NextConfig = {
  // Servidor autocontenido (.next/standalone) para la imagen Docker de la máquina en Oracle.
  output: "standalone",
  outputFileTracingRoot: raiz,
  turbopack: { root: raiz },
  poweredByHeader: false,
  // pg trae dependencias opcionales nativas que no deben empaquetarse.
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      {
        // El service worker siempre se revisa en la red para que las versiones nuevas lleguen de inmediato.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Las fotos se comprimen en el teléfono; esto deja margen para formularios del panel.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
