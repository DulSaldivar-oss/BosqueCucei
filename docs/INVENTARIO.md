# Inventario de árboles

El Excel oficial del inventario (`data/inventario/arboles-cucei.xlsx`) es la fuente de los árboles de la app: es la **semilla inicial** de la base y también la vía para **actualizarla** después.

```
data/inventario/arboles-cucei.xlsx   Excel oficial (se reemplaza por la versión nueva)
        │  npm run inventario:importar
        ▼
data/arboles.json                    árboles normalizados (no se edita a mano)
data/especies.json                   + especies nuevas con "revisar": true
data/inventario/REPORTE.md           avisos y filas a revisar en campo
        │  npm run db:sql
        ▼
db/semillas/03_arboles.sql           semilla que aplica «migrar» en cada despliegue en que cambie
```

## Actualizar el inventario

### Desde el repositorio (recomendado: queda versionado)

```bash
cp ~/Descargas/arboles-todos-los-campus-AAAA-MM-DD.xlsx data/inventario/arboles-cucei.xlsx
npm run inventario:importar     # normaliza, agrega especies nuevas y escribe el reporte
# revisa data/inventario/REPORTE.md y cura las especies nuevas en data/especies.json
npm run db:sql                  # regenera las semillas SQL
npm run sprites                 # opcional: exporta los SVG de las especies nuevas
git add data db public/sprites && git commit -m "Actualizar inventario de árboles"
```

Al desplegar (`./scripts/desplegar.sh` o la acción **Desplegar en Oracle**), el servicio `migrar` ve que la semilla cambió y la vuelve a aplicar. En local: `npm run db:migrar`.

### Desde el panel (sin desplegar)

En `/admin/arboles/importar` se sube el mismo Excel (o el Excel guardado como CSV). Primero **Revisar** muestra cuántos árboles son nuevos, cuáles cambian, las especies que se van a crear y los avisos; después **Importar** aplica los cambios con las mismas reglas que la semilla. Marca *Es el inventario completo* para dar de baja los árboles que ya no vienen.

Lo que se importa desde el panel vive solo en la base. Si después cambia la semilla del repositorio, esa versión se vuelve a aplicar, así que conviene guardar también el Excel en el repositorio.

## Reglas de sincronización

Las aplican igual la semilla y el panel (`lib/inventario-sql.ts`):

- **Código:** campus + número con 4 cifras. El árbol 27 es `CUCEI-0027`, y ese es también el contenido de su QR. El escáner acepta el número solo («27»).
- **Altas y cambios:** por código se actualizan especie, coordenadas, sector, campus, fecha de registro, estado (activo o no), estado fitosanitario y medidas.
- **Una celda vacía no borra:** si el Excel no trae altura, copa, vuelta del tronco, CO₂ o estado fitosanitario, se conserva lo que ya tenga la base (por ejemplo, lo capturado en el panel).
- **No se tocan:** apodo, foto, nota pública ni el contenido del QR (`qr_id`). Esos se administran en el panel.
- **Bajas:** un árbol del inventario que ya no viene en el Excel queda **inactivo**. No se borra, ni se pierden sus observaciones, ni el progreso de las personas. Los árboles dados de alta en el panel (`fuente = 'panel'`) nunca se dan de baja por esto.
- **Todo o nada:** si falta una especie o hay un error, no se aplica ningún cambio.

## Columnas que se leen

Los encabezados se reconocen sin importar acentos, mayúsculas, signos ni el orden de las columnas.

| Columna del Excel | Uso en la app |
| --- | --- |
| **No. de árbol** (obligatoria) | Número de la placa y código del árbol. |
| **Nombre científico** (obligatoria) | Define la especie (ver abajo). |
| **Latitud**, **Longitud** (obligatorias) | Posición en el mapa. Se acepta coma decimal. |
| Especie | Nombre común: solo sirve para proponer el nombre de una especie nueva. |
| Sector | Zona del árbol. Vacío queda como «Sin sector». |
| Estado | «Activo» o vacío lo deja visible; cualquier otro valor lo desactiva. |
| Fecha de registro | Fecha de alta. |
| Estado fitosanitario, Altura (m), Ancho de la copa (m), Vuelta del tronco (cm), CO₂ almacenado (kg) | Datos de la ficha. El diámetro se calcula con la vuelta del tronco (÷ π). |
| Familia, Follaje, Clima, Floración y fruto | Textos de la especie (el valor más repetido entre sus árboles). |
| Campus | Prefijo del código (CUCEI si falta). |
| Placa, Enlace a Google Maps | No se usan: el código sale del número y la ruta se arma con las coordenadas. |

## Especies

**El nombre científico manda.** Se limpia antes de agrupar: se quitan autores («L.», «(Bertol.) DC.»), cultivares entre comillas, notas entre paréntesis y el signo de híbrido; los sinónimos se unifican (*Myrciaria cauliflora* → *Plinia cauliflora*, *Hesperocyparis macrocarpa* → *Cupressus macrocarpa*…), y un nombre sin epíteto o con dos especies del mismo género queda como «Género spp.». El reporte lista cada variante que se unificó.

Con un nombre científico que no está en `data/especies.json`, la importación crea la especie con:

- el nombre común más repetido en el Excel que no sea el de otra especie;
- familia, follaje, clima y floración tomados del inventario;
- un **sprite propuesto** según su familia (palmeras, coníferas, leguminosas en sombrilla, copas abiertas…) y el color de flor que mencione la floración;
- `"origen": null` y `"revisar": true`.

**Curar una especie nueva** en `data/especies.json`: confirma `nombre_comun` y `otros_nombres`, pon `origen` (`"nativa"` o `"introducida"`), escribe `descripcion`, `dato_curioso`, `floracion_meses` y `beneficios`, ajusta el `sprite` (el editor de `/admin/especies` lo muestra en vivo) y quita `"revisar"`. Las importaciones siguientes respetan lo curado: solo completan textos que falten. `npm run especies:importar` puede traer la familia aceptada (GBIF), el resumen de Wikipedia y una foto de iNaturalist; necesita internet.

## Calidad de los datos del Excel actual (31 de octubre de 2026)

El detalle fila por fila está en `data/inventario/REPORTE.md`. Lo principal para revisar con Sustentabilidad:

- **1086 árboles, 124 especies.** 21 coinciden con el catálogo curado; 103 se crearon desde el inventario con nombres comunes y origen revisados a mano. 45 especies tienen un solo árbol.
- **162 filas con el nombre común de otra especie.** El nombre científico y la familia coinciden entre sí, pero el nombre común no (por ejemplo, *Areca catechu* con «Árbol de Júpiter», que es el crespón). La app usa el nombre científico; si el error está ahí, hay que corregirlo en el Excel.
- **Identificaciones dudosas.** 64 *Areca catechu* (palma de betel), poco probable en Guadalajara y con muchos nombres comunes de otras especies; robles de Norteamérica (*Quercus buckleyi*, *Q. texana*, *Q. kelloggii*, *Q. palustris*…), *Juglans californica*, *Notholithocarpus densiflorus*, *Hevea brasiliensis* y *Mesua ferrea*; y plantas que no son árboles (*Erysimum cheiri*, *Mimosa pudica*, *Vitis vinifera*, *Philodendron*, *Musa*).
- **15 árboles sin sector.** Quedan como «Sin sector».
- **CUCEI-1255** tiene coordenadas a 8.2 km del campus. Aparece en el mapa, pero no se usa para encuadrarlo.
- **Placa** solo viene en 3 filas y **las medidas** (altura, copa, tronco y CO₂) casi vacías. La ficha muestra solo los datos que existan.
- 8 especies del catálogo curado no tienen árboles en el inventario (primavera, eucalipto rojo, mezquite, huizache, colorín, pochote, trueno y tronadora). No aparecen en el herbario mientras no tengan ejemplares.
