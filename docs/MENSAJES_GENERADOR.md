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

## Graduaciones programadas (0.60.2)

Crea un evento desde **Debug → Editor de eventos → Crear graduación**. El asistente de cinco pasos permite indicar destinatarios, el **intervalo completo de celebración** y marcar varios **días del video** dentro de él. El tema visual aparece durante todo el intervalo; el mensaje de felicitación se muestra **solamente en los días elegidos**, una vez por perfil y día con frecuencia `once-per-day`. Cerrar el mensaje guarda la lectura del día en el navegador. Un segundo día elegido vuelve a mostrarlo, sin repetirlo continuamente.

El activador utiliza `trigger.type: "graduation"`, `startDate`, `endDate` y `videoDates: ["AAAA-MM-DD", ...]`. Es necesario que cada fecha esté dentro del intervalo y que no existan repetidas. El evento puede tener `graduation: {"label":"Nombre visible","theme":"celebration"}`. La apariencia cambia cuando el evento está activo y el plantel/especialidad del perfil coincide, independientemente de haber visto el mensaje. Si el evento está desactivado, no modifica el diseño.

**Ejemplo publicado:** `graduacion-cbtis134-dual-generacion4-2027`. CBTis No. 134, 19–23 de julio de 2027, video `YUC4FH3tSOk` el 22 (jueves) y el 23 (viernes). El criterio de destinatarios es el plantel. El perfil actual no almacena un identificador de generación, por lo que **no se valida de forma individual la pertenencia a la cuarta generación**. El texto es institucional y su publicación debe corresponder a los alumnos previstos.

En los dos días del video no aparece una segunda despedida genérica después de marcar la última bitácora. Los eventos de graduación pueden clonarse o agregarse como entradas independientes. Puedes consultar y probar las reglas con cualquier fecha en Debug antes de exportar el JSON. El video usa la reproducción configurada en la 0.60.1, sujeta a restricciones del navegador.


## Editor visual guiado (0.60.3)

Al abrir `/debug/` se carga automáticamente la configuración **publicada con esta versión** de `src/data/generator-messages.json`, incluyendo eventos desactivados, ID, revisión, prioridad, fechas, videos, destinatarios y textos. Si se modificó el JSON en GitHub después del último despliegue, es necesario actualizar el sitio para que el editor lea esa nueva versión. La configuración publicada no se sobrescribe desde Debug.

El editor dispone de siete pasos: **Eventos**, **Destinatarios**, **Cuándo**, **Calendario**, **Mensaje**, **Pruebas** y **Publicar**. Usa controles visuales propios para seleccionar plantel, especialidades, fechas específicas, rangos y días múltiples de video; los campos de texto también están personalizados. La pestaña Eventos presenta **Modificar** y **Probar** para cada entrada cargada, incluida la graduación de 2027 y los borradores desactivados.

La vista previa usa el componente de mensajes real. El simulador comprueba las reglas de activación y destinatarios con perfil y fecha ficticios, y la opción **Ver aviso real** permite ensayar contenidos incluso si el evento está desactivado. El simulador cuenta con su propia memoria de lectura; marcar un mensaje visto no afecta al navegador del alumno ni a los registros. El diseño de graduación puede visualizarse en un escenario acotado de Debug.

La descarga genera el JSON **completo**, conservando los demás eventos sin modificaciones. Para publicar, se debe sustituir `src/data/generator-messages.json` en GitHub y confirmar el commit manualmente. Las opciones de importación por archivo o texto permanecen para trabajar con versiones alternativas, pero no se necesitan para empezar con los eventos publicados.


## Reproductor y Vista adaptable (0.60.4)

Los videos de YouTube se cargan con `autoplay=1&mute=1&playsinline=1&enablejsapi=1` cuando abre la ventana. **El audio no inicia automáticamente**: el botón «Activar audio» envía las órdenes `setVolume(90)` y `unMute` sólo cuando el usuario lo selecciona; su funcionamiento también depende de que YouTube cargue correctamente y de las políticas del navegador. Se corrigió el ancho del modal para evitar desplazamientos horizontales.

En **Debug → Vista adaptable** se puede elegir **Debug completo**, seleccionar una experiencia visual y simularla a anchos de 320 a 1280 px. Están incluidos graduación, mensajes, editor de eventos, efemérides, notificaciones, campana, avisos, PDF y cámara. Los controles dentro del iframe son interactivos. La graduación puede ensayarse en cualquier momento, independientemente de las fechas de publicación. Las simulaciones no modifican las bitácoras reales.

