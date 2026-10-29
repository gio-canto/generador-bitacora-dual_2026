# v0.58.0-beta.1 — Generador Mobile · Adaptive Glass

## Objetivo y compatibilidad

Esta actualización introduce una **presentación móvil opcional** del generador principal. La interfaz original de escritorio y Registro Dual siguen funcionando independientemente. No hay migración de datos, duplicación de formularios ni alteración de PDF, Data Matrix, esquemas de bitácoras, perfiles, historial o secretos.

La misma página ofrece tres preferencias, guardadas exclusivamente en `bitacora_dual_generator_layout_v1`:
- **Automático:** modo móvil hasta 760 px y escritorio en pantallas más anchas.
- **Móvil:** activa la vista Mobile + Apple Glass incluso en pantalla ancha.
- **Escritorio:** conserva la interfaz anterior. Desde una pantalla estrecha aparece «Vista móvil» en la cabecera para revertir la elección.

El menú «Más → Presentación» solo existe en modo móvil. Los elementos `#student`, `#days`, `#preview`, `#homeHistoryDisclosure` y `#profileSlot` nunca se duplican. Historial y perfil se trasladan como **nodos DOM originales**, conservando sus controladores y raíces React al cambiar la presentación. Al restaurar escritorio, ambos vuelven a la cabecera original.

## Pantallas

- **Inicio:** logotipo horizontal oficial `Assets/Asset_logo.png`, saludo, progreso de las cinco etapas, continuar, nueva bitácora y accesos rápidos.
- **Capturar:** la misma guía y sus cinco etapas, con navegación horizontal. Las cuatro jornadas usan pestañas táctiles que muestran una tarjeta a la vez sin alterar el resto de los registros.
- **Historial:** reutiliza la lista original `#homeRecords`, sin duplicar almacenamiento o acciones.
- **Perfil:** reutiliza íntegramente el componente React existente y sus opciones.
- **Más:** respaldo e importación JSON, ayuda, guardar, PDF y selector de presentación. No se añade una sección de curiosidades o pistas de secretos.

El contraste, el área segura inferior, el teclado, las preferencias de movimiento reducido y de transparencia reducida tienen estilos específicos.

## Funciones especiales existentes

Permanecen las reglas originales: nombres secretos y ventana de créditos, `Virtual Insanity` y su audio, Halloween, Día de Muertos, aniversarios y celebraciones del calendario, nieve, confeti, alertas de falta/sin labores/día inhábil, tutorial, confirmaciones, corrector ortográfico y Sileo.

La presentación móvil desplaza Sileo a la parte superior para evitar que la navegación inferior oculte el mensaje; escritorio y Registro Dual mantienen su posición original.

## Instalación PWA

El generador principal incorpora `public/manifest.webmanifest` e iconos propios creados **desde el logotipo oficial**, con compatibilidad Apple, Android y `maskable`. Registro Dual conserva su manifiesto y sus iconos separados. El Service Worker precarga los nuevos recursos junto con el conjunto actual; no borra LocalStorage.

**Límite:** la aplicación es local-first, no existe sincronización en nube. En iOS, la instalación desde la pantalla de inicio puede usar un almacenamiento separado de Safari. Se recomienda exportar respaldos JSON antes de cambiar de navegador, instalar o borrar datos del sitio. Algunas bibliotecas externas, incluido el generador Data Matrix, pueden requerir conexión si no están previamente disponibles.

## Seguridad y publicación

Los cambios se desarrollan en `feat/v058-mobile-adaptive-glass`, no en `main`. Antes de integrar: ejecutar `npm run check`, confirmar la preservación de escritorio y Registro Dual, revisar navegación a 320/360/390/430/760/768 px, menús de perfil, historial, avisos y easter eggs, y verificar PDF carta con Data Matrix en dispositivos reales.

No incluir información de borradores ni registros de alumnos en el repositorio.
