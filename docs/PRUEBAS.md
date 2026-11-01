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

