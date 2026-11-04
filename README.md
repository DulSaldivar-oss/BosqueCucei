# Bosque CUCEI

[![CI](https://github.com/DulSaldivar-oss/BosqueCucei/actions/workflows/ci.yml/badge.svg)](https://github.com/DulSaldivar-oss/BosqueCucei/actions/workflows/ci.yml)

Plataforma comunitaria para conocer, monitorear y cuidar el arbolado de CUCEI, convertida en un juego: cada árbol real tiene una placa con QR; al escanearlo y registrar cómo se ve, su gemelo virtual crece en el jardín de la persona. Las observaciones de la comunidad generan alertas para el equipo de Sustentabilidad.

Basado en la *Propuesta de desarrollo · Bosque CUCEI* (octubre 2026).

- **Parte pública** (teléfono primero, funciona en todos los anchos de Tailwind, de 320 px a escritorio): inicio, escáner QR, ficha del árbol, registro de observación, jardín virtual, herbario, mapa, misiones y perfil.
- **Panel de Sustentabilidad** (tablet y escritorio, desde iPad mini de 768 px): resumen con métricas del piloto, alertas, revisión de observaciones, inventario con importación CSV e impresión de QR, editor de especies y sprites, misiones, personas y reglas.

## La dinámica del juego

| Regla | Detalle |
| --- | --- |
| **Un riego por árbol a la semana** | Puedes observar un árbol todas las veces que quieras; cada reporte se guarda y cuenta para el monitoreo. Solo la **primera observación de la semana** (lunes a domingo, hora de Guadalajara) hace crecer el árbol y da experiencia. La base de datos lo garantiza con un índice único. |
| **Árbol virtual** | 7 etapas: Semilla → Brote (1 visita) → Plántula (2) → Joven (3) → Adulto (5) → Frondoso (8) → Majestuoso (12, florece). Si pasan 3 semanas sin visita se ve «sediento» (solo visual, nunca se pierde progreso). |
| **Experiencia** | Visita semanal +10 · árbol descubierto +25 · especie nueva +40 · con foto +5 · racha de semanas +5 por semana (tope 25) · observación confirmada por Sustentabilidad +15. Todo es editable en `/admin/ajustes`. |
| **Niveles** | Cada nivel pide 40 XP más que el anterior (60, 100, 140…). Títulos de Semilla a Leyenda del bosque. Se muestran como anillos de un tronco. |
| **Misiones** | Semanales o de temporada: visitar árboles distintos, descubrir especies, observar el mismo árbol varias semanas, recorrer una zona, observaciones con foto. |
| **Alertas** | Regla inicial de la propuesta: 3 personas distintas reportan el árbol en 7 días y al menos 2 ven una anomalía → alerta. «Rama peligrosa» o «árbol inclinado» generan alerta crítica con un solo reporte. Umbrales parametrizables. |
| **Semáforo** | Normal · observación pendiente · posible problema · revisión requerida · sin datos recientes. |

El juego premia la constancia y la variedad de árboles, no escanear muchas veces el mismo (sección 10 de la propuesta). Públicamente solo se muestra el alias y el nivel.

## Pila

Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · PostgreSQL 17 · `motion` para animaciones · Leaflet con teselas de OpenStreetMap (mapa, sin llave; otro proveedor se configura con `MAPA_TILES_URL`, ver `lib/mapa.ts`) · jsQR (escáner) · Docker + Caddy para la máquina en Oracle.

Tipografías Fraunces y Manrope empaquetadas localmente (no dependen de Google Fonts).

## Empezar en local

Requisitos: [Bun](https://bun.sh) 1.4 (instala dependencias y corre los scripts), Node 22 (Next.js compila y corre sobre Node) y PostgreSQL (o Docker para levantarlo).

```bash
curl -fsSL https://bun.sh/install | bash         # Linux y macOS
powershell -c "irm bun.sh/install.ps1 | iex"     # Windows
```

```bash
bun install
cp .env.example .env.local          # ajusta DATABASE_URL si hace falta
docker compose up -d db             # PostgreSQL en localhost:5432 (o usa uno propio, ver abajo)
bun run db:migrar                   # esquema, especies, misiones y los 1086 árboles del inventario oficial
bun run db:demo                     # opcional: personas y 10 semanas de observaciones de ejemplo
bun run dev                         # http://localhost:3000
```

**¿«port 5432 already in use»?** Ya tienes otro PostgreSQL en ese puerto. Tienes dos caminos:

- Publicar el de Docker en otro puerto: crea un archivo `.env` con `PUERTO_DB=5433`, corre `docker compose up -d db` y en `.env.local` usa `DATABASE_URL=postgres://bosque:bosque@localhost:5433/bosque`.
- O usar tu PostgreSQL local: crea el usuario y la base (`CREATE USER bosque WITH PASSWORD 'bosque'; CREATE DATABASE bosque OWNER bosque;`) y no levantes el contenedor.

Cuentas de demostración (contraseña `bosque123`):

- `demo@cucei.demo`: jugador con jardín avanzado.
- `sustentabilidad@cucei.demo`: acceso a `/admin`.

Para dar acceso de administración a una cuenta real: regístrala en `/registro` y luego `bun run admin:crear correo@dominio` (en el servidor: `./scripts/bosque.sh admin:crear correo@dominio`).

> La cámara del teléfono solo funciona en `https://` o en `localhost`. Para probar el escáner desde el celular en la red local usa un túnel HTTPS o despliega en la máquina de Oracle.

## Antitrampa

Las reglas del juego se revisan en el servidor; el teléfono solo muestra el resultado.

- **Visita junto al árbol** (`lib/juego/presencia.ts`): una observación se acepta solo si la persona está a 50 m del árbol por GPS (se descuentan hasta 15 m del error del GPS; con más de 100 m de error no se acepta) o si escaneó hace menos de 30 min la placa con un **QR verificable** (con parte aleatoria, generado en `/admin/arboles/qr`). El escaneo deja un token en una cookie httpOnly que vale solo para ese árbol y para la primera persona que lo use.
- **Sin teletransporte**: no se aceptan observaciones de árboles separados por más de 75 m a más de 8 m/s (≈ 29 km/h).
- **Una foto, una vez**: no se acepta una foto que ya se usó (huella SHA-256), así que no se puede reciclar para el bono ni para la misión «Fotógrafo».
- **Lo que ya había**: una visita válida por semana y árbol (índice único en la base), la experiencia la calcula el servidor, límites de intentos en entrar, registro, observaciones y escaneos, sesiones guardadas como huella, fotos revisadas por contenido y redirecciones solo a rutas del sitio.
- El panel muestra cómo se comprobó cada observación (GPS a N m o placa escaneada).

## Instalar como app

Bosque CUCEI es una app web instalable (PWA): se agrega a la pantalla de inicio y abre a pantalla completa, sin tienda de apps.

- **La primera vez** que alguien abre `/entrar` o `/registro` en un dispositivo, antes de iniciar sesión aparece una guía para instalarla. Se marca como vista en cuanto aparece (en `localStorage`, clave `bosque-cucei:guia-instalar`), así que no vuelve a salir sola; tampoco sale dentro de la app ya instalada. Para verla de nuevo al probar, borra los datos del sitio en el navegador.
- **Con un toque** en Chrome, Edge y Samsung Internet (Android y computadora): la guía usa el aviso de instalación del navegador (`beforeinstallprompt`), que `app/layout.tsx` guarda en cuanto llega.
- **Paso a paso** donde el navegador no lo permite: iPhone y iPad (Safari o Chrome, desde Compartir → Agregar a pantalla de inicio; Apple no permite instalar con un botón), Firefox en Android y Safari en Mac. Si la página está abierta dentro de Instagram, Facebook u otra app, pide abrirla en el navegador. En la computadora muestra un QR para abrirla en el teléfono.
- **Siempre a la mano:** enlace «Instala la app en tu teléfono» bajo los formularios de entrar y registro, y tarjeta en `/perfil`.
- Piezas: `app/manifest.ts` (íconos, atajos y capturas de `public/instalar/` para la hoja de instalación de Android), `public/sw.js` (service worker mínimo: no guarda páginas en caché, solo muestra `public/sin-conexion.html` sin internet), `lib/instalacion.ts` (detección de teléfono y navegador, con pruebas) y `components/instalar/`.
- La instalación necesita HTTPS (en producción lo pone Caddy) o `localhost`. El service worker solo se registra en el build de producción.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `bun run dev` / `build` / `start` | Desarrollo, compilación y servidor de producción. |
| `bun run test` | Pruebas (Vitest). Con `DATABASE_URL_PRUEBAS` también corre las de integración contra PostgreSQL. |
| `bun run lint` / `typecheck` | ESLint y TypeScript. |
| `bun run db:migrar` | Aplica `db/migraciones/*.sql` pendientes y las semillas que cambiaron (incluido el inventario de árboles). |
| `bun run inventario:importar` | Lee el Excel oficial (`data/inventario/arboles-cucei.xlsx`) y actualiza `data/arboles.json`, agrega a `data/especies.json` las especies nuevas y escribe `data/inventario/REPORTE.md`. Ver [docs/INVENTARIO.md](docs/INVENTARIO.md). |
| `bun run db:sql` | Regenera las semillas SQL desde `data/especies.json` y `data/arboles.json`. |
| `bun run db:demo` | Personas y observaciones de ejemplo sobre el inventario (`--reiniciar` para rehacerlas). No usar en producción. |
| `bun run especies:importar` | Enriquece el catálogo con GBIF, Wikipedia e iNaturalist (necesita internet). `--descubrir` lista las especies observadas en iNaturalist cerca de CUCEI. |
| `bun run sprites` | Exporta los sprites de cada especie a `public/sprites/` (`--png` también en PNG con Playwright). |
| `bun run admin:crear correo` | Da acceso al panel a una cuenta existente. |

## Datos, scripts SQL y sprites

- **Inventario de árboles** (`data/inventario/arboles-cucei.xlsx`): el Excel oficial con los 1086 árboles de CUCEI (número, especie, nombre científico, sector, coordenadas, estado fitosanitario, medidas, CO₂, familia, follaje, clima y floración). Es la semilla inicial y la vía para las actualizaciones: se reemplaza el Excel, se corre `bun run inventario:importar && bun run db:sql` y el siguiente despliegue sincroniza la base. También se puede subir desde `/admin/arboles/importar`. Detalles, reglas y avisos de calidad de datos en [docs/INVENTARIO.md](docs/INVENTARIO.md) y en `data/inventario/REPORTE.md`.
- **Catálogo de especies** (`data/especies.json`): 132 especies. 29 fueron curadas a mano con descripción, dato curioso, calendario de floración y beneficios; las otras 103 se crearon desde el inventario con nombre común y origen revisados y un sprite propuesto, y tienen `"revisar": true` hasta completar su descripción. **Hay que validarlo con Sustentabilidad.** `bun run especies:importar` lo enriquece desde bases públicas (a las especies por revisar también les pone el resumen de Wikipedia):
  - GBIF: identificador taxonómico, familia aceptada y nombres comunes en español.
  - Wikipedia en español: enlace y resumen.
  - iNaturalist: foto con licencia Creative Commons y crédito; con `--descubrir`, las especies observadas a 1.5 km de CUCEI para detectar las que faltan (`--agregar` las suma con un sprite propuesto según su familia).
- **Scripts SQL** (`db/`): `migraciones/001_esquema.sql` (modelo de datos de la sección 9 más experiencia, misiones, alertas y métricas), `002_inventario.sql` (columnas del inventario oficial) y `semillas/` (ajustes, especies, inventario de árboles y misiones). Las semillas de especies y árboles se **generan** con `bun run db:sql`.
- **Sprites**: `lib/sprites/generar.ts` dibuja cada especie a partir de su *genoma* (forma de copa, tres tonos de hoja, corteza, flor, densidad de floración, proporciones) en las 7 etapas, en SVG de capas estilo papel recortado. Cada árbol usa su código como semilla, así que dos jacarandas nunca son idénticas. Se ajustan en vivo desde `/admin/especies`. `bun run sprites` los exporta como archivos (`etapa-0.svg` … `etapa-6.svg`, `hoja.svg`, `silueta.svg`).
- **Placas y QR**: el código de cada árbol es `CUCEI-` más su número con 4 cifras (el 27 es `CUCEI-0027`), y el escáner acepta también el número solo. Si las placas ya tienen un QR con otro contenido (por ejemplo una URL), guárdalo en el `qr_id` del árbol desde el panel y el escáner lo reconocerá.

## Correspondencia con la propuesta

| Propuesta | Dónde está |
| --- | --- |
| A. Ficha digital | `/arbol/[codigo]` (pestañas Información, Salud, Guardianes) |
| B. Registro de observación | `/arbol/[codigo]/observar` (estado, 12 categorías, foto y comentario; se mide el tiempo) |
| C. Mi jardín virtual | `/jardin` |
| D. Árboles que cuido | Botón «Cuidar este árbol» y sección en `/jardin` |
| E. Guardianes | Pestaña en la ficha y «Guardianes de la semana» en inicio |
| F. Herbario | `/herbario` (especies por descubrir como silueta con pista) |
| G. Mapa | `/mapa`: por defecto solo los árboles a 50 m de tu ubicación (te sigue al caminar; el radio está en `RADIO_CERCA_M`, `lib/mapa.ts`), con «Todo el campus», semáforo y filtros |
| H. Misiones | `/misiones` y `/admin/misiones` |
| I. Panel de Sustentabilidad | `/admin` |
| 13. ¿Funciona el piloto? | Tarjeta de indicadores en `/admin` y comentarios desde el perfil |

## Estructura

```
app/(publico)/      páginas públicas (layout con barra inferior en teléfono)
app/admin/          panel de Sustentabilidad
app/api/            observaciones (con foto) y resolución de QR
app/a/[qr]/         destino de los QR impresos
components/         interfaz (publico/, admin/ y compartidos)
lib/juego/          reglas puras: semanas, niveles, crecimiento, alertas, catálogos
lib/servicios/      registrar observación, misiones y alertas (transacciones)
lib/sprites/        generador de sprites
db/                 migraciones y semillas SQL
data/               catálogo de especies e inventario oficial (Excel, JSON normalizado y reporte)
scripts/            migrador, generadores, importadores de inventario y especies, demo, respaldos y despliegue
docs/               despliegue en Oracle Cloud e inventario
```

## Despliegue

Guía completa en [docs/DESPLIEGUE-ORACLE.md](docs/DESPLIEGUE-ORACLE.md): máquina Always Free en Oracle Cloud con Docker Compose (PostgreSQL, la app y Caddy con HTTPS automático). Una vez creada la máquina y abiertos los puertos 80 y 443 en la VCN:

```bash
git clone https://github.com/DulSaldivar-oss/BosqueCucei.git && cd BosqueCucei
sudo ./scripts/preparar-servidor.sh      # Docker, firewall de la instancia y swap
cp .env.produccion.example .env && nano .env
./scripts/desplegar.sh                   # compila, migra, levanta y espera a /api/salud
./scripts/bosque.sh admin:crear tu-correo@dominio   # después de registrarte en /registro
```

En la máquina solo se instala Docker: Bun y Node vienen dentro de la imagen. Los comandos del proyecto se corren con `./scripts/bosque.sh <comando>` (dentro del contenedor), no con `bun run` directo.

El CI (`.github/workflows/ci.yml`) comprueba en cada PR el código, las imágenes Docker para x86 y ARM, y un despliegue completo con Caddy. El workflow manual «Desplegar en Oracle» actualiza la máquina por SSH.

## Pendiente para después del MVP

- Validar el catálogo de especies y cargar el inventario real con las coordenadas de cada placa.
- Revisar el formato de los QR que ya están colocados (sección 12, etapa de análisis).
- Recordatorios por notificación («tu árbol tiene sed»).
- Diagnóstico con IA (fuera del MVP según la propuesta).
