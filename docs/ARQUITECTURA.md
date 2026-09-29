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
