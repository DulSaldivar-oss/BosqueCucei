import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Servidor autocontenido (.next/standalone) para la imagen Docker de la máquina en Oracle.
  output: "standalone",
  poweredByHeader: false,
  // pg trae dependencias opcionales nativas que no deben empaquetarse.
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: {
      // Las fotos se comprimen en el teléfono; esto deja margen para formularios del panel.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
