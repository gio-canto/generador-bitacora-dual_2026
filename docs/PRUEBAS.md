# Verificación

Ejecuta `npm run check`.

La suite incluye generación de fechas y validación de registros, importación, PDF, recuperación de beta.1 y una regresión de la interfaz restaurada: controles originales, responsables de TecNM, generación de martes a viernes, límite de cuatro días y persistencia del borrador. También cubre el esquema del registro de entrega, migraciones, estados por hora límite, resumen semanal y el Data Matrix con nombre, especialidad, empresa y periodo, incluida la selección automática de semana.

La prueba del servicio PDF extraído cubre su formato; el generador restaurado conserva su motor original dentro de `src/legacy/editor.js`. Una prueba de ese servicio por sí sola no acredita toda la entrega del navegador.

## Revisión manual

- Abrir el generador con datos anteriores y comprobar el borrador.
- Revisar en 390, 768 y 1024 px, incluyendo diálogos, último paso y FAQ.
- Completar el tutorial y probar estados especiales.
- Generar un PDF y revisar formato, logotipo, firmas y las cuatro jornadas.
- Importar un respaldo: confirmar que conserva los registros actuales y muestra un único aviso Sileo.
- Activar una actualización y comprobar que no pierde el borrador.
- Abrir `/registro-entrega/`, crear plantel, alumnos y semana, cerrar/reabrir y exportar JSON/CSV.
- Generar una bitácora y comprobar que el Data Matrix puede leerse y corresponde a nombre + especialidad + empresa + fecha inicial + fecha final.
- Crear dos semanas y escanear bitácoras de ambas en la misma sesión: cada lectura debe aparecer con su semana correcta.
- Escanear una bitácora después de la fecha/hora límite y comprobar que queda como Entregado a destiempo.
- Probar una foto o captura con Leer imagen para separar problemas de enfoque de problemas de decodificación.
- En iPhone/iPad, entrar al escáner y confirmar que la cámara **no** se abre sola; tocar Activar cámara y aceptar el permiso.
- Bloquear el dispositivo o cambiar de app con la cámara activa; al volver, confirmar que el stream quedó detenido y que Reintentar/Activar cámara abre uno nuevo.
- Probar Safari en vertical y horizontal, verificando safe areas, controles inferiores y que ningún input provoque zoom por tipografía menor de 16 px.
- Abrir el tutorial durante una sesión de cámara y comprobar que no se agregan lecturas hasta cerrarlo.
- Revisar los estados del HUD: LECTOR ACTIVO, REGISTRADO, REPETIDO y NO COINCIDE.

`qa/responsive.html` permite revisar generador y FAQ en esos anchos; no es parte de la navegación del usuario.

## Anti-fool upgrate · Parte 2

26 pruebas automatizadas pasan. Cubren martes y horarios, cambio de año, nombres cortos, perfil local sin palabras secretas, configuración del instructor, controles plegados y salida de Virtual Insanity hacia los créditos. Se comprobó en el navegador publicado el perfil Blobatar, guardado con Sileo, campos de semana, créditos e instructor automático. La revisión en 390 px detectó y corrigió un desbordamiento del checkbox invisible del interruptor de instructor.


## Registro de entrega · Serie 0.50

La verificación de la serie 0.50 debe ejecutarse en la página independiente y no sólo en el generador. En CI, `npm test` y `npm run build` deben pasar antes de publicar. La construcción de producción incluye `registro-entrega/index.html` y el service worker incorpora esa página al conjunto versionado.


## Códigos de error del escáner · Beta 0.50.0-beta.9

Durante pruebas en iPhone/iPad, si aparece un error, registrar primero el código visible y usar **Copiar diagnóstico**. Como mínimo deben distinguirse:

- `CAM-003`: permiso denegado.
- `VID-102`: stream obtenido pero sin fotogramas utilizables.
- `ZX-201`: ZXing no pudo cargarse.
- `ZX-203`: ZXing cargó pero no se pudo construir el lector.
- `ZX-204`: el lector se creó pero `scan()` no pudo iniciar.
- `ZX-205`: fallo fatal durante el ciclo de lectura.
- `BD-206`: BarcodeDetector existe pero no soporta Data Matrix.
- `IMG-301`: fallo leyendo una fotografía.

El texto copiado debe incluir versión, código, etapa, estado del stream/video y disponibilidad de los lectores, pero nunca el contenido del Data Matrix ni el `deviceId` real.
