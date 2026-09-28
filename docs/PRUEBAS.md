# Verificación

Ejecuta `npm run check`.

La suite incluye generación de fechas y validación de registros, importación, PDF, recuperación de beta.1 y una regresión de la interfaz restaurada: controles originales, responsables de TecNM, generación de martes a viernes, límite de cuatro días y persistencia del borrador. También cubre el esquema del registro de entrega, migraciones, estados por hora límite, resumen semanal y la identidad Data Matrix con nombre, especialidad y empresa.

La prueba del servicio PDF extraído cubre su formato; el generador restaurado conserva su motor original dentro de `src/legacy/editor.js`. Una prueba de ese servicio por sí sola no acredita toda la entrega del navegador.

## Revisión manual

- Abrir el generador con datos anteriores y comprobar el borrador.
- Revisar en 390, 768 y 1024 px, incluyendo diálogos, último paso y FAQ.
- Completar el tutorial y probar estados especiales.
- Generar un PDF y revisar formato, logotipo, firmas y las cuatro jornadas.
- Importar un respaldo: confirmar que conserva los registros actuales y muestra un único aviso Sileo.
- Activar una actualización y comprobar que no pierde el borrador.
- Abrir `/registro-entrega/`, crear plantel, alumnos y semana, cerrar/reabrir y exportar JSON/CSV.
- Generar una bitácora y comprobar que el Data Matrix puede leerse y corresponde a nombre + especialidad + empresa.
- Abrir el tutorial durante una sesión de cámara y comprobar que no se agregan lecturas hasta cerrarlo.
- Revisar los estados del HUD: LECTOR ACTIVO, REGISTRADO, REPETIDO y NO COINCIDE.

`qa/responsive.html` permite revisar generador y FAQ en esos anchos; no es parte de la navegación del usuario.

## Anti-fool upgrate · Parte 2

26 pruebas automatizadas pasan. Cubren martes y horarios, cambio de año, nombres cortos, perfil local sin palabras secretas, configuración del instructor, controles plegados y salida de Virtual Insanity hacia los créditos. Se comprobó en el navegador publicado el perfil Blobatar, guardado con Sileo, campos de semana, créditos e instructor automático. La revisión en 390 px detectó y corrigió un desbordamiento del checkbox invisible del interruptor de instructor.


## Registro de entrega · Serie 0.50

La verificación de la serie 0.50 debe ejecutarse en la página independiente y no sólo en el generador. En CI, `npm test` y `npm run build` deben pasar antes de publicar. La construcción de producción incluye `registro-entrega/index.html` y el service worker incorpora esa página al conjunto versionado.
