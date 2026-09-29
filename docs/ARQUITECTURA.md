# Arquitectura

Sitio estático compilado con Vite. La corrección beta.2 restaura el HTML, CSS y los controladores de Beta 0.47. React monta una frontera estable en `App.jsx`; el controlador original administra su contenido. Es una capa de compatibilidad, **no una migración completa a componentes declarativos**. No se debe remontar esa frontera durante la sesión. Los cambios en desarrollo requieren recarga completa.

| Archivo | Responsabilidad |
| --- | --- |
| `src/legacy/shell.html` | Interfaz original, sin scripts ni datos introducidos por usuarios |
| `src/styles.css` | Estilos originales y ajustes pequeños de accesibilidad táctil |
| `src/legacy/editor.js` | Jornadas, presupuesto de líneas, historial, formulario y PDF |
| `src/legacy/guide.js` | Navegación, bienvenida, tutorial y créditos |
| `src/legacy/people.js` | Selector de responsables de TecNM |
| `src/legacy/signatures.js` | Sincronización del cargo de jefe inmediato |
| `src/legacy/easter-egg.js` | Interacción Virtual Insanity |
| `src/data/*.json` | Catálogos editados en el repositorio |
| `src/services/recover-original.js` | Recuperación de datos de beta.1 |
| `src/services/rare-notification.jsx` | Carga diferida de Sileo para acciones explícitas y avisos breves |
| `faq/index.html` | FAQ con buscador, ejemplos y notas de versión |
| `presentacion/index.html` | Landing pública de presentación del proyecto |
| `src/presentation.css` | Diseño responsive y visual de la landing |
| `src/presentation.js` | Animaciones discretas y registro del service worker en la landing |
| `registro-entrega/index.html` | Entrada independiente del Subsistema de registro de entrega |
| `src/components/DeliveryRegistry.jsx` | Flujo React del registro: configuración, alumnos, semanas, tutorial y escáner |
| `src/services/delivery-registry.js` | Esquema local, migraciones, Data Matrix, estados, JSON portátil y CSV |
| `src/delivery-registry.css` | Diseño y estados visuales del subsistema |

La vista previa espera 120 ms desde la última modificación y solo dibuja si su panel es visible. La exportación mantiene la resolución original de 11.81 píxeles/mm. Los ajustes del logotipo y etiquetas de firma se aplican dentro del motor, sin modificar prototipos globales de Canvas.

La prioridad de esta corrección es recuperar comportamiento e identidad visual. La extracción futura de componentes React debe hacerse por partes, con pruebas de equivalencia antes de sustituir los controladores originales.

## Parte 2

`src/components/Profile.jsx` monta un componente React independiente en la barra superior. Usa `blobatar/react` y `src/services/profile.js`; no envía el nombre a un servicio externo. El controlador original sigue a cargo del formulario. `src/domain/presentation.js` concentra las reglas del martes, nombres de firma y disparadores secretos. La hoja de estilos aplica animaciones cortas con alternativas de movimiento reducido.


## Serie 0.50 · Registro de entrega

El registro de entrega es una segunda entrada de la aplicación, compilada por Vite como `registro-entrega/index.html`. No aparece en la navegación principal del generador. `App.jsx` detecta esa ruta y monta `DeliveryRegistry`; el generador normal conserva la frontera heredada.

El subsistema mantiene una base por plantel y alumnos con nombre, especialidad y empresa. El Data Matrix se genera también en el motor heredado de PDF (`src/legacy/editor.js`) porque ese sigue siendo el camino real de descarga del generador principal. `src/services/pdf.js` conserva la misma codificación para mantener equivalencia.

El escáner carga explícitamente el bundle UMD de ZXing Browser 0.2.1 y conserva `BarcodeDetector` como alternativa cuando el navegador ofrece Data Matrix. ZXing usa un intervalo corto entre intentos y solicita enfoque continuo cuando el dispositivo lo permite. El cuadro de detección compensa `object-fit: cover` para alinear las coordenadas de la lectura con el video visible. También existe lectura desde archivo de imagen para prueba o contingencia.

El payload Data Matrix v4 es deliberadamente más compacto que v3 y contiene identidad del alumno más fecha inicial/final. El escáner resuelve primero el alumno y después la semana por periodo; la cola puede contener múltiples semanas y al confirmar aplica cada entrega a su destino. El estado a tiempo/destiempo se calcula con la fecha real de recepción y el límite de la semana encontrada. Las confirmaciones breves usan Sileo; los errores o datos faltantes que requieren corrección permanecen dentro de la pantalla.


## Cámara móvil · Beta 0.50.0-beta.7

El registro se considera **mobile-first**. En iOS/iPadOS el acceso a cámara se inicia únicamente desde una acción explícita del usuario. `getUserMedia` abre el stream con restricciones simples y preferencia por cámara trasera; después `BrowserDatamatrixCodeReader.scan(video, ...)` analiza ese elemento sin volver a solicitar el dispositivo.

El stream se detiene al salir del escáner, al ocultarse la página o al producirse `pagehide`. Al regresar no se reinicia automáticamente: el usuario vuelve a tocar **Activar cámara**. Esto evita conservar tracks inválidos después de bloquear el dispositivo, cambiar de app o reanudar una PWA/pestaña de Safari.

El diseño móvil usa `100dvh`, `viewport-fit=cover` y `env(safe-area-inset-*)`. Los controles críticos tienen objetivo táctil mínimo de 44 px y el escáner oculta la barra superior en móvil para dedicar la mayor parte de la pantalla a la cámara.


## Diagnóstico del escáner · Beta 0.50.0-beta.9

`src/services/scanner-diagnostics.js` concentra los códigos de error y la generación del reporte copiable. La clasificación queda separada por capas:

- `CAM-xxx`: contexto seguro, API de cámara, permisos, dispositivo ocupado o restricciones.
- `VID-xxx`: elemento `<video>`, reproducción y llegada de fotogramas.
- `ZX-xxx`: carga de ZXing, creación del lector, inicio de `scan()` y fallos fatales del ciclo.
- `BD-xxx`: disponibilidad de Data Matrix en `BarcodeDetector`.
- `IMG-xxx`: lectura desde archivo de imagen.

El diagnóstico toma únicamente estado técnico necesario para reproducir el fallo. No incluye el contenido del Data Matrix y sustituye el identificador concreto de la cámara por un booleano que sólo indica si el navegador expuso `deviceId`.


## Recuperación ZX-205 · Beta 0.50.0-beta.10

El escáner ya no delega el ciclo continuo a `BrowserCodeReader.scan()`. Ese método detiene su loop ante cualquier excepción que no sea una instancia reconocida de `NotFoundException`, `ChecksumException` o `FormatException`, lo que resultaba demasiado frágil en Safari/iOS.

La aplicación ejecuta ahora su propio loop con `reader.decode(video)`. `scannerDecoderErrorKind()` clasifica cada excepción como `miss`, `frame` o `fatal`. Los misses son normales; los errores de frame se reintentan hasta un umbral y producen `ZX-207`; los fatales necesitan repetirse tres veces antes de producir `ZX-205`. El loop continúa después del aviso para permitir recuperación espontánea del video o decoder.


## Lista y estados manuales · Beta 0.50.0-beta.11

La vista semanal mantiene el estado automático generado por cámara, pero permite una corrección explícita mediante `setDeliveryStatus()`. Los valores manuales reutilizan los estados existentes (`entregado`, `entregado_tarde`, `no_entregado`) y marcan el origen como `manual`; `no_entregado` elimina el registro de entrega.

La lista semanal aplica búsqueda, estado, especialidad y empresa antes de agrupar. La agrupación es sólo de presentación y puede hacerse por especialidad o empresa sin modificar el esquema persistente.


## Filtro de entrega y sonido de lectura · Beta 0.50.0-beta.12

La vista semanal reutiliza `statusFilter` tanto para las tarjetas-resumen como para el selector explícito de Entrega. De esta forma ambos controles permanecen sincronizados y el filtro puede combinarse con especialidad, empresa, texto y agrupación sin duplicar lógica.

`ScanSound` reproduce `Assets/asset_chime.mp3` únicamente para una lectura aceptada (`tone === "ok"`). Repetidos y lecturas no coincidentes conservan tonos sintetizados distintos. El archivo de chime se incluye en el núcleo del service worker para disponibilidad posterior sin conexión.


## Reportes de entrega PDF · Beta 0.50.0-beta.13

`src/services/delivery-report.js` separa la construcción del modelo de reporte de su renderizado. `buildDeliveryReportModel()` produce un modelo estable para una semana o para todo el historial; `generateDeliveryReportPdf()` lo convierte en páginas A4.

El renderizado se hace sobre canvas para mantener tipografía, Blobatars, tablas y estados consistentes en navegadores móviles. Cada página se rasteriza como JPEG y un escritor PDF mínimo empaqueta las imágenes en un PDF multipágina A4 sin depender de servicios externos ni de una librería PDF adicional.

El diseño es deliberadamente institucional: fondo blanco, tipografía del sistema, líneas discretas, un único acento azul y colores de estado moderados. El servicio añade fecha de creación, versión, plantel, generación dual, periodo, límite, resumen y numeración de páginas.


## Reporte global · Beta 0.50.0-beta.14

El modo `global` reutiliza el mismo modelo de semanas, pero construye `globalRows`: una fila por alumno con un arreglo de estados alineado cronológicamente con las semanas.

El renderizado usa A4 horizontal. La matriz se divide en bloques de hasta 15 semanas por ancho y 14 alumnos por alto. El escritor PDF acepta ahora dimensiones por página, de forma que los reportes verticales existentes y el reporte global horizontal pueden convivir en el mismo servicio.

Cada celda usa únicamente el estado resumido; el detalle de fecha/hora permanece disponible en los otros dos formatos. El primer campo conserva mini Blobatar, alumno, especialidad y empresa.


## Landing de presentación · Beta 0.50.0-beta.15

`presentacion/index.html` es una entrada Vite independiente y no monta React. Su objetivo es presentar el proyecto sin mezclarlo con la interfaz operativa del generador.

El hero usa `public/Assets/asset_landing.png`; la sección de Data Matrix usa `public/Assets/Asset_cont_matrix.png`. La landing explica los tres frentes del ecosistema (generador, registro de entregas y sistema complementario de constancias), el flujo de alumno a Vinculación y un proceso sugerido de incorporación por plantel.

`src/presentation.css` usa tipografía del sistema, superficies sobrias, safe areas y `prefers-reduced-motion`. `src/presentation.js` sólo gestiona aparición progresiva y el registro del service worker; no captura datos del visitante.
