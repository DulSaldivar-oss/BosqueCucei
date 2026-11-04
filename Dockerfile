# Bosque CUCEI · imagen para el servidor (funciona en ARM Ampere y en x86).
# Bun instala las dependencias y corre los scripts (migraciones, demo, administradores);
# Next.js compila y sirve con Node, que es su entorno oficial.

FROM node:22-alpine AS base
COPY --from=oven/bun:1.4.4-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

FROM base AS dependencias
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencias AS compilacion
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Herramientas: migraciones, datos de demostración y alta de administradores.
FROM dependencias AS herramientas
COPY . .
CMD ["bun", "run", "db:migrar"]

# Servidor: solo la salida autocontenida de Next.js.
FROM node:22-alpine AS app
LABEL org.opencontainers.image.source="https://github.com/DulSaldivar-oss/BosqueCucei"
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 CARPETA_FOTOS=/datos/fotos
RUN mkdir -p /datos/fotos && chown -R node:node /datos
COPY --from=compilacion --chown=node:node /app/.next/standalone ./
COPY --from=compilacion --chown=node:node /app/.next/static ./.next/static
COPY --from=compilacion --chown=node:node /app/public ./public
USER node
EXPOSE 3000
# /api/salud responde 200 solo si la app está arriba y alcanza la base de datos.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/salud > /dev/null || exit 1
CMD ["node", "server.js"]
