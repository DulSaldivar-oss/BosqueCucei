# Bosque CUCEI

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

Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · PostgreSQL 17 · `motion` para animaciones · Leaflet (mapa) · jsQR (escáner) · Docker + Caddy para la máquina en Oracle.

Tipografías Fraunces y Manrope empaquetadas localmente (no dependen de Google Fonts).

## Empezar en local

Requisitos: Node 22 y PostgreSQL (o Docker para levantarlo).

```bash
npm install
cp .env.example .env.local          # ajusta DATABASE_URL si hace falta
docker compose up -d db             # PostgreSQL en localhost:5432 (o usa uno propio)
npm run db:migrar -- --demo         # esquema, especies, misiones y 71 árboles de demostración
npm run db:demo                     # personas y 10 semanas de observaciones de ejemplo
npm run dev                         # http://localhost:3000
```

Cuentas de demostración (contraseña `bosque123`):

- `demo@cucei.demo`: jugador con jardín avanzado.
- `sustentabilidad@cucei.demo`: acceso a `/admin`.

Para dar acceso de administración a una cuenta real: regístrala en `/registro` y luego `npm run admin:crear -- correo@dominio`.

> La cámara del teléfono solo funciona en `https://` o en `localhost`. Para probar el escáner desde el celular en la red local usa un túnel HTTPS o despliega en la máquina de Oracle.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, compilación y servidor de producción. |
| `npm test` | Pruebas (Vitest). Con `DATABASE_URL_PRUEBAS` también corre las de integración contra PostgreSQL. |
| `npm run lint` | ESLint. |
| `npm run db:migrar` | Aplica `db/migraciones/*.sql` pendientes y las semillas que cambiaron. `-- --demo` incluye el inventario de demostración. |
| `npm run db:sql` | Regenera los scripts SQL de semillas desde `data/especies.json` y `data/arboles-demo.json`. |
| `npm run db:demo` | Personas y observaciones de ejemplo (`-- --reiniciar` para rehacerlas). |
| `npm run especies:importar` | Enriquece el catálogo con GBIF, Wikipedia e iNaturalist (necesita internet). `-- --descubrir` lista las especies observadas en iNaturalist cerca de CUCEI. |
| `npm run sprites` | Exporta los sprites de cada especie a `public/sprites/` (`-- --png` también en PNG con Playwright). |
| `npm run admin:crear -- correo` | Da acceso al panel a una cuenta existente. |

## Datos, scripts SQL y sprites

- **Catálogo de especies** (`data/especies.json`): 29 especies frecuentes en el arbolado urbano de Guadalajara (jacaranda, primavera, rosa morada, tabachín, fresno, ficus, parota, ahuehuete, pochote…), con nombre científico, familia, origen, descripción, dato curioso, floración y beneficios. Fue curado a mano; **hay que validarlo con Sustentabilidad** y contra el inventario real. `npm run especies:importar` lo enriquece desde bases públicas:
  - GBIF: identificador taxonómico, familia aceptada y nombres comunes en español.
  - Wikipedia en español: enlace y resumen.
  - iNaturalist: foto con licencia Creative Commons y crédito; con `--descubrir`, las especies observadas a 1.5 km de CUCEI para detectar las que faltan (`--agregar` las suma con un sprite propuesto según su familia).
- **Scripts SQL** (`db/`): `migraciones/001_esquema.sql` (modelo de datos de la sección 9 más experiencia, misiones, alertas y métricas) y `semillas/` (ajustes, especies, árboles de demostración y misiones). Las semillas de especies y árboles se **generan** con `npm run db:sql`.
- **Sprites**: `lib/sprites/generar.ts` dibuja cada especie a partir de su *genoma* (forma de copa, tres tonos de hoja, corteza, flor, densidad de floración, proporciones) en las 7 etapas, en SVG de capas estilo papel recortado. Cada árbol usa su código como semilla, así que dos jacarandas nunca son idénticas. Se ajustan en vivo desde `/admin/especies`. `npm run sprites` los exporta como archivos (`etapa-0.svg` … `etapa-6.svg`, `hoja.svg`, `silueta.svg`).
- **Inventario real**: los 71 árboles de demostración tienen posiciones aproximadas. Carga el inventario real desde Excel/CSV en `/admin/arboles/importar` (detecta «;» y coma decimal). Si las placas ya tienen un QR con otro contenido (por ejemplo una URL), ponlo en la columna `qr_id` y el escáner lo reconocerá.

## Correspondencia con la propuesta

| Propuesta | Dónde está |
| --- | --- |
| A. Ficha digital | `/arbol/[codigo]` (pestañas Información, Salud, Guardianes) |
| B. Registro de observación | `/arbol/[codigo]/observar` (estado, 12 categorías, foto y comentario; se mide el tiempo) |
| C. Mi jardín virtual | `/jardin` |
| D. Árboles que cuido | Botón «Cuidar este árbol» y sección en `/jardin` |
| E. Guardianes | Pestaña en la ficha y «Guardianes de la semana» en inicio |
| F. Herbario | `/herbario` (especies por descubrir como silueta con pista) |
| G. Mapa | `/mapa` (semáforo, filtros, «cerca de mí») |
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
data/               catálogo de especies e inventario de demostración
scripts/            migrador, generadores, importador de especies, demo y respaldos
docs/               despliegue en Oracle Cloud
```

## Despliegue

Ver [docs/DESPLIEGUE-ORACLE.md](docs/DESPLIEGUE-ORACLE.md): máquina Always Free en Oracle Cloud con Docker Compose (PostgreSQL, la app y Caddy con HTTPS automático).

## Pendiente para después del MVP

- Validar el catálogo de especies y cargar el inventario real con las coordenadas de cada placa.
- Revisar el formato de los QR que ya están colocados (sección 12, etapa de análisis).
- Recordatorios por notificación («tu árbol tiene sed»).
- Diagnóstico con IA (fuera del MVP según la propuesta).
