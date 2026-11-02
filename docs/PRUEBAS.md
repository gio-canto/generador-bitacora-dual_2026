# Pruebas y verificación

## Puerta mínima antes de publicar

Ejecuta:

```bash
npm run check
```

Ese comando debe completar:

1. `npm test`;
2. `npm run build`.

Un build exitoso no sustituye las pruebas manuales del PDF, cámara o impresión.

## Qué cubre la suite automatizada

La suite incluye pruebas sobre:

- dominio y validaciones;
- generación de fechas;
- almacenamiento y recuperación;
- perfil;
- importación;
- PDF;
- Data Matrix;
- registro de entrega;
- migraciones;
- estados de entrega;
- reportes;
- diagnóstico del escáner;
- regresiones de interfaz;
- detección de motivos, catálogos configurables y revisión de códigos «Otros» mediante `tests/v059-reason-classification.test.js`.

Cuando agregues una regla, agrega una prueba en el nivel más cercano a esa regla.

## Matriz de revisión manual

### Generador

- crear una bitácora desde cero;
- generar jornadas;
- estados Falta, Sin labores e Inhábil;
- en **Falta** y **Sin labores**, probar motivos frecuentes, edición libre del texto y confirmación antes de reemplazar una justificación personalizada;
- al modificar `src/data/absence-reasons.json` o `src/data/non-working-reasons.json`, comprobar IDs únicos, etiquetas/textos válidos y que el orden del selector coincida con el orden del catálogo;
- al pasar de **Falta** a **Sin labores**, comprobar que no se borre el texto anterior y que se solicite confirmación para sustituirlo con un motivo del nuevo estado;
- escribir citas, concursos, huracanes y festividades: comprobar el motivo detectado sin reemplazar la justificación;
- verificar una causa desconocida y una negación: deben permanecer en «Otro motivo» si no hay coincidencia confiable;
- seleccionar manualmente el motivo y modificar la justificación: conservar la clasificación elegida;
- confirmar que ninguna festividad clasifique por sí sola una jornada como **Día inhábil**;
- editar actividades;
- ejecutar el corrector con un término institucional y vocabulario técnico conocido; confirmar que no los marque como error y que siga detectando faltas reales;
- revisar contador/espacio;
- responsables e instructor;
- firma genérica;
- guardar, recargar y reabrir;
- consultar el historial desde la barra superior y comprobar contador/última semana;
- revisar un registro guardado sin reemplazar el borrador actual;
- desde la revisión, usar **Volver a descargar PDF** y comprobar el salto directo al paso 5;
- exportar/importar respaldo;
- descargar PDF.

### PDF

Revisa visualmente:

- tamaño y orientación;
- márgenes;
- logotipo;
- encabezado;
- cortes de texto;
- fechas;
- firmas;
- Data Matrix;
- ausencia de páginas vacías.

Cuando se cambie formato institucional, imprime al menos una prueba a escala 100 %.

### Responsive

Revisa como mínimo:

- 390 px;
- 430 px;
- 768 px;
- 1024 px;
- escritorio amplio.

En móvil verifica:

- objetivos táctiles;
- safe areas;
- inputs de al menos 16 px donde Safari podría hacer zoom;
- ausencia de desbordamiento horizontal;
- orientación vertical y horizontal.

### Accesibilidad

- teclado;
- foco visible;
- etiquetas accesibles;
- contraste;
- `prefers-reduced-motion`;
- acciones críticas comprensibles sin depender sólo de color.

## Registro de entrega

Prueba:

- crear plantel/base;
- alta y edición de alumnos;
- marcar un alumno como **Desistido de Dual**, comprobar que conserva entregas históricas, desaparece de semanas sin registro, no reduce el cumplimiento y puede reactivarse;
- **Eliminar definitivamente** y comprobar que sólo esta acción borra también sus entregas históricas;
- importación de Excel/CSV;
- crear semana;
- seleccionar una semana existente, editar su fecha límite y comprobar la reclasificación de entregas hechas por cámara sin alterar correcciones manuales ni **No aplica**;
- cerrar/reabrir;
- estado manual en **Entregado a tiempo**, **Entregado a destiempo**, **No entregado** y **No aplica**;
- comprobar que **No aplica** se conserva al recargar/importar y no reduce el porcentaje de cumplimiento;
- filtros y agrupación;
- JSON;
- CSV;
- tres tipos de reporte PDF;
- campanita con contador de casos «Otro motivo» y recordatorio de respaldo cuando aplica;
- revisión por alumno, semana y día, comparando siempre con la bitácora real antes de decidir;
- **Conservar como Otro motivo** debe retirarlo de pendientes sin convertirlo en una causa específica;
- **Guardar clasificación** debe actualizar solo el código/ID de esa jornada, sin alterar horas ni fecha de entrega;
- reabrir Registro Dual, exportar/importar JSON y verificar que se mantienen las revisiones;
- probar un código anterior sin bloque estadístico: no asignar causas inventadas.

### Escáner

Prueba al menos:

1. código válido;
2. repetido;
3. desconocido;
4. código de otra semana;
5. entrega posterior al límite;
6. lectura desde imagen;
7. cámara en teléfono;
8. salir y volver;
9. bloquear dispositivo/cambiar de app;
10. errores de cámara y diagnóstico.

### Coincidencia aproximada

Cubre al menos:

- una letra extra;
- una letra faltante;
- una sustitución pequeña;
- nombre suficientemente distinto: no sugerir;
- nombre parecido con especialidad diferente: no sugerir en payload actual;
- nombre parecido con empresa diferente: no sugerir;
- mostrar el **modal visual del sistema** en lugar de una confirmación nativa del navegador;
- comprobar que el modal muestre nombre leído, candidato, especialidad/empresa y porcentaje aproximado de similitud;
- rechazo de candidato y avance a la siguiente sugerencia cuando exista;
- confirmación de candidato mediante **Sí, registrar**;
- mientras el modal esté abierto, una nueva lectura de cámara no debe abrir otra confirmación;
- una coincidencia confirmada no debe requerir confirmación repetida durante la misma sesión.

La coincidencia exacta siempre tiene prioridad.

## Cambios de palabras clave y motivos

- Validar códigos únicos y estables (1–62) dentro de cada catálogo; el `63` queda reservado para «Otro motivo».
- Verificar que `keywords` contiene frases específicas, sin duplicados ni conceptos demasiado generales.
- Probar coincidencias con y sin acentos, mayúsculas, frases negadas, prioridades y dos posibles causas simultáneas.
- Comprobar que un motivo detectado para **Falta** nunca se obtiene consultando el catálogo de **Sin labores** y viceversa.
- Comprobar el bloque `BD26|4` + `S5:` al generar y decodificar, manteniendo los códigos anteriores.
- Revisar manualmente las causas que no tengan coincidencia y el funcionamiento de la campanita en móvil (390/430 px) y escritorio.

## Ajustes visuales y editor guiado (0.60.1)

- Verificar barra superior de Registro Dual y navegación inferior móvil, contraste y espacios seguros (390, 430, 768, 1024 px), sin alterar la estructura de escritorio.
- Comprobar que la primera vista móvil del generador sea Inicio aun con borradores previos y que el cambio de ancho active la vista adecuada sin duplicar campos.
- Confirmar que el botón de cambio a Vista móvil y el selector de presentación se eliminaron.
- Verificar editor Debug de cinco pasos, opciones de destinatarios, importación/exportación, reproducción de video y prueba de los tres tonos con y sin permiso de audio.
- Revisar reproducción de YouTube automática silenciada o bloqueo permitido por navegador, y que el cierre detenga el iframe.
- Probar movimiento reducido y transparencia reducida.

## Mensajes, campanita y Debug (0.60)

- Validar el JSON antes de exportar: identificadores únicos, tipos de activación, fechas, destinatarios, enlaces HTTPS, IDs de YouTube y botón de cierre.
- Probar pestaña, ventana mediana y pantalla completa en móvil y escritorio; cierre por botón y Escape, foco y ausencia de superposición con diálogos actuales.
- Simular fechas exactas, fechas anuales y periodos; cruzar planteles y especialidades.
- Confirmar que un anuncio visto no se abre de nuevo con frecuencia `once`, y que un incremento de `revision` permite mostrarlo.
- Verificar que **última bitácora** sólo se emite después de un PDF generado con éxito y que no cambia el documento ni los datos.
- Revisar que los nuevos motivos de fumigación, suspensiones, eventos y ausencia de responsables se reconocen sin alterar códigos anteriores.
- En Registro Dual, comprobar fechas vencidas y próximas, sin datos, faltas recurrentes, hitos y respaldo; filtros, navegación y que al resolver un problema desaparezca el aviso.
- Comprobar audio activado/silenciado y que el bloqueo de reproducción automática no impida usar la bandeja.
- En Debug, importar archivo/texto, crear y editar, generar texto, exportar el JSON, mostrar mensajes y simular lectura sin modificar las preferencias reales.

## Cambios de catálogos

Para una escuela nueva:

- selector;
- especialidades;
- semestres;
- grupos;
- visto bueno;
- nombre corto;
- PDF.

Para una empresa:

- nombre y nombre corto;
- horario;
- área;
- representantes;
- instructores;
- estado por defecto del instructor.

## Cambios de persistencia

Toda migración debe probar:

- estado nuevo vacío;
- lectura del formato inmediatamente anterior;
- datos incompletos válidos;
- archivo dañado;
- campos adicionales;
- no perder identificadores sin necesidad.

## Cambios de Data Matrix

Toda nueva versión de payload debe probar:

- generación;
- parseo;
- identidad;
- periodo;
- compatibilidad anterior;
- código inválido;
- clasificación de semana;
- lectura física o desde captura.

## Códigos de error del escáner

Los diagnósticos se agrupan por capa:

- `CAM-xxx`: cámara/permisos/dispositivo;
- `VID-xxx`: video/frames;
- `ZX-xxx`: ZXing;
- `BD-xxx`: BarcodeDetector;
- `IMG-xxx`: imagen.

El diagnóstico copiado no debe incluir contenido real del Data Matrix ni el `deviceId` completo.

## Cambios de documentación

También deben revisarse:

- enlaces relativos;
- nombres de archivos;
- comandos;
- versión mostrada;
- ausencia de instrucciones obsoletas.

## CI

El workflow de GitHub ejecuta instalación, pruebas y build antes de publicar GitHub Pages.

En pushes a `main`, verifica además que un **commit obsoleto** detectado después de un push más reciente omita pruebas/build/deploy y no cancele la ejecución del SHA vigente.

Una ejecución verde confirma la suite automatizada y la compilación, no la validación institucional del contenido.

## Registro de evidencia

En un PR explica qué verificaste. No adjuntes bitácoras reales; usa datos sintéticos.

Consulta [../CONTRIBUTING.md](../CONTRIBUTING.md).

## Graduación, hitos 1,000/1,504 y avisos (0.60.2)

- Probar el 19–23 de julio de 2027 en CBTis 134: diseño activo durante los cinco días y video únicamente jueves 22 y viernes 23.
- Verificar que el mensaje se recuerde por día y vuelva en el segundo; fuera del rango o en otro plantel no debe mostrarse.
- Crear y probar graduaciones desde Debug: rango, días seleccionados, destinatarios, tema y exportación de JSON.
- Comprobar cálculo, vista por alumno y PDF con 480/840/1,000/1,504 horas; superar 1,504 no recorta ni bloquea horas.
- Omitir un aviso y verificar reaparición al pasar a otra semana o efectuar una captura; el informativo puede permanecer oculto.
- Confirmar que los avisos y graduaciones no modifiquen las bitácoras ni sus respaldos.

## Estudio de eventos en siete pasos (0.60.3)

- Confirmar que Debug inicia con todos los eventos del archivo `generator-messages.json`, sus textos, fechas, plantel y video originales.
- Modificar un único mensaje, exportar y comprobar que los demás se conservan idénticos, incluidos los desactivados.
- Verificar navegación por los siete pasos y controles visuales de plantel, especialidades, frecuencia, calendario exacto, rango y fechas múltiples.
- Probar directamente desde la lista los mensajes ya cargados, incluidos los desactivados, sin alterar la configuración original.
- Simular graduación del CBTis 134 el 22 y 23 de julio de 2027, el periodo visual del 19 al 23, y un perfil que no coincida.
- Marcar un aviso como visto en Debug y restablecer la simulación; verificar que el almacenamiento escolar no cambie.
- Descargar/copiar el JSON válido y comprobar que se indique la necesidad de hacer el commit manual.
- Revisar que el FAQ muestre la 0.60.3 y las versiones nuevas posteriores a la 0.50.45, conservando el historial antiguo.


## Reproductor y Debug adaptable (0.60.4)

- Verificar que la ventana de graduación no tenga barra de desplazamiento horizontal en 320, 390, 430, 768 y 1280 px.
- Comprobar que YouTube inicia sin audio y que «Activar audio» funciona tras un clic, hasta el volumen 90%, condicionado por el propio reproductor.
- Confirmar que el tema de graduación conserva encabezado, navegación inferior, botones, paneles y sus acciones, cambiando solamente la paleta.
- En Debug → Vista adaptable seleccionar Debug completo y abrir todos los escenarios: graduación, mensajes, editor, efemérides, notificaciones, campana, avisos, PDF y cámara.
- Probar que los simuladores funcionan dentro del marco en diversos anchos, sin bucles de iframes ni modificación de registros reales.

## Felicitaciones y graduación como efeméride (0.60.5)

- Comprobar que la última bitácora y la graduación usan el mismo ID de video, modo visual, bucle y atributos de audio, sin cambiar la programación de julio de 2027.
- Confirmar que la despedida general solamente se activa tras el PDF final y no se superpone al evento especial del CBTis 134 en días de felicitación.
- Comprobar `loop=1&playlist=YUC4FH3tSOk`, que el video termina al cerrar el aviso y que el botón «Activar audio» permanece.
- Comprobar solicitud de audio al 90 % al cargar; si el navegador lo impide, verificar recuperación de reproducción silenciada. Probar manualmente en Chrome, Safari y Firefox.
- Desde Debug → Efemérides probar 19, 22 y 23 de julio, abrir y cerrar video y desactivar el tema sin alterar datos escolares.


## Graduación global desde Efemérides (0.60.6)

- Comprobar que seleccionar una fecha dentro del periodo cambia los colores en toda la página Debug, sin una maqueta o panel independiente; las áreas siguen siendo funcionales.
- Verificar que las fechas se carguen desde el JSON y que al agregar una generación ficticia de otro plantel (incluso desactivada) pueda simularse sin cambios al código de la interfaz.
- En el primer día del periodo, mostrar sólo el tema; en un día de video, mostrar la felicitación y mantener el tema después de cerrarla.
- Usar «Limpiar visual» y confirmar que la página vuelve a su aspecto original, sin modificar registros ni memorias reales.
- Verificar que Vista adaptable no tenga una pestaña ni botón exclusivo de graduación, y que Debug completo → Efemérides permita probarlo.


## Graduación posterior al PDF final (0.60.7)

- Durante el periodo de graduación, confirmar que el tema visual aparece aunque el usuario aún no descargue el PDF; no abrir video al ingresar.
- Fuera de `videoDates`, el PDF final muestra la despedida general; dentro de las fechas, después de generar correctamente un PDF marcado como última bitácora, muestra únicamente la despedida de graduación.
- Repetir la descarga del PDF después de cerrar la felicitación y comprobar que no aparece la despedida general como sustituta.
- Probar otro plantel, día fuera de periodo y generación futura; comprobar límites, filtros y prioridad sin mensaje doble.
- En Debug → Efemérides, activar tema por fecha y pulsar «Simular entrega de última bitácora» para abrir el video sin afectar registros reales.
- Comprobar que el editor crea graduaciones con `showOn: "final-bitacora"`, permite cambiarlo y exporta el atributo en el JSON completo. Verificar que graduaciones históricas sin `showOn` conservan su comportamiento.


## Control de concurrencia de Pages (0.60.8)

El flujo `.github/workflows/pages.yml` usa un grupo de concurrencia común para ejecuciones de la misma referencia. Los pushes de `main` no deben generar despliegues simultáneos. Se conserva `cancel-in-progress: false` para no interrumpir una publicación activa.

Tras completar los tests y el build, se compara nuevamente `GITHUB_SHA` con `refs/heads/main`; sólo se publica un artefacto vigente. La salida `needs.build.outputs.publish` controla la ejecución del trabajo de despliegue. Los PR no publican.

Para verificar un fallo de GitHub Pages, se requiere el mensaje del paso exacto `Publicar` de la ejecución de `main`. El éxito del PR sólo valida tests y compilación. Si falla la configuración del sitio, los permisos del entorno `github-pages`, la disponibilidad del servicio o el paso de despliegue, debe consultarse su registro específico.


## Control de eventos v0.60.9

Se agregan las pruebas de `tests/v0609-events-cleanup.test.js`. En la revisión manual:

- Cambiar el perfil cuando haya un aviso pendiente; éste no debe mostrarse en el perfil nuevo.
- Generar una despedida y registrar otro evento antes de cerrarla; verificar que la lectura pertenece al perfil que la inició.
- Crear dos avisos idénticos para la misma fecha; verificar que sólo se abre el de mayor prioridad.
- Verificar que dos avisos diferentes en la misma fecha se conservan.
- Probar la graduación y la última bitácora sin duplicar despedidas.
- Revisar el historial antes y después de ver el mensaje de graduación.
- Confirmar que el PDF, las bitácoras, el calendario de efemérides y Registro Dual siguen sin cambios.

## Pruebas de la última bitácora (0.60.10)

Pruebas automáticas en `tests/v06010-final-pdf-flow.test.jsx`. Revisión manual necesaria:

- Móvil: marcar la última bitácora, pulsar PDF, comprobar que no se construye el PDF antes de cerrar la despedida y que la descarga se intenta después.
- Móvil sin YouTube: cerrar el mensaje con texto visible y continuar hasta descargar el PDF.
- Móvil sin mensaje elegible (ya visto o desactivado): generar PDF sin bloqueo.
- iOS Safari, Android Chrome y PWA: comprobar enlace «Guardar o abrir PDF» y «Compartir PDF» si está disponible; repetir cuando se bloqueen popups o permisos.
- Computadora: comprobar que descarga primero y muestra la despedida después sin diálogo de recomendaciones encima.
- PDF normal sin marcar última bitácora: debe conservar la descarga y las recomendaciones anteriores.
- Dos pulsaciones rápidas no deben generar dos PDFs ni dos despedidas.
- Error de Data Matrix o imagen JPEG: comprobar notificación y que la bitácora permanezca disponible para reintento.

## Pruebas v0.60.11.1 · Generación institucional por plantel

- El perfil de alumno no contiene campo ni selector de generación, en lectura, edición o al cambiar de perfil.
- Un perfil creado en 0.60.11 con un atributo heredado `generation` debe poder leerse y editarse sin perder nombre, escuela, semestre o empresa; al volver a guardar, se omite el atributo obsoleto.
- Para el CBTis 134 en las fechas de julio de 2027, la despedida especial debe seleccionarse por plantel y fechas, no por un dato del alumno.
- En otras escuelas, otras fechas o especialidades fuera del público destinatario, no debe activarse la graduación de ese plantel.
- Debug permite simular el periodo y la entrega final sin selector de generación; el nombre institucional se edita exclusivamente en el evento.
- Los eventos históricos con `audience.generations` pueden importarse sin imponer una coincidencia con el perfil; el filtro antiguo queda obsoleto.
- Confirmar que descarga final móvil/PC, firmas, Data Matrix, Registro Dual y mensajes generales no sufren regresiones.

## Pruebas v0.60.12 · Últimos pendientes

- Avisos PNG: los tres tamaños y temas siguen funcionando; un diseño sin fecha ni semanas no muestra datos inventados.
- Seleccionar un subconjunto de avisos guardados, descargar ZIP y comprobar que no incluye avisos no seleccionados; el límite de 25 es visible y no destruye la selección.
- Exportar varios avisos guardados con formatos/temas diferentes y verificar que cada PNG conserva su configuración independiente; los automáticos usan el formato general elegido en vista previa.
- Probar un texto demasiado largo en Debug y confirmar que aparece una razón de error, en lugar de descargar una imagen incompleta.
- Debug → Editor de eventos: simular evento desactivado, fuera de fecha, de otro plantel, de otra especialidad, sin disparador y ya visto; verificar los diagnósticos.
- Probar la vista adaptable en 390, 768 y 1280 px sin superposiciones. Mantener los mensajes emergentes y efemérides existentes; no modificar perfiles ni datos reales durante simulaciones.
- Comprobar que los PDF finales móvil/escritorio, estadística, respaldo y registro de semanas no se alteran.
