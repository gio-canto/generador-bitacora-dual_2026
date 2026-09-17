# Verificación de Beta 0.48

`npm run check` ejecuta las pruebas y compila el generador y el FAQ. El mismo proceso se ejecuta en GitHub Actions.

## Cobertura automatizada

- Generación martes–viernes, cruce de año y rechazo de fechas imposibles.
- Bitácora válida, horario invertido, fecha repetida y actividades incompletas.
- Justificaciones de ausencia y día inhábil; nombres legales cortos.
- Migración de historial y borrador Beta 0.47 conservando identificadores.
- Recuperación de datos dañados y tolerancia al almacenamiento bloqueado.
- Importación inválida, duplicados y colisiones de ID.
- Validación de catálogos y horarios.
- Recorrido React completo, corrección de errores y guardado en historial.
- Edición de catálogos y conservación de créditos con `uwu`.
- PDF A4 horizontal de una página, desbordamiento de actividades, cargos excesivos y palabras largas.

Las pruebas de componentes se ejecutan con jsdom; no sustituyen una revisión en Safari ni en dispositivos físicos. El motor PDF se prueba con canvas real y una salida visual renderizada. Los datos de las pruebas son ficticios.

## Matriz manual de mantenimiento

Antes de publicar cambios de interfaz, revisar:

| Contexto | Comprobación |
| --- | --- |
| Teléfono de 390 px | Sin desplazamiento horizontal del formulario; campos de 16 px y controles de 44 px |
| iPad, vertical y horizontal | Navegación y campos se reacomodan sin superponerse |
| Escritorio | Cinco etapas legibles, errores visibles y foco por teclado |
| Historial | Abrir, duplicar, eliminar y deshacer; búsqueda y respaldo |
| Catálogos | Alta y modificación de planteles, empresas y personas |
| PDF | Una página, sin texto cortado, firma y encabezado legibles |
| Actualización | Aviso de nueva compilación y borrador conservado |
| Sin conexión | Programa disponible tras instalar caché; datos intactos |

El menú nativo de compartir depende de la compatibilidad y permisos del navegador. Se debe verificar en un iPhone/iPad real antes de declarar soporte certificado para una versión concreta de iOS.

## Revisión adaptable sin herramientas externas

La ruta de mantenimiento `qa/responsive.html` carga la aplicación real en un marco de 390, 768 o 1024 px. Sirve para comprobar los puntos de adaptación del CSS y el FAQ. Comparte el almacenamiento de la aplicación; utiliza datos ficticios. No aparece en la navegación del alumno ni simula el motor de Safari.

## Resultado de la revisión de esta beta

- 22 pruebas automatizadas aprobadas localmente y en GitHub Actions.
- Compilación y despliegue en Pages completados.
- Revisión visual del sitio servido en escritorio y en marcos de 390 y 768 px. Sin desbordamiento horizontal del formulario: ancho útil/scroll 375/375 y 753/753 px (el marco reserva espacio para la barra de desplazamiento).
- Navegación, selección de empresa, historial anterior, importación aditiva y apertura de respaldo comprobados en el sitio publicado.
- Exportación ejecutada hasta el aviso de PDF listo. El navegador remoto no entregó el evento de descarga; la estructura de una página A4 y el renderizado del motor se verificaron por separado.
- Sin errores de aplicación en la consola durante estos recorridos. El entorno de revisión informó errores propios de su extensión.
- Safari y el menú de compartir de iOS siguen pendientes de prueba en un dispositivo físico.

Capturas de la aplicación real: [teléfono](revision-movil.jpg) y [tableta](revision-tableta.jpg).
