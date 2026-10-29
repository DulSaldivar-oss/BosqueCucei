/** Carga .env.local / .env para los scripts de línea de comandos (Next.js lo hace solo en la app). */
for (const archivo of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(archivo);
  } catch {
    // El archivo es opcional.
  }
}

export function urlBaseDatos(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL. Copia .env.example a .env.local y ajústalo.");
    process.exit(1);
  }
  return url;
}
