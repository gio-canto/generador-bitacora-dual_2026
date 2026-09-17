# Verificación

Ejecuta `npm run check`.

La suite incluye generación de fechas y validación de registros, importación, PDF, recuperación de beta.1 y una regresión de la interfaz restaurada: controles originales, responsables de TecNM, generación de martes a viernes, límite de cuatro días y persistencia del borrador.

La prueba del servicio PDF extraído cubre su formato; el generador restaurado conserva su motor original dentro de `src/legacy/editor.js`. Una prueba de ese servicio por sí sola no acredita toda la entrega del navegador.

## Revisión manual

- Abrir el generador con datos anteriores y comprobar el borrador.
- Revisar en 390, 768 y 1024 px, incluyendo diálogos, último paso y FAQ.
- Completar el tutorial y probar estados especiales.
- Generar un PDF y revisar formato, logotipo, firmas y las cuatro jornadas.
- Importar un respaldo: confirmar que conserva los registros actuales y muestra un único aviso Sileo.
- Activar una actualización y comprobar que no pierde el borrador.

`qa/responsive.html` permite revisar generador y FAQ en esos anchos; no es parte de la navegación del usuario.
