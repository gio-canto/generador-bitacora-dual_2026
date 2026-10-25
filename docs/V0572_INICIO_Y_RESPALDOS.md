# Registro Dual v0.57.2 — Inicio, accesos rápidos y respaldo preventivo

> **Ajuste posterior de escritorio:** la nueva barra de controles rápidos se abre al pulsar «Menú» en vez de permanecer como una columna fija. La versión web recupera el diseño clásico, independiente del modo móvil. Más información en [Restauración de escritorio](V0572_ESCRITORIO.md).

> **Corrección visual móvil posterior:** `src/delivery-mobile-polish.css` resuelve títulos ocultos bajo la barra superior, contadores de semanas desbordados, cifras superpuestas en Inicio y encabezados duplicados en Datos. Los textos secundarios se abreviaron. La versión web de escritorio conserva su presentación clásica y los flujos de respaldo/captura no se modificaron.

## Alcance

Actualización exclusiva de **Registro de Bitácoras** (ruta `/registro-entrega/`). Mantiene Apple Native + Adaptive Pro y la base Apple Glass de v0.57.1. No cambia el generador de documentos, los archivos PDF o PNG, el esquema local, ni la lógica de bitácoras, Data Matrix y estadísticas.

## Inicio corregido

- **Tres tarjetas del mismo lenguaje visual:** alumnos activos, semanas registradas y entregas de la última semana (`registradas/aplicables`). En móvil se presentan dos tarjetas pequeñas y una de ancho completo; en escritorio, tres columnas iguales.
- La **última semana** es el último elemento del historial, aunque el usuario esté consultando una semana antigua. «Abrir entregas» selecciona precisamente esa última semana y evita abrir un periodo equivocado.
- El historial de Inicio muestra **hasta tres semanas recientes**. El botón **Ver todas** abre Semanas, donde se conservan todos los periodos y su progreso.
- El hero móvil conserva la acción principal «Escanear bitácora». Se elimina la tarjeta de escaneo duplicada en Inicio. No se ocultan métricas ni acciones necesarias en pantallas pequeñas.

## Menú lateral de acciones rápidas

En escritorio con espacio suficiente (1200 px en adelante), hay un panel lateral fijo y desplazable con:

- **Navegación:** Inicio, Semanas, Datos, Avisos PNG.
- **Acciones:** Escanear bitácora (solo con semanas y alumnos activos), Nueva semana, Administrar alumnos, Reportes PDF, Ayuda y Guardar respaldo.

En móvil y pantallas más estrechas, el botón **Menú** de la cabecera abre el panel. Se cierra mediante **Cerrar barra lateral**, el fondo oscurecido, una opción de navegación o la tecla Escape. La barra inferior del teléfono continúa disponible; no se reescribe la lógica de navegación. Al escanear, se ocultan paneles superpuestos.

La hoja `src/delivery-quick-sidebar.css` administra los puntos de adaptación y la composición de Inicio. La lógica y los nombres accesibles están en `src/components/RegistryQuickSidebar.jsx`.

## Recordatorio de respaldo JSON

### Política

- Solo se considera cuando ya hay datos de alumnos, semanas o avisos.
- **Primera observación:** se almacena localmente la fecha de la primera sesión con datos. No se muestra ningún recordatorio antes de **24 horas**.
- Nunca interrumpe la captura: solo se presenta en **Inicio, Semanas o Herramientas**, no durante el escáner, formularios, tutoriales ni reportes.
- Si ha habido cambios en los últimos **30 minutos**, no muestra el aviso.
- Si se inició una descarga de respaldo, se registra la fecha de esa acción. No vuelve a recordarlo sin cambios posteriores y, aun cuando existan, deben transcurrir al menos **72 horas** desde la descarga.
- Entre dos recordatorios deben pasar al menos **72 horas**.
- **Recordar después** lo pospone por **48 horas**. El botón **Descargar respaldo** llama a la exportación JSON existente. Se muestra «Descarga iniciada», no se afirma que el archivo se almacenó correctamente fuera del navegador.
- No requiere permisos, notificaciones push, cuentas externas ni conexión a internet para verificar los metadatos. La comprobación se realiza al consultar las pantallas permitidas y aproximadamente una vez por hora si siguen abiertas.

### Persistencia y privacidad

Los metadatos (`firstSeenAt`, `lastBackupAt`, `lastPromptAt`, `snoozedUntil`) se conservan exclusivamente en `localStorage`, bajo `registro-dual-backup-reminder-v1`. **No se incluyen** en el archivo JSON exportado y no identifican a ningún alumno. No modifican `updatedAt` del registro. Si el almacenamiento de metadatos no está disponible, el registro continúa funcionando.

`src/services/backup-reminder.js` centraliza cálculos y almacenamiento; contiene pruebas de calendario y errores.

### Importación

Cargar un JSON existente se considera un respaldo previamente guardado. Tras importar se marca la fecha de la acción como respaldada para evitar un aviso injustificado inmediatamente después.

## Pruebas y QA

- `tests/v0572-backup-reminder.test.js`: recordatorio inicial, falta de registros, actividad reciente, ausencia de cambios tras una copia, espaciamiento, posponer y metadatos dañados.
- `tests/v0572-home-sidebar.test.jsx`: distribución del Inicio, recorte a tres semanas, navegación lateral en móvil, gestión y posponer un recordatorio.
- Pruebas anteriores de captura, informes, estadísticas, PWA y transformación móvil mantienen cobertura de regresión.

Revisar visualmente en Safari iOS, Chrome Android y escritorio de 320 a 1440 px. Las pruebas automatizadas no sustituyen una inspección real del diseño.

## Consideraciones

El respaldo se descarga con las funciones del navegador. La aplicación **no puede verificar** que el usuario haya movido el archivo a una carpeta segura o almacenamiento externo. Se recomienda conservar copias fuera del dispositivo y comprobar que puedan abrirse.

