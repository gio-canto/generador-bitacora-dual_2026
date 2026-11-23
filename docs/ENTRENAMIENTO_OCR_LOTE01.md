# Entrenamiento OCR · Lote 01 de fotografías reales

**Versión del programa:** 0.65.0  
**Fecha de incorporación:** 23 de noviembre de 2026  
**Origen:** diez fotografías facilitadas para mejorar el reconocimiento de bitácoras externas del CBTIS 134.

## Inventario y observaciones

| Referencia interna | Tipo de formato | Elemento observado |
| --- | --- | --- |
| IMG_5145 | Impreso horizontal | Semana 11; fechas `dd/mm/aa`; horas abreviadas `9a.m.-3p.m.` |
| IMG_5144 | Impreso horizontal | Semana 12; misma notación; día sin labores |
| IMG_5143 | Manuscrito sobre renglones | Fechas y tiempos difíciles de distinguir; horario `9:00-2:00` sin meridiano confirmado |
| IMG_5142 | Manuscrito sobre renglones | Fechas cortas, jornadas `09:00-14:00`, texto manuscrito distribuido en celdas |
| IMG_5140 | Impreso horizontal a color | Fechas largas con día y mes escritos; horario `9:00 AM - 3:00 PM` |
| IMG_5139 | Impreso vertical | Etiquetas `Entrada:`/`Salida:` con AM y PM; día sin labores |
| IMG_5138 | Impreso vertical | Etiquetas `Entrada:`/`Salida:` y áreas de trabajo |
| IMG_5137 | Impreso vertical | Fechas `01/septiembre/2026`; horas de 24 horas |
| IMG_5136 | Impreso vertical | Fechas `17/noviembre/2026`; expresión «Se suspendieron las labores» |
| IMG_5135 | Impreso vertical a color | Jornada `9:00 am A 3:00 pm`; suspensión de labores |

La referencia **IMG_5143** conserva una observación de lectura dudosa de fechas manuscritas. La prueba usa una muestra construida para verificar que una fecha de fin de semana **no** se traslade a otra jornada y que la salida sin meridiano no se convierta automáticamente en 14:00.

## Qué se ha incorporado al algoritmo

1. **Segmentación de fechas:** admite año de dos cifras, mes escrito con barras, fechas completas y variantes que empiezan con el día de la semana.
2. **Interpretación de horarios:** entiende AM/PM abreviado y horas sin minutos cuando hay meridiano, junto a intervalos de 24 horas. Las horas ambiguas quedan pendientes de confirmación.
3. **Identificación de suspensiones:** detecta diversas expresiones de «sin labores» sin depender de un único texto.
4. **Revisión de periodos:** identifica fechas fuera de martes a viernes; no debe completar jornadas a partir de días que no coinciden.
5. **Fotografía difícil:** primera pasada OCR sobre la imagen; si faltan jornadas o datos esenciales, una segunda lectura con alto contraste. Conserva la interpretación que reconoce más datos estructurados.

## Corpus público de pruebas

- Archivo: `src/data/ocr-training-lote01.json`.
- Suite: `tests/v065-real-photo-corpus.test.js`.
- Contiene diez **fragmentos de texto anonimizados** construidos a partir de los formatos observados. Conservan características de fechas, horas, encabezados y estados, pero no constituyen transcripciones literales completas.
- Cada muestra incluye una referencia de fotografía, tipo de formato, convenciones de escritura, texto de prueba y expectativas verificables. Los datos dudosos se señalan y no se convierten en verdad confirmada.
- No incluye fotografías, firmas, nombres de estudiantes ni autorizaciones escaneadas.

## Alcance del aprendizaje

El sistema existente ejecuta OCR mediante Tesseract.js. Esta versión **calibra el procesamiento y las reglas de extracción a partir de un lote real**, y usa las muestras para identificar regresiones. No modifica los pesos del modelo Tesseract ni incorpora un entrenador de reconocimiento manuscrito (HTR). Para entrenar HTR se requeriría un corpus mayor con transcripciones verificadas por línea o región, separación entre entrenamiento y evaluación y un proceso específico de modelado.

El aprendizaje supervisado de alias y correcciones confirmadas, incluido en la versión 0.64.0, permanece disponible.

## Procedimiento para incorporar lotes posteriores

1. Revisar las fotografías originales en un entorno de trabajo privado y asignar un identificador de muestra.
2. Identificar columnas, estructura de la hoja, tipo de escritura, fecha y horario legibles, y datos que requieran revisión manual.
3. Elaborar fragmentos anonimizados que conserven las variaciones relevantes para OCR, sin publicar datos personales ni firmas.
4. Registrar en el corpus las expectativas **confirmadas** y separar las lecturas ambiguas.
5. Ajustar reglas o preprocesamiento solo en respuesta a fallas reproducibles; añadir pruebas de regresión.
6. Verificar `npm run check` y realizar pruebas fotográficas en iOS y Android.

## Validación

La suite automatizada comprueba la extracción a partir de fragmentos anonimizados, no mide por sí misma precisión OCR en los diez archivos de imagen. La medición de precisión sobre fotografías requiere ejecutar el lector con los originales y comparar los resultados con transcripciones verificadas, registrando los errores por campo y tipo de documento.
