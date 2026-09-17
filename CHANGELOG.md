# Notas de versión

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
