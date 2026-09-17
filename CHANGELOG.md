# Notas de versión

## 0.49.0-beta.2 · Anti-fool upgrate · Parte 2

- Nombre y Blobatar en la barra de navegación superior, con menú compacto.
- Descargar PDF guarda automáticamente la bitácora validada en el historial; repetir la descarga actualiza el mismo registro.
- Bienvenida de primera visita con lenguaje juvenil y botones Ver tutorial / Saltar tutorial. La decisión se recuerda al completar o saltar el recorrido.


## 0.49.0-beta.1 · Anti-fool upgrate · Parte 2

- Registra la semana pide martes, entrada y salida; valida fecha y horario antes de generar o reemplazar jornadas.
- Markdown sigue encendido y puede desactivarse en Más opciones. La edición manual se conserva.
- Registros guardados y Respaldo de información son desplegables; guardar confirma con Sileo y los deja plegados.
- Sileo también cubre avisos breves del sistema. Las confirmaciones y recomendaciones extensas mantienen sus ventanas.
- Ventanas, créditos, cambios de paso y desplegables tienen transiciones breves, con respeto a movimiento reducido.
- Virtual Insanity conserva el audio, movimiento y créditos: se activa con jamiroquai, Virtual Insanity en el nombre o la frase en una actividad. Incluye botón para terminar; se conservan todos los disparadores de créditos.
- Perfil local con Blobatar: recuerda el nombre para nuevas bitácoras, permite cambiarlo u olvidarlo y no recuerda palabras de easter eggs como nombres.
- `shortName` opcional en escuelas y empresas para firmas, con nombre completo como respaldo.
- `instructorEnabledByDefault` por empresa, activo en COCYTIEG; abrir registros respeta la opción guardada.
- FAQ con lenguaje más directo y CONTRIBUTING con botones de edición, campos y ejemplos de cada JSON.


## 0.48.0-beta.2 · Anti-fool upgrate — corrección del rediseño

- Se recuperan el diseño de Beta 0.47, la FAQ, el tutorial guiado, los avisos, créditos e interacción Virtual Insanity.
- Vuelven los controles originales de jornadas, líneas disponibles, historial y responsables de TecNM.
- Se elimina la pantalla Catálogos: la configuración se edita en los JSON del repositorio.
- Sileo queda reservado a una importación de respaldo completada, con carga diferida.
- La vista previa agrupa cambios y evita dibujar cuando está oculta; la resolución del PDF no cambia.
- Se recuperan una sola vez el borrador y el historial de beta.1 sin borrar sus datos de origen.
- Importar conserva los registros actuales y valida el archivo antes de escribir. Regenerar jornadas con actividades pide confirmación.
- React conserva una frontera de compatibilidad con el controlador original. Se revierte la sustitución visual completa de beta.1.


## [0.48.0-beta.1] · Anti-fool upgrate · 2026-09-17

Continúa en beta. El nombre de esta actualización se conserva tal como fue solicitado.

### Añadido

- React + Vite en el generador y en las preguntas frecuentes.
- Editor local de escuelas, empresas, representantes, instructores, horarios, especialidades, semestres y grupos.
- Archivos JSON independientes para modificar los catálogos predeterminados.
- Sileo para notificaciones de acciones, advertencias y deshacer.
- Validación contextual de campos, fechas repetidas, semana de martes a viernes, horas inválidas y justificaciones.
- Respaldo versionado de historial, borrador y catálogos; importación aditiva con confirmación y tratamiento de colisiones de identificadores.
- Búsqueda en el historial y recuperación de eliminaciones mediante Deshacer.
- Recuperación de almacenamiento incompatible sin sobrescribirlo automáticamente.
- Service worker con caché por compilación, aviso de actualización y limpieza limitada a los recursos de la aplicación.
- Pruebas automatizadas y verificación en pull requests antes del despliegue.
- Ruta de mantenimiento `qa/responsive.html` para revisar la aplicación real a 390, 768 y 1024 px.
- Documentación de arquitectura, datos, catálogos, validación y contribuciones.

### Mejorado

- Controles táctiles, campos de 16 px, diseño adaptable, espacios seguros de dispositivos móviles y vista previa ampliable.
- Ayuda por etapa disponible sin bloquear el formulario; navegación libre para corregir datos.
- Autoguardado con aviso de fallo, guardado al ocultar/cerrar la página y migración de las claves de la beta 0.47.
- Cambiar empresa conserva las jornadas existentes y avisa que sus horarios deben revisarse.
- Cambiar semana pide confirmación si existen actividades. Abrir otra bitácora o iniciar una nueva conserva el borrador anterior en el historial.
- Los nombres legales cortos producen una sugerencia, sin bloquearlos.
- Ajuste del ancho de encabezados y nombres en PDF; las palabras largas se dividen dentro de la celda. Se impide exportar cargos que rebasan el espacio de firmas.
- Compilación con recursos de nombre único para evitar versiones antiguas mezcladas.

### Conservado

- Encabezado, A4 horizontal, cuatro jornadas, Markdown básico, firmas y recomendaciones de entrega.
- Empresas, autoridades e instructores precargados, incluidos los del TecNM.
- Ejemplos y contenido académico del FAQ.
- Créditos, foto, enlace de GitHub, frase y nombres ocultos, incluido `uwu`.
- Referencia de Virtual Insanity y audio disponible por activación manual, respetando las preferencias de movimiento. La antigua animación que desplazaba toda la página se sustituye por un panel accesible.

### Cambios de funcionamiento

- La ayuda de primera visita pasa de superposiciones que recorrían la pantalla a instrucciones junto a cada etapa.
- Ya no se inserta una bitácora personal de ejemplo en historiales nuevos. Los historiales anteriores se recuperan.
- El texto que excede el espacio no se elimina ni se rechaza al escribir: se conserva y se bloquea la descarga hasta corregirlo.
- GitHub Pages requiere compilar; abrir `index.html` como archivo ya no ejecuta el programa. Para trabajar localmente usa `npm run dev`.
- Los catálogos locales no se publican ni se sincronizan automáticamente.

## Beta 0.47 y anteriores

La versión anterior contenía el generador en un solo HTML. Incluía el asistente, tutorial guiado, FAQ, catálogo TecNM, horarios por empresa, borrador automático, firmas autógrafas y PDF de una página.

Se conserva el [historial de notas anteriores](docs/release-history.html). El código previo permanece en el historial de Git.
