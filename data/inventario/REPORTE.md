# Reporte de la importación del inventario

Generado por `npm run inventario:importar` a partir de `data/inventario/arboles-cucei.xlsx`.

- Árboles: **1086** (1086 activos)
- Especies distintas: **124** (0 nuevas en esta importación)
- Especies que falta curar (nombre, origen, descripción): **103**
- Avisos: **16** · Filas con nombre común de otra especie: **162**

## Avisos

- CUCEI-0064: sin sector (queda como «Sin sector»).
- CUCEI-0107: sin sector (queda como «Sin sector»).
- CUCEI-0199: sin sector (queda como «Sin sector»).
- CUCEI-0319: sin sector (queda como «Sin sector»).
- CUCEI-0346: sin sector (queda como «Sin sector»).
- CUCEI-0617: sin sector (queda como «Sin sector»).
- CUCEI-0888: sin sector (queda como «Sin sector»).
- CUCEI-0915: sin sector (queda como «Sin sector»).
- CUCEI-0923: sin sector (queda como «Sin sector»).
- CUCEI-1095: sin sector (queda como «Sin sector»).
- CUCEI-1193: sin sector (queda como «Sin sector»).
- CUCEI-1194: sin sector (queda como «Sin sector»).
- CUCEI-1196: sin sector (queda como «Sin sector»).
- CUCEI-1223: sin sector (queda como «Sin sector»).
- CUCEI-1255: sin sector (queda como «Sin sector»).
- CUCEI-1255: coordenadas a 8.2 km del resto del campus.

## Nombres científicos unificados

Variantes del mismo nombre (autores, sinónimos o texto descriptivo) que se agruparon en una especie.

| Especie | Escrito en el Excel como |
| --- | --- |
| *Lagerstroemia indica* | Lagerstroemia indica L. |
| *Magnolia spp.* | Magnolia |
| *Cupressus macrocarpa* | Cupressus macrocarpa · Hesperocyparis macrocarpa |
| *Tabebuia rosea* | Tabebuia rosea (Bertol.) DC. · Tabebuia rosea |
| *Citrus aurantium* | Citrus aurantium · Citrus aurantium L. · Citrus × aurantium |
| *Dracaena marginata* | Drácena de Madagascar |
| *Erysimum cheiri* | Erysimum cheiri (syn. Cheiranthus cheiri) |
| *Celtis australis* | Celtis australis L. |
| *Plinia cauliflora* | Plinia cauliflora · Myrciaria cauliflora |
| *Ceiba speciosa* | Ceiba speciosa (L.) Ravenna · Ceiba speciosa |
| *Bougainvillea spp.* | Bougainvillea glabra o Bougainvillea spectabilis (según la variedad) |
| *Terminalia catappa* | Terminalia catappa L. |
| *Mesua ferrea* | Mesua ferrea L. |
| *Azadirachta indica* | Azadirachta indica A.Juss. · Azadirachta indica |
| *Ligustrum vulgare* | Ligustrum vulgare L. |
| *Bombax ceiba* | Bombax ceiba L. |
| *Prunus serrulata* | Prunus serrulata 'Magenta' (nombre hipotético utilizado para ejemplificar un cerezo con flores magenta) |
| *Caryota urens* | Caryota urens L. |

## Filas a verificar en campo

El nombre común de estas filas corresponde a otra especie del catálogo. La app usa el nombre científico; si el error está ahí, corrígelo en el Excel y vuelve a importar.

| Código | Nombre científico (se usa) | Nombre común en el Excel | Ese nombre corresponde a |
| --- | --- | --- | --- |
| CUCEI-0002 | *Lagerstroemia indica* | Apamate | *Tabebuia rosea* |
| CUCEI-0048 | *Areca catechu* | Arce negundo | *Acer negundo* |
| CUCEI-0061 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-0063 | *Lagerstroemia indica* | Apamate | *Tabebuia rosea* |
| CUCEI-0064 | *Lagerstroemia indica* | Apamate | *Tabebuia rosea* |
| CUCEI-0072 | *Bauhinia variegata* | Arce negundo | *Acer negundo* |
| CUCEI-0078 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0081 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0083 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0113 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-0129 | *Areca catechu* | Acacia negra | *Gleditsia triacanthos* |
| CUCEI-0131 | *Bauhinia variegata* | Acacia negra | *Gleditsia triacanthos* |
| CUCEI-0138 | *Tabebuia rosea* | Árbol de Neem | *Azadirachta indica* |
| CUCEI-0153 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-0154 | *Lagerstroemia indica* | Bambú común | *Bambusa vulgaris* |
| CUCEI-0161 | *Lagerstroemia indica* | Ahuehuete | *Taxodium mucronatum* |
| CUCEI-0175 | *Hevea brasiliensis* | Ailanto | *Ailanthus altissima* |
| CUCEI-0181 | *Areca catechu* | Arce negundo | *Acer negundo* |
| CUCEI-0205 | *Bauhinia variegata* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0207 | *Areca catechu* | Árbol de Yaca | *Artocarpus heterophyllus* |
| CUCEI-0232 | *Persea americana* | Areca | *Dypsis lutescens* |
| CUCEI-0234 | *Araucaria araucana* | Areca | *Dypsis lutescens* |
| CUCEI-0235 | *Areca catechu* | Areca | *Dypsis lutescens* |
| CUCEI-0236 | *Casuarina equisetifolia* | Areca | *Dypsis lutescens* |
| CUCEI-0237 | *Casuarina equisetifolia* | Areca | *Dypsis lutescens* |
| CUCEI-0238 | *Casuarina equisetifolia* | Areca | *Dypsis lutescens* |
| CUCEI-0239 | *Casuarina equisetifolia* | Areca | *Dypsis lutescens* |
| CUCEI-0240 | *Casuarina equisetifolia* | Areca | *Dypsis lutescens* |
| CUCEI-0241 | *Casuarina equisetifolia* | Areca | *Dypsis lutescens* |
| CUCEI-0242 | *Persea americana* | Areca | *Dypsis lutescens* |
| CUCEI-0243 | *Erysimum cheiri* | Areca | *Dypsis lutescens* |
| CUCEI-0244 | *Lagerstroemia indica* | Areca | *Dypsis lutescens* |
| CUCEI-0247 | *Lagerstroemia indica* | Areca | *Dypsis lutescens* |
| CUCEI-0249 | *Albizia julibrissin* | Areca | *Dypsis lutescens* |
| CUCEI-0250 | *Bauhinia variegata* | Areca | *Dypsis lutescens* |
| CUCEI-0259 | *Areca catechu* | Árbol del caucho | *Hevea brasiliensis* |
| CUCEI-0267 | *Areca catechu* | Árbol del caucho | *Hevea brasiliensis* |
| CUCEI-0290 | *Tabebuia rosea* | Aguacate | *Persea americana* |
| CUCEI-0292 | *Bauhinia variegata* | Areca | *Dypsis lutescens* |
| CUCEI-0294 | *Araucaria heterophylla* | Areca | *Dypsis lutescens* |
| CUCEI-0295 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0296 | *Celtis australis* | Areca | *Dypsis lutescens* |
| CUCEI-0298 | *Lagerstroemia indica* | Areca | *Dypsis lutescens* |
| CUCEI-0299 | *Persea americana* | Areca | *Dypsis lutescens* |
| CUCEI-0352 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0358 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0364 | *Citrus aurantium* | Areca | *Dypsis lutescens* |
| CUCEI-0365 | *Persea americana* | Areca | *Dypsis lutescens* |
| CUCEI-0366 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0367 | *Artocarpus heterophyllus* | Areca | *Dypsis lutescens* |
| CUCEI-0370 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0372 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0373 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0377 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0388 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0390 | *Beaucarnea recurvata* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0391 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0392 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0393 | *Persea americana* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0398 | *Tabebuia rosea* | Aguacate | *Persea americana* |
| CUCEI-0401 | *Bauhinia variegata* | Areca | *Dypsis lutescens* |
| CUCEI-0403 | *Araucaria heterophylla* | Areca | *Dypsis lutescens* |
| CUCEI-0404 | *Bauhinia blakeana* | Areca | *Dypsis lutescens* |
| CUCEI-0405 | *Araucaria heterophylla* | Areca | *Dypsis lutescens* |
| CUCEI-0406 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0407 | *Mesua ferrea* | Areca | *Dypsis lutescens* |
| CUCEI-0408 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0409 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0410 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0411 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0413 | *Araucaria heterophylla* | Areca | *Dypsis lutescens* |
| CUCEI-0415 | *Araucaria heterophylla* | Areca | *Dypsis lutescens* |
| CUCEI-0416 | *Dracaena sanderiana* | Areca | *Dypsis lutescens* |
| CUCEI-0417 | *Persea americana* | Areca | *Dypsis lutescens* |
| CUCEI-0418 | *Azadirachta indica* | Areca | *Dypsis lutescens* |
| CUCEI-0420 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0421 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0422 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0424 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0426 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0458 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0459 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0460 | *Ailanthus altissima* | Areca | *Dypsis lutescens* |
| CUCEI-0462 | *Ligustrum vulgare* | Areca | *Dypsis lutescens* |
| CUCEI-0475 | *Bauhinia variegata* | Árbol de Neem | *Azadirachta indica* |
| CUCEI-0488 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-0504 | *Acer negundo* | Apamate | *Tabebuia rosea* |
| CUCEI-0517 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0519 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0520 | *Tabebuia rosea* | Areca | *Dypsis lutescens* |
| CUCEI-0521 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0523 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0524 | *Areca catechu* | Aguacate | *Persea americana* |
| CUCEI-0539 | *Areca catechu* | Araucaria | *Araucaria heterophylla* |
| CUCEI-0552 | *Terminalia catappa* | Areca | *Dypsis lutescens* |
| CUCEI-0598 | *Lagerstroemia indica* | Areca | *Dypsis lutescens* |
| CUCEI-0603 | *Gleditsia triacanthos* | Aligustre | *Ligustrum lucidum* |
| CUCEI-0604 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0605 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-0607 | *Tabebuia rosea* | Acacia de Constantinopla | *Albizia julibrissin* |
| CUCEI-0615 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-0617 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-0621 | *Areca catechu* | Araucaria excelsa | *Araucaria heterophylla* |
| CUCEI-0630 | *Lagerstroemia indica* | Apamate | *Tabebuia rosea* |
| CUCEI-0638 | *Lagerstroemia indica* | Aguacate | *Persea americana* |
| CUCEI-0641 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0645 | *Lagerstroemia indica* | Apamate | *Tabebuia rosea* |
| CUCEI-0666 | *Lagerstroemia indica* | Aguacate | *Persea americana* |
| CUCEI-0711 | *Euphorbia tirucalli* | Almendro de la India | *Terminalia catappa* |
| CUCEI-0742 | *Hevea brasiliensis* | Árbol de los dedos | *Euphorbia tirucalli* |
| CUCEI-0761 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-0764 | *Areca catechu* | Araucaria excelsa | *Araucaria heterophylla* |
| CUCEI-0766 | *Acer negundo* | Araucaria excelsa | *Araucaria heterophylla* |
| CUCEI-0771 | *Lagerstroemia indica* | Almendro de la India | *Terminalia catappa* |
| CUCEI-0775 | *Areca catechu* | Árbol de hierro | *Mesua ferrea* |
| CUCEI-0793 | *Euphorbia tirucalli* | Almendro de la India | *Terminalia catappa* |
| CUCEI-0794 | *Bambusa vulgaris* | Almendro de la India | *Terminalia catappa* |
| CUCEI-0795 | *Taxodium mucronatum* | Almendro de la India | *Terminalia catappa* |
| CUCEI-0800 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0827 | *Acer negundo* | Araucaria excelsa | *Araucaria heterophylla* |
| CUCEI-0864 | *Persea americana* | Araucaria excelsa | *Araucaria heterophylla* |
| CUCEI-0876 | *Areca catechu* | Árbol de la felicidad | *Dracaena fragrans* |
| CUCEI-0936 | *Lagerstroemia indica* | Aguacate | *Persea americana* |
| CUCEI-0970 | *Bauhinia variegata* | Areca | *Dypsis lutescens* |
| CUCEI-0981 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0982 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0983 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0985 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0986 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0987 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0989 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-0990 | *Lagerstroemia indica* | Ailanto | *Ailanthus altissima* |
| CUCEI-1015 | *Gleditsia triacanthos* | Almendro de la India | *Terminalia catappa* |
| CUCEI-1020 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-1056 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-1057 | *Areca catechu* | Apamate | *Tabebuia rosea* |
| CUCEI-1069 | *Ailanthus altissima* | Almendro de la India | *Terminalia catappa* |
| CUCEI-1072 | *Areca catechu* | Almendro de la India | *Terminalia catappa* |
| CUCEI-1076 | *Lagerstroemia indica* | Almez | *Celtis australis* |
| CUCEI-1081 | *Areca catechu* | Areca | *Dypsis lutescens* |
| CUCEI-1082 | *Areca catechu* | Areca | *Dypsis lutescens* |
| CUCEI-1087 | *Areca catechu* | Araucaria excelsa | *Araucaria heterophylla* |
| CUCEI-1104 | *Lagerstroemia indica* | Areca | *Dypsis lutescens* |
| CUCEI-1110 | *Lagerstroemia indica* | Ailanto | *Ailanthus altissima* |
| CUCEI-1162 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1164 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1168 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1169 | *Areca catechu* | Árbol de las orquídeas | *Bauhinia blakeana* |
| CUCEI-1170 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1171 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1173 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1174 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1175 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1176 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1177 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1178 | *Areca catechu* | Árbol de Júpiter | *Lagerstroemia indica* |
| CUCEI-1191 | *Araucaria heterophylla* | Areca | *Dypsis lutescens* |
| CUCEI-1219 | *Azadirachta indica* | Areca | *Dypsis lutescens* |
| CUCEI-1220 | *Ailanthus altissima* | Areca | *Dypsis lutescens* |
| CUCEI-1224 | *Lagerstroemia indica* | Areca | *Dypsis lutescens* |
| CUCEI-1253 | *Ailanthus altissima* | Almendro de la India | *Terminalia catappa* |
| CUCEI-1254 | *Ailanthus altissima* | Almendro de la India | *Terminalia catappa* |

## Especies por curar

Tienen `"revisar": true` en `data/especies.json`: falta confirmar nombre común, origen (nativa o introducida), descripción y calendario de floración. `npm run especies:importar` puede completar parte desde GBIF, Wikipedia e iNaturalist.

| Especie | Nombre común | Familia | Árboles |
| --- | --- | --- | ---: |
| *Areca catechu* | Palma de betel | Arecaceae | 64 |
| *Platycladus orientalis* | Tuya oriental | Cupressaceae | 60 |
| *Fraxinus mexicanus* | Fresno silvestre mexicano | Oleaceae | 39 |
| *Dracaena marginata* | Drácena marginata | Asparagaceae | 32 |
| *Eucalyptus citriodora* | Eucalipto limón | Myrtaceae | 22 |
| *Schefflera actinophylla* | Cheflera | Araliaceae | 20 |
| *Nerium oleander* | Laurel rosa | Apocynaceae | 19 |
| *Cordia lutea* | Laurel indio | Boraginaceae | 17 |
| *Beaucarnea recurvata* | Pata de elefante | Asparagaceae | 16 |
| *Citrus aurantium* | Naranjo agrio | Rutaceae | 15 |
| *Eriobotrya japonica* | Níspero | Rosaceae | 12 |
| *Plinia cauliflora* | Jaboticaba | Myrtaceae | 10 |
| *Azadirachta indica* | Neem | Meliaceae | 10 |
| *Ceiba pentandra* | Ceiba | Malvaceae | 9 |
| *Dracaena fragrans* | Palo de Brasil | Asparagaceae | 9 |
| *Terminalia catappa* | Almendro de la India | Combretaceae | 8 |
| *Persea americana* | Aguacate | Lauraceae | 7 |
| *Cupressus macrocarpa* | Ciprés de Monterrey | Cupressaceae | 6 |
| *Quercus ilex* | Encina | Fagaceae | 6 |
| *Eucalyptus robusta* | Eucalipto robusto | Myrtaceae | 6 |
| *Araucaria heterophylla* | Pino de Norfolk | Araucariaceae | 6 |
| *Bougainvillea spp.* | Bugambilia | Nyctaginaceae | 6 |
| *Quercus buckleyi* | Roble rojo de Texas | Fagaceae | 5 |
| *Ailanthus altissima* | Ailanto | Simaroubaceae | 5 |
| *Juniperus virginiana* | Cedro de Virginia | Cupressaceae | 5 |
| *Phoenix canariensis* | Palmera canaria | Arecaceae | 4 |
| *Cupaniopsis anacardioides* | Tuckeroo | Sapindaceae | 4 |
| *Magnolia spp.* | Magnolio | Magnoliaceae | 4 |
| *Melia azedarach* | Paraíso sombrilla | Meliaceae | 4 |
| *Quercus texana* | Roble de Nuttall | Fagaceae | 4 |
| *Chamaerops humilis* | Palmera enana | Arecaceae | 4 |
| *Punica granatum* | Granado | Lythraceae | 4 |
| *Mimosa pudica* | Dormilona | Fabaceae | 3 |
| *Olea europaea* | Olivo | Oleaceae | 3 |
| *Washingtonia filifera* | Palmera de California | Arecaceae | 3 |
| *Bursera simaruba* | Palo mulato | Burseraceae | 3 |
| *Ceiba speciosa* | Palo borracho | Malvaceae | 3 |
| *Annona muricata* | Guanábana | Annonaceae | 3 |
| *Cocos nucifera* | Cocotero | Arecaceae | 3 |
| *Acer negundo* | Arce negundo | Sapindaceae | 3 |
| *Prunus serrulata* | Cerezo japonés | Rosaceae | 3 |
| *Bauhinia blakeana* | Árbol orquídea de Hong Kong | Fabaceae | 2 |
| *Pinus halepensis* | Pino de Alepo | Pinaceae | 2 |
| *Ficus aurea* | Higuera estranguladora | Moraceae | 2 |
| *Quercus macrocarpa* | Roble bur | Fagaceae | 2 |
| *Hevea brasiliensis* | Árbol del caucho | Euphorbiaceae | 2 |
| *Brosimum alicastrum* | Ramón | Moraceae | 2 |
| *Livistona chinensis* | Palmera de abanico china | Arecaceae | 2 |
| *Fraxinus velutina* | Fresno de Arizona | Oleaceae | 2 |
| *Ginkgo biloba* | Ginkgo | Ginkgoaceae | 2 |
| *Cedrela odorata* | Cedro rojo | Meliaceae | 2 |
| *Tamarindus indica* | Tamarindo | Fabaceae | 2 |
| *Coffea arabica* | Cafeto | Rubiaceae | 2 |
| *Acca sellowiana* | Feijoa | Myrtaceae | 2 |
| *Roystonea regia* | Palma real | Arecaceae | 2 |
| *Gleditsia triacanthos* | Acacia de tres espinas | Fabaceae | 2 |
| *Melaleuca quinquenervia* | Niaouli | Myrtaceae | 2 |
| *Euphorbia tirucalli* | Árbol de los lápices | Euphorbiaceae | 2 |
| *Synsepalum dulcificum* | Fruta milagrosa | Sapotaceae | 2 |
| *Pistacia chinensis* | Pistacho chino | Anacardiaceae | 2 |
| *Caryota urens* | Cariota | Arecaceae | 2 |
| *Terminalia amazonia* | Palo amarillo | Combretaceae | 1 |
| *Magnolia grandiflora* | Magnolia | Magnoliaceae | 1 |
| *Philodendron spp.* | Filodendro | Araceae | 1 |
| *Hibiscus rosa-sinensis* | Hibisco | Malvaceae | 1 |
| *Vitis vinifera* | Vid | Vitaceae | 1 |
| *Juglans californica* | Nogal negro de California | Juglandaceae | 1 |
| *Quercus gambelii* | Roble de Gambel | Fagaceae | 1 |
| *Musa paradisiaca* | Plátano | Musaceae | 1 |
| *Araucaria araucana* | Araucaria chilena | Araucariaceae | 1 |
| *Erysimum cheiri* | Alhelí amarillo | Brassicaceae | 1 |
| *Albizia julibrissin* | Árbol de la seda | Fabaceae | 1 |
| *Quercus stellata* | Roble de los postes | Fagaceae | 1 |
| *Opuntia streptacantha* | Nopal cardón | Cactaceae | 1 |
| *Celtis australis* | Almez | Cannabaceae | 1 |
| *Artocarpus heterophyllus* | Yaca | Moraceae | 1 |
| *Leucaena leucocephala* | Guaje | Fabaceae | 1 |
| *Mesua ferrea* | Árbol de hierro de Ceilán | Calophyllaceae | 1 |
| *Dracaena sanderiana* | Bambú de la suerte | Asparagaceae | 1 |
| *Ligustrum vulgare* | Aligustre común | Oleaceae | 1 |
| *Quercus palustris* | Roble de los pantanos | Fagaceae | 1 |
| *Hibiscus tiliaceus* | Hibisco marítimo | Malvaceae | 1 |
| *Ulmus americana* | Olmo americano | Ulmaceae | 1 |
| *Prunus serotina* | Capulín | Rosaceae | 1 |
| *Quercus kelloggii* | Roble negro de California | Fagaceae | 1 |
| *Dypsis lutescens* | Palma areca | Arecaceae | 1 |
| *Bocconia frutescens* | Llorasangre | Papaveraceae | 1 |
| *Bombax ceiba* | Ceiba roja | Malvaceae | 1 |
| *Eucalyptus gunnii* | Eucalipto gunnii | Myrtaceae | 1 |
| *Bismarckia nobilis* | Palmera de Bismarck | Arecaceae | 1 |
| *Moringa oleifera* | Moringa | Moringaceae | 1 |
| *Opuntia ficus-indica* | Nopal | Cactaceae | 1 |
| *Liquidambar styraciflua* | Liquidámbar | Altingiaceae | 1 |
| *Bambusa vulgaris* | Bambú común | Poaceae | 1 |
| *Carica papaya* | Papayo | Caricaceae | 1 |
| *Sabal uresana* | Guano de costa | Arecaceae | 1 |
| *Notholithocarpus densiflorus* | Roble tanoak | Fagaceae | 1 |
| *Duranta erecta* | Duranta | Verbenaceae | 1 |
| *Phoenix dactylifera* | Palmera datilera | Arecaceae | 1 |
| *Fraxinus pennsylvanica* | Fresno rojo | Oleaceae | 1 |
| *Quercus agrifolia* | Encino de California | Fagaceae | 1 |
| *Pachypodium lamerei* | Palmera de Madagascar | Apocynaceae | 1 |
| *Schinus terebinthifolia* | Pimienta de Brasil | Anacardiaceae | 1 |
