# Bosque CUCEI · imagen para la máquina en Oracle Cloud (funciona en ARM Ampere y en x86).

FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencias AS compilacion
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Herramientas: migraciones, datos de demostración y alta de administradores.
FROM dependencias AS herramientas
COPY . .
CMD ["npm", "run", "db:migrar"]

# Servidor: solo la salida autocontenida de Next.js.
FROM node:22-alpine AS app
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 CARPETA_FOTOS=/datos/fotos
RUN mkdir -p /datos/fotos && chown -R node:node /datos
COPY --from=compilacion --chown=node:node /app/.next/standalone ./
COPY --from=compilacion --chown=node:node /app/.next/static ./.next/static
COPY --from=compilacion --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/entrar > /dev/null || exit 1
CMD ["node", "server.js"]
