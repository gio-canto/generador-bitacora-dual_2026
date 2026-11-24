# Lectura OCR por coordenadas · Versión 0.67.0

Fecha: 23 de noviembre de 2026.

## Caso de diagnóstico

Documento privado recibido: PDF escaneado de dos páginas con bitácoras distintas. Se examinó cada página en forma independiente.

| Página del documento | Periodo | Lectura verificada de la columna «Horarios» |
| --- | --- | --- |
| 1 | 17 al 20 de noviembre de 2026, Semana 12 | Mar-jue: 9 a. m. a 3 p. m., seis horas diarias. Viernes: sin labores |
| 2 | 10 al 13 de noviembre de 2026, Semana 11 | Martes: 9 a. m. a 3 p. m. Mié-vie: 7 a. m. a 1 p. m.; seis horas diarias |

La causa diagnosticada es la lectura de una tabla escaneada como texto continuo. El OCR puede intercalar fecha, actividad, horas y área de filas diferentes. Además, el texto pequeño en cursivas puede degradar un «9» a otra letra cuando se reconoce en toda la página.

## Implementación

- **Geometría de tabla:** el lector busca cinco líneas verticales y siete o más horizontales para localizar los límites de cuatro columnas y las cuatro jornadas. Si la cuadrícula no está suficientemente definida, utiliza el método existente.
- **Corrección de inclinación:** una pendiente pequeña calculada entre la columna de fechas y la de horarios ajusta las coordenadas de cada recorte; las coordenadas son siempre píxeles de canvas renderizado, nunca puntos PDF.
- **Bloques OCR:** Tesseract.js entrega palabras y cajas delimitadoras en coordenadas de la imagen. Cada palabra se asigna a su columna y fila, y se compone nuevamente el texto en orden temporal.
- **Lectura reforzada:** cuando no se puede comprobar la fecha o el horario, se recorta exclusivamente la celda y se amplía a triple resolución. El horario se reconoce con un conjunto de caracteres apropiado para cifras, AM/PM y separadores. El OCR vuelve a su configuración habitual al terminar.
- **Validación:** la lectura espacial reemplaza la transcripción de página completa únicamente cuando detecta al menos tres jornadas y no pierde horas válidas frente al OCR anterior. Una hora dudosa queda vacía para confirmación.
- **PDF de varias páginas:** cada página se presenta como documento independiente en el lector. Se elige alumno y semana para cada una, evitando mezclar las semanas 11 y 12 del ejemplo.
- **Formatos:** se conservan relojes de 24 horas (incluidos 17:00–23:00), de 12 horas (9 a. m.–3 p. m.) y textos compactos. No se deduce el meridiano de «9:00-3:00».

## Pruebas

\`tests/v067-spatial-ocr.test.js\` verifica:

1. Detección de columnas y filas inclinadas mediante una cuadrícula sintética anonimizada.
2. Uso de coordenadas OCR para asignar una palabra a la celda correcta.
3. Primera página: martes, miércoles y jueves con seis horas y viernes sin labores.
4. Segunda página: cuatro jornadas de seis horas.
5. Horarios de doce y veinticuatro horas sin confundir 23:00 con 11:00.
6. Separación de páginas de un PDF, con un registro distinto para cada semana.
7. Fallback cuando no existe una cuadrícula confiable.

El documento original y las firmas no se incluyen en el repositorio público. Las pruebas de cuadrícula utilizan datos sintéticos y la transcripción esperada anonimizada. La comparación directa con el PDF privado no se ejecuta en GitHub Actions.

## Compatibilidad

Los datos de estudiantes, entregas, alias y semanas de versiones anteriores permanecen en el mismo formato. El método continúa siendo OCR Tesseract.js, pero ahora con interpretación espacial de tablas. No se ha reentrenado un nuevo modelo de reconocimiento de escritura manuscrita.

## Limitaciones conocidas

La primera versión del detector espacial se enfoca en documentos impresos con líneas de tabla reconocibles y cuatro jornadas. Fotografías manuscritas sin bordes claros seguirán utilizando OCR general y confirmación manual. Los documentos inclinados o deformados que no cumplan la geometría mínima utilizarán el método anterior; la mejora geométrica no pretende inferir horas sin evidencia legible.
