# Notas de versión

## 0.50.0-beta.33 · Efemérides de octubre corregidas · 2026-09-29

- Se eliminan por completo las efemérides del **1 y 2 de octubre**.
- Esas fechas dejan de asociarse al Modelo Mexicano de Formación Dual y dejan de calcular o mostrar aniversarios.
- **31 de octubre** conserva su easter egg de Halloween.
- Se añade una prueba de regresión que exige que el 1 y 2 de octubre no activen ninguna efeméride.
- El resto del calendario y los aniversarios automáticos permanecen sin cambios.
- Se corrige la limpieza del root React del perfil al desmontar la aplicación, evitando errores residuales de CI sin modificar la interfaz ni los datos.

## 0.50.0-beta.32 · Aniversarios automáticos · 2026-09-29

- Enero deja de depender de un año escrito manualmente: **“Nuevo año, nueva bitácora”** muestra siempre el año correspondiente al calendario actual.
- Las efemérides con año histórico calculan automáticamente cuántos años han transcurrido y muestran una insignia como **“58.º aniversario”**.
- El cálculo automático se aplica a las relaciones México-Alemania de **1879**, la **BBiG de 1969**, la Independencia de México de **1810**, las efemérides del Modelo Mexicano de Formación Dual de **2013** y la Revolución Mexicana de **1910**.
- El número cambia por sí solo cada año sin requerir modificaciones en el código ni en los textos.
- Se amplían las pruebas para comprobar el cambio automático entre años consecutivos y los números de aniversario.

## 0.50.0-beta.31 · Efemérides y temporadas · 2026-09-29

- Se añade un motor independiente de efemérides, separado del easter egg **Virtual Insanity**, para mantener la lógica de fechas aislada del editor.
- **Enero** muestra durante todo el mes el detalle discreto **“Nuevo año, nueva bitácora”** con el año calculado automáticamente; el **1 de enero** añade una transición especial del año anterior al nuevo.
- **Diciembre** conserva durante todo el mes una ambientación ligera con pocos copos decorativos; el **24 de diciembre** y el **25 de diciembre** añaden intervenciones propias de Nochebuena y Navidad.
- Se incorporan efemérides para **23 de enero**, **15 de mayo**, **1 y 16 de septiembre**, **1 y 2 de octubre**, **31 de octubre** y **20 de noviembre**.
- Las fechas relacionadas con México y Alemania utilizan las banderas de México y Alemania indicadas desde Wikimedia Commons; los eventos de Formación Dual distinguen visualmente escuela, empresa, Betrieb y Berufsschule según el caso.
- **31 de octubre** se reserva para Halloween.
- Las fechas se calculan expresamente en la zona **America/Mexico_City**, evitando que el cambio de día dependa de la zona horaria del dispositivo.
- Las intervenciones grandes sólo se muestran una vez por fecha en el navegador mediante almacenamiento local; las ambientaciones mensuales permanecen mientras corresponda.
- Los efectos no usan audio, no interfieren con escritura, guardado o PDF y respetan `prefers-reduced-motion`.
- Se añaden pruebas para enero, diciembre, las efemérides puntuales, la zona horaria y las banderas configuradas.

## 0.50.0-beta.30 · Diccionario técnico e institucional · 2026-09-29

- El corrector ortográfico amplía `dictionary-es` con un diccionario propio del proyecto.
- Las palabras de `schools.json` y `companies.json` se incorporan automáticamente, incluyendo nombres de instituciones, empresas, responsables, instructores, cargos, abreviaturas y especialidades.
- Las futuras escuelas o empresas añadidas a los catálogos pasan automáticamente al vocabulario del corrector sin mantener una segunda lista manual.
- Se incorpora vocabulario frecuente de **programación y desarrollo web**, **bases de datos y nube**, **IA y ciencia de datos**, **ciberseguridad y redes**, **contabilidad y finanzas**, **Recursos Humanos**, **e-commerce, ventas y marketing digital**, **diseño/UI-UX**, **gestión de proyectos**, **ofimática** y **Educación Dual**.
- El diccionario técnico acepta términos como React, TypeScript, Docker, PostgreSQL, GitHub, onboarding, ecommerce, chatbot, dataset, Shopify, Data Matrix y terminología institucional del proyecto.
- El vocabulario adicional no sustituye el diccionario español: el corrector sigue detectando faltas comunes fuera de las palabras explícitamente aceptadas.
- Se añaden pruebas para comprobar términos institucionales, vocabulario técnico, deduplicación y detección de faltas reales.

## 0.50.0-beta.29 · Estado No aplica · 2026-09-29

- El Registro de entrega incorpora el cuarto estado **No aplica** para alumnos que no tienen obligación de entregar una bitácora en un periodo determinado.
- **No aplica** se guarda por alumno y semana como un estado real y persiste al cerrar, recargar, exportar o importar el registro.
- El esquema local del registro sube a **v6** y conserva migración automática desde v5 y versiones anteriores.
- El porcentaje de avance excluye a los alumnos marcados como **No aplica**: el cumplimiento se calcula únicamente sobre quienes debían entregar esa semana.
- La vista semanal incorpora contador, filtro y selector manual para **No aplica**.
- El CSV distingue **No aplica** de **No entregado**.
- Los reportes PDF simplificados y semana por semana muestran una cuarta categoría **No aplica**.
- La matriz global representa **No aplica** con un estado neutro separado de entrega, atraso y falta de entrega.
- Se actualizan pruebas de dominio, migración y reportes para comprobar persistencia y cálculo del nuevo estado.

## 0.50.0-beta.28 · Localización alemana contextual · 2026-09-29

- La versión alemana de la landing deja de traducir literalmente **Educación Dual** y adopta terminología propia del sistema alemán de **duale Berufsausbildung**.
- **Bitácora** se contextualiza como **Ausbildungsnachweis (Berichtsheft)**, término utilizado en la formación profesional dual alemana para documentar las actividades de aprendizaje y trabajo.
- **Alumno** pasa a **Auszubildende** y se ajustan referencias a **Ausbildungsbetrieb**, **Berufsschule**, **Ausbilderinnen und Ausbilder** y **Ausbildungskoordination** según el contexto.
- Se revisan hero, ventajas, tiempos, testimonios, sistemas, Data Matrix, flujo, instituciones, privacidad y CTA para evitar una traducción palabra por palabra del contexto mexicano.
- La atribución de Wuendy G. aclara que participa en el modelo dual mexicano, para no presentarla erróneamente como aprendiz del sistema alemán.
- El aviso de idioma alemán aclara que la landing usa terminología alemana contextual, mientras que las aplicaciones operativas siguen en español y responden al contexto de uso mexicano.
- Las pruebas de la landing verifican ahora la presencia de **duale Berufsausbildung**, **Ausbildungsnachweis**, **Berichtsheft** y **Auszubildende**.

## 0.50.0-beta.27 · Landing multilingüe · 2026-09-29

- La landing de `/presentacion/` incorpora versiones completas en **español, inglés y alemán** mediante un selector **ES / EN / DE**.
- El idioma seleccionado se conserva en la URL con `?lang=en` o `?lang=de`, de modo que una versión traducida puede compartirse directamente; español permanece como idioma predeterminado.
- La traducción se limita deliberadamente a la landing. El generador, el registro de entregas y el resto de los sistemas continúan en español.
- Al intentar abrir el generador o el registro de entregas desde las versiones inglesa o alemana, aparece un aviso previo que explica que el sistema completo está en español y permite quedarse en la landing o continuar.
- El selector actualiza también el atributo `lang` del documento y el título de la página.
- El testimonio de **Wuendy G.** reemplaza el monograma por un **Blobatar** determinista generado a partir de su nombre.
- En inglés y alemán, el testimonio se muestra traducido y se indica expresamente que es una traducción del español.
- Se amplían las pruebas de la landing para cubrir idiomas, parámetros de URL, aviso previo y Blobatar.

## 0.50.0-beta.26 · Opiniones de estudiantes · 2026-09-29

- La landing de `/presentacion/` incorpora una nueva sección **Lo que dicen quienes lo usan**.
- La sección se ubica después de la comparación de tiempos para conectar los beneficios explicados con experiencias reales de uso.
- Se añade como primer testimonio la opinión de **Wuendy G.**, alumna del Sistema Dual del **CBTis 134**.
- El testimonio conserva el sentido de la frase original y corrige únicamente redacción y ortografía para su publicación.
- La presentación usa una composición editorial amplia, con atribución clara de nombre, rol e institución, sin calificaciones artificiales ni elementos de reseña inventados.
- La navegación incorpora un acceso directo a **Opiniones**.
- La estructura queda preparada para añadir nuevos testimonios mediante datos reutilizables.
- Se amplía la prueba automatizada de la landing para verificar la presencia de la sección y su atribución.

## 0.50.0-beta.25 · Historial en barra y retorno al PDF · 2026-09-29

- **Bitácoras anteriores** se mueve de la portada a la barra superior para estar disponible sin competir visualmente con el contenido principal.
- El acceso funciona como un menú compacto; en móvil reduce su etiqueta a **Anteriores** y mantiene el contador.
- La lista de semanas aparece como un desplegable flotante desde la barra superior.
- En la revisión de una bitácora guardada, la acción principal cambia de **Abrir para editar** a **Volver a descargar PDF**.
- Esa acción carga la bitácora seleccionada y lleva directamente al **paso 5 · Revisión y PDF**, sin recorrer los pasos 1 a 4.
- La revisión inicial sigue siendo de sólo lectura hasta que la persona elige explícitamente volver al PDF.
- La administración completa del paso 5 conserva las acciones para abrir, duplicar o eliminar registros.
- Se amplía la prueba de interfaz para comprobar la nueva ubicación y el salto directo al paso 5.

## 0.50.0-beta.24 · Acceso discreto al historial · 2026-09-29

- El acceso **Bitácoras anteriores** del inicio deja de mostrarse como una tarjeta ancha y pasa a presentarse como un control secundario compacto.
- En estado cerrado muestra únicamente icono, nombre, contador numérico y desplegable.
- La última semana guardada y la explicación del historial sólo aparecen después de abrir el control.
- El contenido desplegado conserva la consulta rápida de semanas anteriores y el visor de sólo lectura.
- Se mantiene el historial completo del paso 5 para las acciones de administración.
- Se ajusta la prueba de interfaz para verificar que el acceso inicia cerrado y mantiene un contador compacto.

## 0.50.0-beta.23 · Historial accesible desde el inicio · 2026-09-29

- Se agrega un acceso compacto **Bitácoras anteriores** directamente debajo del encabezado principal del generador.
- El bloque está disponible desde que se abre la aplicación, sin tener que avanzar hasta el paso 5.
- Muestra cuántas bitácoras están guardadas y cuál es la semana guardada más reciente.
- Al desplegarlo se pueden consultar todas las semanas conservadas en el navegador.
- Cada registro del acceso inicial incluye **Revisar**, que abre la vista de sólo lectura creada en beta.22.
- Consultar desde el inicio no modifica ni sustituye la bitácora o borrador que esté actualmente en edición.
- La administración completa —abrir para editar, duplicar o eliminar— se mantiene en Registros guardados del paso 5.
- Se reutiliza el mismo renderizador de registros para mantener sincronizados el acceso inicial y el historial de administración.
- Se amplía la prueba de interfaz para comprobar que el contador, la última semana y la consulta desde inicio se actualizan al guardar.
- Se actualizan README y documentación de datos y pruebas.

## 0.50.0-beta.22 · Revisión de bitácoras guardadas · 2026-09-29

- El generador normal incorpora una acción **Revisar** dentro de Registros guardados.
- La revisión abre una vista de sólo lectura y no reemplaza el borrador ni carga automáticamente la bitácora en el formulario.
- La vista muestra periodo, alumno, plantel, especialidad, semestre, grupo, empresa, jornadas, estados, horarios, áreas, actividades y responsables.
- También indica si la firma genérica del alumno estaba activada en ese registro.
- Desde la revisión se puede elegir **Abrir para editar** cuando sí se desea cargar la bitácora guardada en el formulario.
- La lista de registros ahora muestra también el nombre del alumno para distinguir mejor semanas similares.
- Se añade una prueba automatizada que confirma que revisar una bitácora guardada no modifica las jornadas del borrador actual.
- Se actualizan README, documentación de datos y matriz de pruebas para reflejar el nuevo flujo.

## 0.50.0-beta.21 · Documentación y adopción institucional · 2026-09-29

- Se reestructura el README para funcionar como portada real del repositorio: propósito, componentes, funciones, privacidad, desarrollo, estructura y rutas de documentación.
- Se crea `docs/README.md` como índice de documentación viva y se separa la documentación actual del historial acumulativo del CHANGELOG.
- Se añade `docs/IMPLEMENTAR_INSTITUCION.md` con una guía completa para incorporar otra escuela, configurar empresas o adaptar un formato institucional diferente.
- La guía distingue tres niveles de integración: catálogos, reglas/identidad institucional y adaptación completa del formato.
- Se documentan requisitos previos, campos institucionales, firmas, jornadas, PDF, Data Matrix, registro de entrega, pruebas, privacidad y criterios de aceptación.
- `docs/CATALOGOS.md` pasa a documentar formalmente los esquemas de escuelas y empresas, IDs estables, nombres cortos y límites de los datos publicados.
- `docs/ARQUITECTURA.md` se reescribe como descripción de la arquitectura actual, con capas, flujos, invariantes y reglas de compatibilidad.
- `docs/DATOS_Y_CACHE.md` se reorganiza por tipo de almacenamiento, respaldo, migración, Data Matrix y coincidencias aproximadas.
- `docs/PRUEBAS.md` se convierte en una matriz de verificación mantenible para generador, PDF, responsive, registro, escáner, catálogos, persistencia y Data Matrix.
- Se crea `docs/VERSIONADO.md`: todo cambio publicado en `main` debe incrementar versión, actualizar CHANGELOG, sincronizar archivos de versión, mantener documentación viva y ejecutar verificación.
- `CONTRIBUTING.md` incorpora flujo de ramas/PR, Definition of Done, reglas para cambios de formato y requisitos de documentación.
- `SECURITY.md` se amplía con alcance, reporte privado, datos que no deben publicarse y principios para dependencias y persistencia.
- La versión pública queda sincronizada como **0.50.0-beta.21**.

## 0.50.0-beta.20 · Registro de entrega · coincidencias aproximadas y edición · 2026-09-29

- El escáner mantiene primero la coincidencia exacta de nombre, especialidad y empresa.
- Cuando no existe coincidencia exacta, busca **posibles alumnos con diferencias pequeñas en el nombre** mediante distancia de edición.
- Las sugerencias nunca registran una entrega automáticamente: aparece una confirmación con el nombre encontrado y la persona debe indicar si corresponde al alumno.
- En Data Matrix v4 y v3, una sugerencia sólo se considera si especialidad y empresa siguen coincidiendo; esto reduce falsos positivos entre alumnos con nombres parecidos.
- La confirmación de una coincidencia se recuerda durante la sesión de escaneo para no preguntar de nuevo por el mismo código; un rechazo tiene un breve enfriamiento para evitar alertas repetidas mientras la cámara sigue viendo el mismo Data Matrix.
- Se añade acceso directo a **Editar alumno** desde la lista de una semana. La edición existente de Administrar base se conserva y usa el mismo formulario.
- Se agregan pruebas para el caso de una letra de diferencia y para impedir sugerencias cuando especialidad o empresa no corresponden.

## 0.50.0-beta.19 · Presentación del proyecto · Parte 5 · 2026-09-28

- Se corrige la carga de iconos de la landing: ahora se renderizan como **SVG inline dentro de React**, sin depender del componente visual de una librería externa en tiempo de ejecución.
- Se mantienen los iconos en botones, ventajas, sistemas, Data Matrix, flujo, privacidad, open source y colaboración.
- El nuevo componente local de iconos hereda `currentColor`, por lo que conserva correctamente los estados claros/oscuros y las animaciones CSS.
- La landing fuerza la activación del service worker pendiente cuando detecta una nueva versión, evitando quedarse atrapada mostrando una compilación anterior en caché.
- Al cambiar el controlador del service worker, la landing hace una única recarga para tomar los assets de la versión nueva.
- Se conservan React, parallax, progreso de scroll, relojes y microanimaciones con soporte para `prefers-reduced-motion`.

## 0.50.0-beta.18 · Presentación del proyecto · Parte 4 · 2026-09-28

- La landing de `/presentacion/` ahora se renderiza con **React 19** en lugar de HTML estático.
- Se aprovecha `@phosphor-icons/react` para incorporar iconografía consistente en ventajas, sistemas, flujo, Data Matrix, privacidad, colaboración y acciones.
- Se añaden microanimaciones discretas en iconos, flechas, botones y la imagen de ejemplo, sin volver a un diseño recargado.
- El hero incorpora un desplazamiento parallax muy suave controlado por scroll.
- La navegación incluye una barra de progreso de lectura de 2 px.
- Los relojes conservan su animación y la flecha de comparación añade un movimiento sutil.
- El flujo Crear → Entregar → Registrar → Reportar ahora muestra iconos específicos por paso.
- La sección institucional y los apartados de Privacidad/Open source incorporan iconos React reutilizables.
- Todas las animaciones respetan `prefers-reduced-motion`; en ese modo se desactivan parallax, relojes y microinteracciones.
- Se elimina el antiguo `src/presentation.js`; la lógica de animación, service worker y accesibilidad vive ahora en `src/presentation.jsx`.

## 0.50.0-beta.17 · Presentación del proyecto · Parte 3 · 2026-09-28

- Se elimina el monograma **B** de la navegación y se simplifica la identidad visual de la landing.
- La acción principal pasa a ser **Colaborar**, tanto en la navegación como en los principales CTA del proyecto.
- Se añade una sección de comparación temporal con relojes animados:
  - Alumno sin el sistema: **10–20 min aprox.** por bitácora.
  - Alumno con el sistema: **≈ 5 min** con datos precargados.
  - Escuela con registro manual: **1–1.5 h aprox.** por jornada de recepción.
  - Escuela con registro automatizado: **menos de 10 min aprox.** con base preparada y escaneo.
- Los tiempos se presentan explícitamente como **aproximaciones orientativas**, no como benchmark formal ni garantía.
- Se refuerza la autonomía del proyecto: estudiantes, docentes y planteles pueden proponer su escuela, empresa, catálogos o mejoras directamente mediante ramas y pull requests.
- Se mantiene la posibilidad de solicitar apoyo al creador como ruta secundaria.
- Se incorporan iconos lineales discretos en acciones y ventajas, conservando el diseño editorial sobrio.
- El CTA de GitHub prioriza contribuir y deja **Dar estrella** como segunda acción de apoyo.
- Los relojes respetan `prefers-reduced-motion` y quedan estáticos cuando el usuario reduce animaciones.

## 0.50.0-beta.16 · Presentación del proyecto · Parte 2 · 2026-09-28

- La landing pasa a un diseño **image-first**: `asset_landing.png` ocupa el hero desde la primera pantalla y el mensaje aparece directamente sobre la imagen.
- Se elimina gran parte del tratamiento visual basado en tarjetas, brillos y degradados para usar una composición más editorial, sobria y cercana a una página de producto.
- La sección para alumnos destaca creación desde teléfono, PC o iPad, historial local, menor riesgo de errores y datos precargados para evitar repetir información cada semana.
- La sección para escuelas explica estandarización del formato, facilidad para el alumno, prevención de cambios accidentales y control más rápido de entregas.
- La incorporación institucional ofrece dos rutas: colaborar directamente en GitHub mediante ramas y pull requests, o solicitar apoyo al creador para adaptar el flujo del plantel.
- Se añaden secciones explícitas de **Privacidad** y **Open source**.
- Se incorpora un CTA para **dar una estrella al proyecto en GitHub**.
- La navegación, tipografía y espaciado móvil se simplifican para mantener una presentación clara en iPhone, iPad y escritorio.

## 0.50.0-beta.15 · Presentación del proyecto · Parte 1 · 2026-09-28

- Se crea la subpágina **/presentacion/** como landing pública del proyecto Bitácora Dual 2026.
- El hero usa `public/Assets/asset_landing.png` y el mensaje **“Nunca fue tan fácil hacer una bitácora.”**
- La página explica el beneficio tanto para alumnos como para Vinculación y presenta el generador, el Registro de entregas y el sistema complementario de gestión y emisión de constancias.
- Se incorpora una sección dedicada al **Data Matrix**, usando `public/Assets/Asset_cont_matrix.png` como ejemplo real de una bitácora identificada.
- Se muestra el flujo completo: generar, recibir, controlar y reportar.
- Se añade una sección específica **“¿Quieres que tu institución pueda usar este sistema?”** con un proceso de integración por plantel: revisar el procedimiento, configurar catálogos y responsables, probar con una generación y documentar el uso.
- El diseño es responsive, usa safe areas en móvil, animaciones discretas y respeta `prefers-reduced-motion`.
- La landing se incluye como entrada de Vite y queda precargada junto con sus imágenes en el service worker.

## 0.50.0-beta.14 · Registro de entrega · Parte 14 · 2026-09-28

- Se añade el modo **Global de todas** dentro de Reporte de entregas.
- El PDF global usa una tabla tipo control escolar: una fila por alumno y una columna por semana.
- Cada alumno conserva un **mini Blobatar**, nombre, especialidad y empresa en la primera columna.
- Cada semana muestra su número y fecha inicial, con símbolo visual por estado: ✓ Entregado a tiempo, ! Entregado a destiempo y × No entregado.
- El reporte global se genera en A4 horizontal para aprovechar mejor el ancho.
- Cuando existen más de 15 semanas o más de 14 alumnos, la matriz se divide automáticamente en varias páginas sin perder encabezado ni leyenda.
- El encabezado mantiene plantel, generación dual, fecha de creación, versión del sistema y numeración de páginas.

## 0.50.0-beta.13 · Registro de entrega · Parte 13 · 2026-09-28

- Se añade **Reporte de entregas en PDF** con diseño institucional, preparado para imprimir o archivar.
- El reporte ofrece dos modos: **Listado simplificado** de una semana seleccionada y **Semana por semana** con el historial completo.
- Cada alumno aparece con su **Blobatar**, nombre, especialidad, empresa, estado, fecha/hora de registro y origen de la entrega.
- El encabezado del PDF incluye plantel, **generación dual**, fecha de creación, versión del sistema, periodo, fecha límite y estado de la semana.
- Cada sección incluye resumen de **Entregado a tiempo**, **Entregado a destiempo** y **No entregado**, numeración de páginas y total de alumnos de la base.
- Se añade el campo **Generación dual** a la configuración del registro y al archivo portátil JSON.
- El almacenamiento del registro pasa a esquema v5 y migra automáticamente las bases anteriores.
- El reporte se genera completamente en el navegador y no envía datos a un servidor.

## 0.50.0-beta.12 · Registro de entrega · Parte 12 · 2026-09-28

- La barra de filtros añade un selector explícito de **Entrega** con: Todos, Entregados a tiempo, A destiempo y No entregados.
- El filtro de entrega se puede combinar con especialidad, empresa, búsqueda y agrupación.
- Las tarjetas-resumen de los tres estados siguen funcionando como accesos rápidos y permanecen sincronizadas con el mismo filtro.
- El sonido de una lectura válida deja de usar el tono sintetizado y utiliza `public/Assets/asset_chime.mp3`.
- Los avisos de repetido y no coincide conservan sonidos diferenciados para no confundirlos con una entrega aceptada.
- El chime se precarga al abrir el registro y se añade a la caché del service worker para que también esté disponible después de la primera carga.
- Los cuatro filtros se reorganizan como 4 columnas en escritorio, 2 × 2 en móvil intermedio y una sola columna en iPhone estrecho.

## 0.50.0-beta.11 · Registro de entrega · Parte 11 · 2026-09-28

- Los tres estados pueden fijarse también de forma manual por alumno: **Entregado a tiempo**, **Entregado a destiempo** y **No entregado**.
- El cambio manual es explícito y no depende de la hora límite; el escaneo por cámara conserva el cálculo automático a tiempo/destiempo.
- La lista de alumnos puede filtrarse por **especialidad** y por **empresa**, además del estado y la búsqueda por texto.
- Se añade agrupación visual de alumnos por **especialidad** o por **empresa**, con contador por grupo.
- El origen de un registro distingue Cámara, Manual e Importado.
- La navegación de la semana en teléfono conserva iconos visibles y adopta botones compactos para Semanas, CSV, Cerrar/Reabrir y Escanear.
- Se corrige una regla heredada que ocultaba los iconos de la barra superior por debajo de 520 px.
- Los controles de filtro y estado manual están adaptados a iPhone/iPad con selectores de 16 px para evitar zoom automático de Safari.

## 0.50.0-beta.10 · Registro de entrega · Parte 10 · 2026-09-28

- Se corrige el caso identificado como **ZX-205**: el primer error genérico del ciclo de lectura ya no se considera fatal.
- Se reemplaza el bucle interno `reader.scan()` de ZXing por un bucle controlado por la aplicación que usa `reader.decode(video)` y puede recuperarse de fallos transitorios de Safari.
- `NotFoundException`, `ChecksumException`, `FormatException` y mensajes equivalentes se tratan como intentos normales sin código detectado.
- Los errores de fotograma/canvas de iOS se reintentan varias veces antes de mostrar **ZX-207**.
- Un error no reconocido debe repetirse tres veces consecutivas antes de mostrarse como **ZX-205** y el lector continúa intentando recuperarse después del aviso.
- El diseño del escáner en iPhone/iPad se simplifica: cámara más grande, encabezado más corto, barra inferior de una sola fila con **Salir / Foto / Terminar**, resultados ocultos durante el escaneo y errores como tarjeta compacta sobre los controles.
- Los detalles técnicos del error quedan plegados por defecto para evitar saturar la pantalla pequeña.

## 0.50.0-beta.9 · Registro de entrega · Parte 9 · 2026-09-28

- El escáner incorpora **códigos de error estables** para identificar en qué etapa falla el flujo: cámara (`CAM-xxx`), vista de video (`VID-xxx`), lector ZXing/BarcodeDetector (`ZX-xxx` / `BD-xxx`) e imagen (`IMG-xxx`).
- Los errores muestran código, área, etapa, mensaje para el usuario y detalle técnico separado.
- Se añade **Copiar diagnóstico**, que genera un reporte con versión, código, etapa, estado de cámara, stream, dimensiones de video, disponibilidad de ZXing, lector Data Matrix, BarcodeDetector y navegador.
- El diagnóstico no copia el contenido del Data Matrix ni el identificador real del dispositivo; sólo indica si existe un `deviceId`.
- El sistema registra el mismo código en consola para facilitar pruebas remotas.
- Se mejora el reintento de carga de ZXing: si existe un script previo sin global disponible, se reemplaza y se vuelve a cargar desde jsDelivr o unpkg con eventos observables.
- El diagnóstico incluye qué fuente cargó ZXing.

## 0.50.0-beta.8 · Registro de entrega · Parte 8 · 2026-09-28

- Se corrige un fallo de iPhone/iPad donde un error del decodificador podía cerrar inmediatamente un stream de cámara que sí había abierto correctamente.
- El arranque de cámara y el arranque del lector Data Matrix quedan separados: primero se confirma la vista de cámara y después se inicia ZXing.
- Se corrige una condición de carrera de Safari con `loadedmetadata`: los listeners se registran antes de asignar `srcObject` y se acepta `loadedmetadata`, `canplay` o `playing`.
- Si ZXing no está disponible al cargar la página, el registro vuelve a intentar cargarlo dinámicamente desde jsDelivr y luego unpkg.
- Un fallo de ZXing ya no apaga la cámara; la vista permanece activa y se informa por separado que el lector no pudo iniciar.
- La lectura desde imagen usa el mismo mecanismo de recuperación de ZXing.
- Los mensajes distinguen ahora entre **no se pudo abrir la cámara** y **la cámara está activa, pero el lector falló**.

## 0.50.0-beta.7 · Registro de entrega · Parte 7 · 2026-09-28

- El escáner pasa a un flujo **mobile-first** pensado principalmente para iPhone, iPad y otros dispositivos táctiles.
- En iOS la cámara ya no se abre automáticamente al entrar al lector: se activa con un toque explícito en **Activar cámara**, de modo que Safari puede conceder el permiso dentro del gesto del usuario.
- ZXing deja de administrar la apertura de cámara en iOS: el sistema abre primero el stream con `getUserMedia` y ZXing sólo analiza el video ya activo.
- Se usan restricciones de cámara simples con preferencia por la cámara trasera y una segunda tentativa genérica si el dispositivo rechaza `facingMode`.
- Se eliminó la aplicación automática de constraints de enfoque que podía fallar con tracks terminados en Safari/iOS.
- Al enviar Safari al fondo, bloquear el iPhone/iPad o cambiar de app, el stream se detiene de forma segura y pide reactivación al volver.
- Los errores de permiso, cámara ocupada, cámara inexistente e interrupción reciben mensajes diferenciados y botón **Reintentar cámara**.
- **Leer imagen** usa `capture="environment"` en móviles para permitir fotografiar el Data Matrix directamente con la cámara trasera.
- El modo escáner adopta una vista dedicada en móvil: cámara más grande, controles inferiores fijos con safe areas, botones táctiles de 44–48 px y diseño adaptable para orientación vertical/horizontal.
- Los campos usan 16 px en móvil para evitar el zoom automático de Safari al enfocarlos.
- La barra superior se compacta en iPhone/iPad con controles por icono y respeta `safe-area-inset-*`.

## 0.50.0-beta.6 · Registro de entrega · Parte 6 · 2026-09-28

- Se corrige la lectura real del Data Matrix: el lector carga explícitamente el bundle UMD de ZXing Browser, reduce el intervalo entre intentos y solicita enfoque continuo cuando la cámara lo permite.
- El Data Matrix adopta un payload más corto para facilitar la lectura por cámara y aumenta su tamaño físico en el PDF.
- El identificador incluye **nombre + especialidad + empresa + fecha inicial + fecha final** de la bitácora.
- Cada semana del registro guarda ahora su fecha final; los registros anteriores se migran calculándola a partir de la fecha inicial.
- El escáner puede recibir bitácoras de **varias semanas en una sola sesión** y las clasifica automáticamente por el periodo codificado.
- La hora real del escaneo se compara con la fecha y hora límite de la semana identificada, por lo que una entrega antigua queda marcada automáticamente como **Entregado a destiempo**.
- Se permite escanear entregas hacia semanas cerradas para conservar la recepción extemporánea; las correcciones manuales siguen bloqueadas mientras la semana permanezca cerrada.
- Se añade **Leer imagen** como método alterno de prueba/lectura desde una foto o captura del Data Matrix.
- Los Data Matrix de versiones anteriores siguen funcionando: si no incluyen periodo, se asignan a la semana seleccionada.

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
