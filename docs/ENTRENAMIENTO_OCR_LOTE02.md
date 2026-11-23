# Entrenamiento OCR · Lote 02 de fotografías reales

**Versión:** 0.66.0  
**Fecha:** 23 de noviembre de 2026  
**Cantidad:** 10 fotografías nuevas (acumulado: 20, junto con el Lote 01).  
**Distribución:** 6 manuscritas y 4 impresas.

## Inventario anonimizado

| Referencia | Formato observado | Aporte para el lector |
|---|---|---|
| IMG_5133 | Impresa horizontal a color | Fechas largas; discrepancia entre «Semana 11» y fechas del 17 al 20 de noviembre; suspensión de labores |
| IMG_5132 | Manuscrita de renglones | Tres bloques de horario y varias actividades en un día |
| IMG_5131 | Manuscrita de renglones | Bloques horarios separados y actividades distribuidas en celdas |
| IMG_5130 | Manuscrita de renglones | Semana posterior, distintos tramos y abreviaturas |
| IMG_5129 | Manuscrita de renglones | Conciliación y archivos en varias franjas horarias |
| IMG_5128 | Impresa compacta | Fechas con separadores especiales; «no se realizaron actividades» con horario indicado |
| IMG_5127 | Impresa compacta | Horarios sin espacios y suspensión puntual de actividades por reunión |
| IMG_5126 | Manuscrita con fecha corta | Fechas `17-11` sin año verificable en la hoja |
| IMG_5125 | Manuscrita con fecha corta | Fechas `10-11` sin año verificable en la hoja |
| IMG_5124 | Impresa de tabla a color | Dominante azul de la fotografía y horarios AM/PM variados |

## Cambios incorporados al motor de extracción

1. **Fechas incompletas:** los formatos `10-11` o `17-11` solamente se convierten a una fecha completa cuando existe una única referencia anual explícita y verificable dentro del mismo documento. En caso contrario, se solicita revisión y no se inventa un año.
2. **Fechas especiales:** admite `17°11°26` y expresiones como `Martes, 17 de Noviembre del 2026`.
3. **Horarios por tramos:** distingue distintos intervalos dentro de una jornada. Si los tramos son válidos, cronológicos y no se traslapan, suma su duración; muestra la lista de tramos en la interfaz.
4. **Horarios ambiguos:** expresiones como `1:00-2:00` después de tramos matutinos no se transforman automáticamente a `13:00-14:00`. La jornada permanece pendiente de confirmación.
5. **Suspensión y actividad no realizada:** «Suspensión de labores» puede clasificarse como `sin_labores`; «No se realizaron actividades en el laboratorio» con horas consignadas requiere revisión y **no** se convierte por sí sola en una falta o día sin labores.
6. **Respaldo:** las franjas horarias detectadas se conservan en el metadato de la lectura externa, sin almacenar imágenes originales.

El preprocesamiento con contraste adaptativo y doble pasada de OCR introducido en 0.65.0 se mantiene. El Lote 02 aporta ejemplos para evaluar ese mecanismo ante iluminación azulada, texto manuscrito y tablas compactas.

## Pruebas y trazabilidad

- Corpus público anonimizado: `src/data/ocr-training-lote02.json`.
- Pruebas: `tests/v066-real-photo-corpus.test.js`.
- Se comprueban diez variantes extraídas de las estructuras observadas, fechas completas y parciales, varios horarios, estados ambiguos y conservación en JSON.
- Son **muestras sintéticas anonimizadas derivadas de las fotos**: verifican reglas de extracción, no constituyen una medición de precisión de OCR sobre los píxeles.
- Los nombres, firmas y fotografías completas están fuera del repositorio. El paquete privado original debe conservarse de forma separada.

## Diferencia entre calibración y entrenamiento

La versión 0.66.0 mejora reglas, segmentación y casos de regresión para el OCR Tesseract.js existente. **No** entrena pesos de un modelo de escritura manuscrita (HTR). Para esa etapa se necesitarían recortes de líneas, sus transcripciones exactas validadas y un protocolo de evaluación con fotografías no usadas durante el entrenamiento.

## Incorporación de un lote posterior

Analizar cada fotografía y registrar la estructura; separar las lecturas verificadas de las ambiguas; generar ejemplos anónimos; añadir pruebas; ajustar extracción y preprocesamiento; comprobar el flujo móvil y la restauración de respaldo. Incrementar versión, documentación y CHANGELOG, y publicar únicamente cuando las pruebas estén revisadas.
