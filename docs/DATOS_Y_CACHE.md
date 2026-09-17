# Datos y caché

Las bitácoras permanecen en el navegador. No hay cuentas ni sincronización entre dispositivos.

- Historial: `bitacora_dual_clean_v3`.
- Borrador: `bitacora_dual_draft_v1`.
- La primera apertura tras beta.1 recupera su historial y borrador. Conserva intacto `bitacora_dual_react_v1` como copia de recuperación; una marca evita repetir la migración.
- Los catálogos se leen exclusivamente del código. Los cambios locales de catálogos de beta.1 no sustituyen esa configuración; sus datos de origen no se eliminan.
- Exportar respaldo descarga el historial en el formato JSON original. Guarda primero la bitácora para incluirla.
- Importar acepta el formato original y los respaldos de beta.1; valida estructura y tamaño máximo de 5 MB, pide confirmación y agrega registros. Las coincidencias de identificador reciben un identificador nuevo para evitar sobrescribir registros existentes.

El service worker guarda una versión identificada por el contenido del generador, FAQ y recursos compilados. Solo limpia cachés propias. Las actualizaciones se aplican al pulsar Actualizar y se solicita guardar el borrador antes de recargar. Sileo, audio y ejemplos no se precargan. Sileo requiere conexión la primera vez que se importa un respaldo; si no carga, aparece una confirmación nativa.

Limpiar los datos del sitio elimina el historial local. La caché de archivos no es un respaldo de las bitácoras.
