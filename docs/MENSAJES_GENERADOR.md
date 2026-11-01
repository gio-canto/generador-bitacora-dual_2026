# Mensajes del generador (0.60.0)

## Configuración

Los avisos se administran en [`src/data/generator-messages.json`](../src/data/generator-messages.json). Debug (`/debug/`) dispone de un **Editor de eventos** que permite importar el archivo existente o pegarlo, crear y modificar eventos, validar, visualizar, y descargar o copiar el JSON completo. La edición en Debug es local: la publicación consiste en reemplazar `src/data/generator-messages.json` en el repositorio y hacer commit.

El formato es `{"version":1,"events":[...]}`. Campos por evento:

| Campo | Descripción |
| --- | --- |
| `id` | Identificador único estable (letras minúsculas, números, guion). |
| `revision` | Entero; incrementarlo permite mostrar una actualización a quienes ya vieron el aviso. |
| `enabled` | `true` para activar, `false` para mantener como borrador. |
| `presentation` | `tab`, `medium` o `fullscreen`. |
| `trigger.type` | `on-open`, `date` o `final-bitacora`. |
| `trigger.date` | Fecha exacta `AAAA-MM-DD` cuando el activador es `date`. |
| `trigger.annualDate` | Fecha anual `MM-DD`, alternativa a `trigger.date`. |
| `trigger.startDate/endDate` | Periodo opcional en el que puede mostrarse. |
| `audience.schools` | `all` o arreglo con IDs/nombres de los planteles configurados. |
| `audience.specialties` | `all` o arreglo con especialidades exactas. |
| `content.title/body` | Título y mensaje; texto sin HTML. |
| `content.youtubeId` | Identificador de 11 caracteres o `null`; se carga sólo al iniciar la reproducción. |
| `content.action` | `null` u objeto con `label` y `url` HTTPS. |
| `frequency` | `once`, `once-per-device`, `once-per-year`, `once-per-session` o `always`. |
| `priority` | Número; se atiende primero el mayor. |
| `dismissible` | Debe ser `true`. |

Los eventos de calendario existentes permanecen independientes: no deben migrarse ni duplicarse sin una decisión explícita. Los comunicados no sustituyen los avisos obligatorios del formulario.

## Activación y lectura

Los avisos por apertura se revisan al iniciar el generador y después de cambios de perfil. Los de fecha se revisan al abrir la aplicación y cuando se recupera el foco. Se usa el calendario local de `America/Mexico_City`; los rangos incluyen los días de inicio y finalización.

`final-bitacora` sólo se emite después de generar y entregar correctamente el archivo PDF, cuando el alumno marca **Esta es mi última bitácora de Educación Dual** en el paso 5. No calcula automáticamente el fin de Dual por semestre, empresa o número de horas. La casilla se desmarca después de su activación.

La lectura se guarda en `bitacora-generator-messages-seen-v1` de `localStorage`, y en `sessionStorage` para frecuencia por sesión. Se construye una clave con ID, revisión, perfil o dispositivo y, si aplica, año. No hay sincronización entre equipos. La aplicación evita abrir mensajes cuando hay otras ventanas emergentes activas y los presenta después.

Cerrar el mensaje marca la lectura; abrir el enlace también cierra y marca. En **Mensajes** pueden revisarse manualmente los comunicados disponibles para el perfil, incluso los ya vistos. El modo pestaña no bloquea el formulario; mediano y pantalla completa ofrecen cierre visible y tecla Escape.

## YouTube y encuestas

Sólo se acepta un ID de video válido, que se reproduce desde `youtube-nocookie.com` tras pulsar reproducir. El contenido externo requiere conexión; su disponibilidad depende de YouTube y la conexión del dispositivo. Los formularios se enlazan por HTTPS con `target="_blank"` y `rel="noopener noreferrer"`. No se reciben respuestas en el generador.

La encuesta predeterminada está desactivada y sin URL real. Actívala únicamente cuando exista un formulario de destino.

## Depuración y publicación

En Debug se puede probar un perfil y una fecha, ver si coincide una condición, forzar una vista previa real y simular un anuncio visto sin alterar las preferencias de estudiantes. Importar o exportar JSON no realiza commits ni escribe el repositorio automáticamente. Después de reemplazar el archivo, ejecutar `npm run check` y revisar escritorio/móvil.

[Arquitectura](ARQUITECTURA.md) · [Pruebas](PRUEBAS.md) · [Centro de avisos](CENTRO_AVISOS.md)

## Actualización visual v0.60.1

Debug muestra el **Editor de eventos** organizado en cinco pasos: **Eventos**, **Destinatarios**, **Cuándo**, **Mensaje** y **Revisar**. Los controles sólo muestran la información del paso activo. Se puede elegir entre todos los alumnos de Educación Dual (sin filtros), una especialidad en todos los planteles, un plantel completo, un plantel y especialidad, o varios criterios. Los filtros siguen almacenándose en `audience.schools` y `audience.specialties` sin modificar el esquema.

Los videos se insertan al abrir el mensaje e intentan comenzar automáticamente **silenciados** mediante `autoplay=1&mute=1&playsinline=1`. YouTube o el navegador pueden bloquear la reproducción; el usuario puede activar audio en el reproductor. No se garantiza la reproducción automática con sonido.

La presentación del generador se activa automáticamente por ancho de pantalla y la primera pestaña móvil es **Inicio**. Las opciones manuales de alternancia fueron retiradas.
