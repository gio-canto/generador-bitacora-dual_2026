# Lector de bitácoras externas · v0.63.0

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
