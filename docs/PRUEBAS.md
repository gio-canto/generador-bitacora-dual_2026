# Verificación

Ejecuta `npm run check`.

La suite incluye generación de fechas y validación de registros, importación, PDF, recuperación de beta.1 y una regresión de la interfaz restaurada: controles originales, responsables de TecNM, generación de martes a viernes, límite de cuatro días y persistencia del borrador. También cubre el esquema del registro de entrega, migraciones, estados por hora límite, resumen semanal y el Data Matrix con nombre, especialidad, empresa y periodo, incluida la selección automática de semana.

La prueba del servicio PDF extraído cubre su formato; el generador restaurado conserva su motor original dentro de `src/legacy/editor.js`. Una prueba de ese servicio por sí sola no acredita toda la entrega del navegador.

## Revisión manual

- Abrir el generador con datos anteriores y comprobar el borrador.
- Revisar en 390, 768 y 1024 px, incluyendo diálogos, último paso y FAQ.
- Completar el tutorial y probar estados especiales.
- Generar un PDF y revisar formato, logotipo, firmas y las cuatro jornadas.
- Importar un respaldo: confirmar que conserva los registros actuales y muestra un único aviso Sileo.
- Activar una actualización y comprobar que no pierde el borrador.
- Abrir `/registro-entrega/`, crear plantel, alumnos y semana, cerrar/reabrir y exportar JSON/CSV.
- Generar una bitácora y comprobar que el Data Matrix puede leerse y corresponde a nombre + especialidad + empresa + fecha inicial + fecha final.
- Crear dos semanas y escanear bitácoras de ambas en la misma sesión: cada lectura debe aparecer con su semana correcta.
- Escanear una bitácora después de la fecha/hora límite y comprobar que queda como Entregado a destiempo.
- Probar una foto o captura con Leer imagen para separar problemas de enfoque de problemas de decodificación.
- En iPhone/iPad, entrar al escáner y confirmar que la cámara **no** se abre sola; tocar Activar cámara y aceptar el permiso.
- Bloquear el dispositivo o cambiar de app con la cámara activa; al volver, confirmar que el stream quedó detenido y que Reintentar/Activar cámara abre uno nuevo.
- Probar Safari en vertical y horizontal, verificando safe areas, controles inferiores y que ningún input provoque zoom por tipografía menor de 16 px.
- Abrir el tutorial durante una sesión de cámara y comprobar que no se agregan lecturas hasta cerrarlo.
- Revisar los estados del HUD: LECTOR ACTIVO, REGISTRADO, REPETIDO y NO COINCIDE.

`qa/responsive.html` permite revisar generador y FAQ en esos anchos; no es parte de la navegación del usuario.

## Anti-fool upgrate · Parte 2

26 pruebas automatizadas pasan. Cubren martes y horarios, cambio de año, nombres cortos, perfil local sin palabras secretas, configuración del instructor, controles plegados y salida de Virtual Insanity hacia los créditos. Se comprobó en el navegador publicado el perfil Blobatar, guardado con Sileo, campos de semana, créditos e instructor automático. La revisión en 390 px detectó y corrigió un desbordamiento del checkbox invisible del interruptor de instructor.


## Registro de entrega · Serie 0.50

La verificación de la serie 0.50 debe ejecutarse en la página independiente y no sólo en el generador. En CI, `npm test` y `npm run build` deben pasar antes de publicar. La construcción de producción incluye `registro-entrega/index.html` y el service worker incorpora esa página al conjunto versionado.


## Códigos de error del escáner · Beta 0.50.0-beta.9

Durante pruebas en iPhone/iPad, si aparece un error, registrar primero el código visible y usar **Copiar diagnóstico**. Como mínimo deben distinguirse:

- `CAM-003`: permiso denegado.
- `VID-102`: stream obtenido pero sin fotogramas utilizables.
- `ZX-201`: ZXing no pudo cargarse.
- `ZX-203`: ZXing cargó pero no se pudo construir el lector.
- `ZX-204`: el lector se creó pero `scan()` no pudo iniciar.
- `ZX-205`: fallo fatal durante el ciclo de lectura.
- `BD-206`: BarcodeDetector existe pero no soporta Data Matrix.
- `IMG-301`: fallo leyendo una fotografía.

El texto copiado debe incluir versión, código, etapa, estado del stream/video y disponibilidad de los lectores, pero nunca el contenido del Data Matrix ni el `deviceId` real.


## Regresión ZX-205 · Beta 0.50.0-beta.10

- Confirmar que apuntar la cámara a una superficie sin código no muestra ZX-205.
- Confirmar que `NotFoundException`, Checksum y Format se tratan como intentos normales.
- Simular un error transitorio de frame y comprobar que no aparece un aviso inmediato.
- Confirmar que sólo después de errores repetidos de captura aparece ZX-207.
- Confirmar que ZX-205 requiere varios errores fatales consecutivos.
- En iPhone pequeño, verificar que Salir / Foto / Terminar caben en una sola fila, el error queda encima de la barra inferior y los detalles técnicos empiezan plegados.


## Estados, filtros y agrupación · Beta 0.50.0-beta.11

- Cambiar manualmente un alumno entre Entregado a tiempo, Entregado a destiempo y No entregado.
- Comprobar que una selección manual conserva origen Manual y que No entregado elimina la entrega.
- Combinar filtro de estado + especialidad + empresa + búsqueda.
- Agrupar por especialidad y por empresa y revisar contadores.
- En iPhone, comprobar que los iconos de la barra superior permanecen visibles por debajo de 520 px.
- En la vista semanal móvil, comprobar que Semanas, CSV, Cerrar/Reabrir y Escanear muestran icono y no se superponen.


## Filtro de estado y chime · Beta 0.50.0-beta.12

- Seleccionar Todos, Entregados a tiempo, A destiempo y No entregados desde el filtro Entrega.
- Confirmar que las tarjetas-resumen y el selector actualizan el mismo filtro.
- Combinar el estado con especialidad, empresa, búsqueda y agrupación.
- Escanear una entrega válida y comprobar que reproduce `asset_chime.mp3`.
- Confirmar que repetido y no coincide no reproducen el chime de éxito.
- Tras una primera carga, probar el registro con la caché del service worker y verificar que el chime sigue disponible.


## Reportes PDF · Beta 0.50.0-beta.13

- Configurar una generación dual y confirmar que persiste al recargar y al exportar/importar JSON.
- Generar un **Listado simplificado** de una semana con estados a tiempo, a destiempo y no entregado.
- Generar **Semana por semana** con al menos dos periodos y comprobar su orden cronológico.
- Revisar que cada fila muestre Blobatar, alumno, especialidad, empresa, estado y fecha/origen cuando exista.
- Confirmar que el PDF muestre plantel, generación, fecha de creación, versión, periodo, límite, resumen y numeración.
- Abrir el PDF en Safari/iPhone, Vista Previa/macOS o un lector equivalente y verificar que no existan recortes ni páginas vacías.
- Imprimir una página de prueba en A4 y comprobar legibilidad en escala 100%.


## Reporte global · Beta 0.50.0-beta.14

- Generar **Global de todas** con al menos dos alumnos y dos semanas.
- Confirmar que las semanas se ordenan cronológicamente aunque hayan sido creadas en otro orden.
- Verificar que cada fila conserva mini Blobatar, nombre, especialidad y empresa.
- Comprobar la leyenda ✓ A tiempo, ! A destiempo y × No entregado.
- Probar más de 15 semanas para revisar la división horizontal.
- Probar más de 14 alumnos para revisar la división vertical y la numeración de páginas.
- Abrir e imprimir el PDF en A4 horizontal al 100%.


## Landing de presentación · Beta 0.50.0-beta.15

- Abrir `/presentacion/` y verificar hero, navegación y CTA al generador.
- Confirmar que `asset_landing.png` aparece en el hero y `Asset_cont_matrix.png` en la sección Data Matrix.
- Revisar las secciones de alumno, Vinculación, constancias, flujo, reportes e instituciones.
- Comprobar los enlaces a generador, Registro de entregas, FAQ, privacidad, accesibilidad, GitHub y contacto.
- Revisar 390, 430, 768, 1024 y 1440 px sin desbordamientos.
- Activar `prefers-reduced-motion` y confirmar que el contenido permanece visible sin animaciones.
- Después de una primera carga, comprobar que la landing y sus dos imágenes siguen disponibles desde el service worker.


## Landing editorial · Beta 0.50.0-beta.16

- Confirmar que `asset_landing.png` ocupa la primera pantalla y que el texto del hero aparece encima.
- Verificar las ventajas de alumno: teléfono/PC/iPad, historial local, menos errores y datos precargados.
- Verificar las ventajas de escuela: facilidad para el alumno, estandarización, protección del formato y control rápido.
- Revisar las rutas institucionales de GitHub/pull request y contacto con el creador.
- Confirmar las secciones de Privacidad y Open source y el CTA para dar estrella en GitHub.
- Revisar 390, 430, 768, 1024 y 1440 px sin solapamientos ni bloques decorativos innecesarios.


## Tiempos y autonomía · Beta 0.50.0-beta.17

- Verificar la sección de tiempos con reloj animado para Alumno y Escuela.
- Confirmar textos 10–20 min, ≈ 5 min, 1–1.5 h y menos de 10 min.
- Confirmar que la página aclara que son tiempos aproximados y no benchmark formal.
- Activar `prefers-reduced-motion` y revisar que los relojes queden estáticos.
- Confirmar que no aparezca el monograma B en la navegación.
- Verificar que Colaborar sea el CTA principal y apunte a `CONTRIBUTING.md`.
- Confirmar que la landing indique que alumnos y planteles pueden agregar escuela/empresa y enviar pull requests.
- Revisar iconos en botones y ventajas en 390, 430, 768, 1024 y 1440 px.


## React, iconos y movimiento · Beta 0.50.0-beta.18

- Confirmar que `/presentacion/` monta `src/presentation.jsx` mediante `createRoot`.
- Verificar iconos Phosphor en alumno, escuela, sistemas, Data Matrix, flujo, privacidad, open source y colaboración.
- Desplazarse por la página y comprobar la barra de progreso superior y el parallax suave del hero.
- Revisar hover de iconos, flechas y botones sin saltos de layout.
- Activar `prefers-reduced-motion` y comprobar que parallax, reloj, flecha animada y transiciones queden desactivados.
- Validar la landing en iPhone, iPad y escritorio sin pérdida de contenido o desbordamientos.
