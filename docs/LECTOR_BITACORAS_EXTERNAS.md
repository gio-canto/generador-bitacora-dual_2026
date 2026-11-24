# Lector de bitácoras externas · v0.70.0

## Recuperación de texto y conservación de registros

Si un PDF digital contiene texto suficiente, pero faltan las horas, un nombre identificable o alguna de las cuatro jornadas, se ejecuta otra pasada de OCR sobre la página. También se reconstruyen correctamente los renglones cuando PDF.js divide el nombre, la empresa o un horario en varios fragmentos. El lector compara la transcripción digital, la general y la obtenida de las celdas, combinando información de la misma jornada sin mezclar semanas.

La búsqueda del alumno en el padrón admite pequeñas equivocaciones de reconocimiento del nombre completo, pero no selecciona automáticamente candidatos ambiguos. Las fechas vacías de jornadas identificadas se completan a partir de una semana ya seleccionada, pero los días ausentes continúan vacíos; las discrepancias entre la semana y el documento requieren una acción explícita de corrección.

Los metadatos de cada jornada guardan también las horas confirmadas, incluso si se captura únicamente la entrega por tener alguna jornada incompleta. Se conservan las horas en respaldo e importación. Al cambiar manualmente el estado a `sin_labores`, `falta` o `inhabil`, se retiran las horas y el intervalo anterior de esa jornada.

Si falla el segundo OCR de un PDF digital, se mantiene la transcripción disponible y el sistema pide verificarla. Las pruebas utilizan documentos sintéticos y no incluyen fotografías ni firmas de alumnos.



## Semana automática y estado de jornada

Al leer una bitácora, el lector obtiene su semana de las fechas explícitas y la vincula únicamente si existe un periodo del padrón con el mismo martes inicial. Si faltan fechas, puede utilizar un encabezado como `SEMANA 11` siempre que corresponda a una sola semana registrada. No se usa el número de semana para reemplazar fechas contradictorias. Cuando se crea una semana pendiente, el selector puede sincronizarse con el nuevo periodo.

Las expresiones `sin labores`, `no hubo actividades`, `no se laboró`, `sin actividades asignadas`, `actividades suspendidas`, `se cancelaron las labores` y equivalentes normalizados se clasifican como `sin_labores`. La jornada no suma horas. Las anotaciones sobre suspensiones exclusivamente en un laboratorio o área que aún registran horas permanecen por confirmar.

## Estado de carga según pantalla

En escritorio el procesamiento se muestra mediante la biblioteca Sileo, usando su notificación Promise. En móvil se conserva el indicador modal. Los campos, las listas y los botones se mantienen dentro del ancho visible, con márgenes seguros y centrados. El escáner dispone de botones centrados, incluyendo «Terminar». El lector incorpora «Terminar todo», que confirma antes de cerrar un lote con documentos sin registrar.



## Interfaz de lectura de documentos

Al agregar un archivo se muestra un indicador de proceso con su etapa hasta que termina la lectura. El formulario se presenta antes del documento original en teléfonos y los días se revisan mediante secciones plegables. El panel deja una separación superior adecuada para pantallas móviles con zona segura, y conserva una presentación de dos columnas en computadoras.

La empresa detectada se coteja con las existentes en el padrón sin distinguir mayúsculas ni acentos. También puede seleccionarse otra empresa o escribirse manualmente. La búsqueda de alumnos sigue utilizando nombres y alias.

La fecha admite formatos `DD-MM-AA`, `DD-MM-AAAA`, `AAAA-MM-DD`, fechas con barras o puntos y otros separadores reconocidos. El reloj acepta `7pm`, `7:00PM`, `7 p. m.` y formato de 24 horas. Si falta información para distinguir el meridiano o el año, se conserva la necesidad de revisión. Los estados de jornada se proponen de acuerdo con el texto detectado.

El campo de área ya no forma parte de la captura externa. El lector conserva actividad, fecha, estado y horarios. Se retiraron los controles de aprendizaje del usuario: las mejoras del OCR y los lotes reales los incorpora el mantenedor mediante el código y las pruebas.



## Lectura por coordenadas de tablas impresas

Cuando el documento tiene una cuadrícula reconocible, el motor separa fechas, actividades, horarios y áreas por celda antes de interpretar las jornadas. Las horas pequeñas se reconocen en un recorte ampliado, con caracteres propios de un reloj de 12 o 24 horas. Si el archivo PDF contiene varias páginas, cada una aparece por separado para seleccionar su semana.

La nueva implementación y el caso del documento de dos semanas están descritos en [OCR de tablas por coordenadas](OCR_TABLAS_COORDENADAS.md). Los originales privados no se agregan al repositorio.



## Mejoras del segundo lote fotográfico

A partir de diez fotografías adicionales, el lector admite fechas cortas con año contextual, separadores especiales y múltiples intervalos de tiempo en una misma jornada. Muestra los tramos reconocidos para confirmar el total. Las horas ambiguas o la anotación «No se realizaron actividades» con horario consignado permanecen pendientes de clasificación, sin sumar horas o asignar una falta automáticamente.

Los tramos confirmados se conservan en el respaldo JSON. La colección pública de pruebas tiene ejemplos anonimizados. Consulte [Entrenamiento OCR · Lote 02](ENTRENAMIENTO_OCR_LOTE02.md) y el corpus `src/data/ocr-training-lote02.json`. Las imágenes originales no se publican.



## Calibración con fotografías reales (lote 01)

Se revisaron diez fotografías externas de bitácoras impresas y manuscritas. El lector ahora contempla años de dos dígitos, fechas con nombres de meses escritos, horarios abreviados AM/PM y suspensiones de labores redactadas en texto libre. Cuando la lectura fotográfica es deficiente, realiza una segunda interpretación en alto contraste y elige la que identifica más fechas y jornadas. Una fecha fuera de martes a viernes se reporta para revisión, sin trasladarla automáticamente a otra jornada.

El lote y su metodología están documentados en [Entrenamiento OCR Lote 01](ENTRENAMIENTO_OCR_LOTE01.md). Las anotaciones están anonimizadas; las fotografías originales no se publican. El tratamiento de escritura manuscrita sigue siendo OCR general con corrección supervisada, no un modelo HTR entrenado.



## Novedades de v0.64.0

- Cuando las fechas leídas no corresponden a una semana del registro, utiliza **Crear semana**. Si las fechas identificadas están entre martes y viernes de un mismo periodo, el inicio se completa automáticamente. También puedes introducirlo manualmente. La fecha límite es opcional; si no se proporciona, no se atribuye una tardanza.
- En el campo **Alumno del padrón** la comparación ignora mayúsculas y acentos. También reconoce alias que hayan sido confirmados previamente.
- Si solo quieres mostrar fotografías como ejemplos, selecciona al alumno y pulsa **Guardar ejemplo sin registrar entrega**. El aprendizaje se conserva sin modificar semanas ni contabilizar entregas. También puedes activar **Aprender de esta lectura confirmada** antes de registrar para aprovechar una corrección OCR. Se guarda el nombre que detectó el OCR, el nombre confirmado, los nombres de empresa original y corregido, el método de lectura y la fecha. Un nombre interpretado erróneamente puede convertirse en alias, para reconocerlo en lecturas futuras. La empresa también se propone corregida cuando los ejemplos anteriores tienen una única interpretación compatible.
- Los alias pueden editarse en el padrón, uno por línea. Los conflictos entre alumnos se rechazan.
- El sistema procesa fotografías reales directamente en el lector móvil o de escritorio. Esta función aprende asociaciones y campos corregidos; no realiza entrenamiento de redes neuronales o escritura manuscrita. Para un modelo HTR especializado se necesitarían imágenes etiquetadas y un proceso de entrenamiento independiente.
- El respaldo JSON conserva hasta 100 ejemplos en `ocrLearning.examples` y hasta 25 alias por alumno. Las imágenes originales solo permanecen temporalmente en el visor durante la sesión.



## Funciones

Registro Dual puede registrar bitácoras sin Data Matrix mediante OCR. El lector Data Matrix original permanece intacto.

- PDF digital: extrae texto del documento directamente. PDF escaneado: rasteriza las páginas y utiliza OCR cuando no encuentra texto suficiente.
- Imágenes JPG, PNG y fotografías: OCR en español e inglés mediante Tesseract.js bajo demanda.
- Word DOCX: texto digital con Mammoth.js. Los documentos .doc antiguos deben convertirse previamente a .docx.
- Manuscritos: el OCR general puede intentar interpretarlos, pero no hay un motor HTR especializado. Revisión humana obligatoria.
- Hasta 12 archivos por sesión. Límite: PDF 18 MB y 16 páginas; imágenes y DOCX 12 MB.

## Uso en escritorio y teléfono

1. En Registro Dual abre una semana, o pulsa Escanear.
2. Selecciona **Leer externa** o **Leer bitácora externa**.
3. Carga imágenes, PDF y DOCX o usa **Tomar fotografía** con la cámara trasera del teléfono.
4. Revisa nombre leído, alumno del padrón, empresa, semana, cuatro jornadas, horarios, horas, áreas y actividades. El lector sugiere coincidencias únicas; no registra automáticamente.
5. Abre «Ver y corregir transcripción OCR» si necesitas cambiar el texto y pulsa «Volver a detectar campos» para actualizar los campos.
6. Revisa las cuatro jornadas. Cuando todas tienen un estado válido, se guardan sus estadísticas. Si alguna está incompleta, se guarda únicamente la entrega y se conservan los datos parciales para revisión.
7. Pulsa **Confirmar y registrar**. Si ya existe una entrega para ese alumno y esa semana, se solicita confirmación para reemplazarla.

El documento original no se sube a ningún servicio propio ni se guarda en el respaldo JSON. Se mantiene temporalmente durante la revisión y se libera al cerrar el lector. La primera carga del motor OCR, PDF.js o DOCX requiere conexión para descargar dependencias.

## Persistencia y reglas

La entrega externa se guarda con:
- \`source: "import"\` y \`usageSource: "other"\`;
- \`externalReview\`: nombre de archivo, método de lectura, páginas, fecha de revisión, nombre y empresa detectados, y un arreglo de cuatro jornadas confirmadas con fecha, estado, entrada, salida, área y actividad;
- \`statistics\`: únicamente cuando las cuatro jornadas tienen estado y datos adecuados.

Una semana cerrada no acepta la captura. Se contrasta cada fecha escrita con el día correspondiente a la semana seleccionada. Cuando el documento no indica fechas/horas, se mantienen vacías, sin completar datos supuestos. El lector Data Matrix utiliza sus mecanismos actuales y no depende de estos servicios.

## Componentes y mantenimiento

- \`src/services/external-bitacora.js\`: patrones y reglas conservadoras para texto, fechas, horas, actividades y sugerencias de padrón y semana.
- \`src/services/external-ocr.js\`: carga bajo demanda de Tesseract.js/Mammoth.js y extracción mediante PDF.js.
- \`src/components/ExternalBitacoraDialog.jsx\`: revisión y corrección, lectura múltiple y foto desde el móvil.
- \`src/external-bitacora.css\`: diseños de escritorio y de pantalla táctil.
- \`src/services/delivery-registry.js\`: almacenamiento y restauración de \`externalReview\` y registro de entrega externa.

Para integrar HTR especializado, sustituye o amplía \`external-ocr.js\`, manteniendo el contrato \`{text,pages,method,truncated}\` sin alterar el resto del Registro.

## Verificación

Ejecuta \`npm run check\` y prueba físicamente en navegadores de escritorio, Android e iOS, con documentos PDF digitales, documentos escaneados, fotografías y DOCX. Comprueba reconocimiento y revisión de fechas, duplicados, semanas cerradas, registro parcial, exportación e importación de respaldos y continuidad del escáner Data Matrix. La suite automatizada no evalúa la precisión real sobre manuscritos.
