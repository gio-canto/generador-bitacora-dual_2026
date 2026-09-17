# Datos y caché

Las bitácoras permanecen en el navegador. No hay cuentas ni sincronización entre dispositivos.

- Historial: `bitacora_dual_clean_v3`.
- Borrador: `bitacora_dual_draft_v1`.
- La primera apertura tras beta.1 recupera su historial y borrador. Conserva intacto `bitacora_dual_react_v1` como copia de recuperación; una marca evita repetir la migración.
- Los catálogos se leen exclusivamente del código. Los cambios locales de catálogos de beta.1 no sustituyen esa configuración; sus datos de origen no se eliminan.
- Exportar respaldo descarga el historial en el formato JSON original. Guardar o Descargar PDF incorpora la bitácora al historial. Si cancelas compartir el PDF, el registro ya guardado permanece. Si falla el almacenamiento, aparece un aviso y la descarga sigue disponible.
- Importar acepta el formato original y los respaldos de beta.1; valida estructura y tamaño máximo de 5 MB, pide confirmación y agrega registros. Las coincidencias de identificador reciben un identificador nuevo para evitar sobrescribir registros existentes.

El service worker guarda una versión identificada por el contenido del generador, FAQ y recursos compilados. La caché almacena el HTML exacto de cada compilación para no mezclarlo con archivos de otra versión. Conserva las cachés anteriores durante esta corrección para no romper pestañas abiertas. Las actualizaciones se aplican al pulsar Actualizar y se solicita guardar el borrador antes de recargar. Sileo, audio y ejemplos no se precargan. Sileo requiere conexión para su primera carga; si no carga, aparece un aviso local accesible.

Limpiar los datos del sitio elimina el historial local. La caché de archivos no es un respaldo de las bitácoras.

El perfil usa `bitacora_profile_v1`, separado de la caché de archivos. Recuerda el nombre al escribirlo y al guardar; las palabras secretas no lo sustituyen. Olvidar el nombre no elimina borrador ni historial. El avatar se genera localmente a partir del nombre; no hay cuentas.
