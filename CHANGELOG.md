# Notas de versión

## 0.50.0-beta.5 · Registro de entrega · Parte 5 · 2026-09-28

Commit guía: `5f38e399`.

- El Subsistema de registro de entrega adopta **Sileo** para confirmaciones breves y conserva avisos dentro de la pantalla cuando requieren una acción del usuario.
- Los mensajes de archivo cargado, alumnos importados, altas, ediciones, eliminaciones, semanas, registros manuales y cierre de escaneo tienen jerarquía y redacción consistentes.
- El lector muestra estados visibles **LECTOR ACTIVO**, **REGISTRADO**, **REPETIDO** y **NO COINCIDE**, con iconos y estados visuales distintos.
- Los errores de cámara se muestran como avisos persistentes y dejan claro que el registro manual continúa disponible.
- El aviso **Nueva versión disponible** se rediseñó con título, texto secundario y el botón **Actualizar ahora**, también dentro de `/registro-entrega/`.
- Se conserva el diseño adaptable y el comportamiento con movimiento reducido.

## 0.50.0-beta.4 · Registro de entrega · Parte 4 · 2026-09-28

Commit guía: `b4900250`.

- El tutorial puede consultarse en cualquier momento como una ventana superpuesta, sin abandonar la semana, configuración o sesión actual.
- Durante el tutorial, el escáner ignora nuevas lecturas y reanuda el flujo al cerrarlo.
- El aviso de actualización del service worker funciona también desde la página independiente del registro.
- README incorpora acceso directo al Subsistema de registro de entrega.
- La FAQ explica qué es el Data Matrix, qué datos contiene, cómo funciona el registro, qué ocurre si cambian especialidad o empresa y por qué no debe taparse.
- El Data Matrix deja de identificar sólo por nombre: ahora codifica **nombre + especialidad + empresa** mediante un formato versionado.
- Los códigos anteriores que sólo contenían nombre siguen siendo compatibles cuando ese nombre no es ambiguo.
- Se aumentó la resolución de generación del Data Matrix y se mantuvo su renderizado sin suavizado para mejorar la lectura.

## 0.50.0-beta.3 · Registro de entrega · Parte 3 · 2026-09-28

Commit guía: `1617a67f`.

- La configuración general del registro se reduce al **plantel**.
- Especialidad y empresa pasan a ser datos individuales de cada alumno.
- El alta manual solicita nombre, especialidad y empresa.
- La importación Excel/CSV reconoce nombre, especialidad y empresa.
- Se elimina **Traer del generador** del alta inicial.
- Se simplifican bienvenida, tutorial y textos para reducir ruido visual.
- Los archivos del esquema anterior se migran conservando escuela, especialidad y empresa.
- La exportación CSV semanal incluye especialidad y empresa por alumno.

## 0.50.0-beta.2 · Registro de entrega · Parte 2 · 2026-09-28

Commit guía: `d9d03505`.

- `registro-entrega` pasa a ser una página independiente y deja de formar parte del menú principal del generador.
- Si todavía no existe una base o semana, la entrada muestra dos tarjetas: **Tutorial** e **Ingresar**.
- Se añade un tutorial interactivo por tarjetas y un flujo de configuración simplificado.
- Se corrige el Data Matrix en el renderizador que realmente genera el PDF del sistema heredado.
- La descarga del PDF se bloquea con un aviso si el identificador no pudo generarse.
- El cuadro industrial del lector compensa el recorte de la cámara para seguir mejor la posición real del Data Matrix.
- Se añaden resumen semanal, porcentaje de avance, filtros por estado, cierre/reapertura y exportación CSV.

## 0.50.0-beta.1 · Registro de entrega · Parte 1 · 2026-09-28

Commit guía: `13e3b214`.

- Se incorpora el primer **Subsistema de registro de entrega**.
- Base local de alumnos con Blobatar, alta manual e importación de XLSX/XLS/CSV.
- Semanas con fecha límite y estados automáticos **Entregado**, **Entregado a destiempo** y **No entregado**.
- Registro de fecha, hora y origen de cada entrega.
- Archivo portátil JSON y copia en almacenamiento local del navegador.
- Escaneo Data Matrix continuo para registrar varias bitácoras sin cerrar la cámara entre lecturas.
- Sonido de lectura, cuadro de detección y tratamiento de códigos desconocidos o repetidos.
- Cola de lecturas que se confirma al terminar la sesión.
- Primera integración del Data Matrix en la bitácora generada y pruebas automatizadas del registro.

## 0.49.0-beta.3 · Anti-fool upgrade · Parte 3

- La sección de firma del alumno se despliega automáticamente sólo la primera vez; después del primer guardado queda plegada y conserva en caché si la firma genérica quedó activada o desactivada.
- El perfil del avatar también recuerda empresa, responsable que autoriza, instructor formador y preferencias recurrentes; el contenido de las jornadas queda fuera del perfil.
- El menú del perfil se simplificó en secciones de Escuela, Dual y Preferencias, con un editor compacto integrado al diseño existente.
- El perfil local del avatar ahora también guarda y permite editar plantel, especialidad, semestre o grado, grupo, horario y área común como información predeterminada.
- Los valores personales de horario y área tienen prioridad al crear nuevas jornadas; cuando no existen, se conservan los presets de cada empresa.
- La ampliación mantiene `bitacora_profile_v1`, conserva perfiles anteriores que sólo tenían nombre y no modifica los registros guardados.
- Nueva opción en **Revisión y PDF** para agregar una firma genérica del alumno cuando todavía no tenga una firma definida.
- La firma usa únicamente el nombre del estudiante y se renderiza en azul tipo tinta; no genera firmas para Vinculación, asesor, empresa ni instructor.
- La preferencia se guarda con el borrador y con cada registro, y aparece tanto en la vista previa como en el PDF.
- Avisos de entrega actualizados para recordar que la firma genérica debe ser aceptada por el plantel o la empresa cuando exista un requisito de firma autógrafa.
- Pruebas automatizadas para la interfaz, persistencia y cambio de render del PDF.

## 0.49.0-beta.2 · Anti-fool upgrate · Parte 2

- Corrector de español en actividades y justificaciones: sugerencias opcionales, una palabra a la vez, sin cambiar el texto automáticamente. Usa nspell en un trabajador separado; el diccionario se carga al pedir la revisión y queda disponible sin conexión tras su descarga.

- Nombre y Blobatar después de Descargar PDF, en una barra más ancha en escritorio. En móvil, logo y ayuda arriba; descarga y perfil juntos debajo, sin estirar la barra por nombres largos.
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
