# Datos, migración y caché

## Almacenamiento local

`bitacora_dual_react_v1` contiene `schemaVersion`, `version`, `draft`, `records` y `catalogs`. El borrador se escribe tras 250 ms sin cambios y al ocultar o cerrar la página. Una escritura fallida se muestra al usuario; exportar JSON sigue disponible.

Al iniciar sin datos React se leen `bitacora_dual_clean_v3` y `bitacora_dual_draft_v1`. Las claves anteriores no se borran. Si se detecta información incompatible, el autoguardado se detiene y se ofrece un archivo de recuperación. No se inicia con la bitácora personal de ejemplo en dispositivos nuevos.

No edites el mismo espacio de trabajo en varias pestañas a la vez: se comparte `localStorage` y la última escritura puede prevalecer. No hay sincronización entre dispositivos.

## Respaldos

El respaldo nuevo incluye registros, borrador y catálogos. Se siguen aceptando las listas de registros exportadas por la beta anterior. Los límites son 5 MB y 1,000 registros por importación. Los duplicados exactos se omiten; una colisión de ID con contenido distinto crea una copia. Se confirma antes de restaurar el borrador y los catálogos.

Los registros existentes nunca se eliminan por importar. Si hay borrador en el respaldo, el borrador actual se conserva en el historial. Las copias de trabajo incompletas se pueden volver a abrir y corregir.

## Caché de la aplicación

Vite da nombres con hash a JavaScript y CSS. `build-sw.mjs` genera un service worker con caché `bitacora-dual-<hash>`. Precarga el programa, el FAQ y el encabezado. El audio y los ejemplos no se descargan anticipadamente.

Se sirven los recursos de la compilación instalada para evitar mezclar HTML viejo con scripts nuevos. Una actualización espera: la interfaz avisa, guarda el borrador y activa la nueva versión al elegir **Actualizar ahora**. La activación elimina únicamente cachés antiguas cuyo nombre empieza por `bitacora-dual-`; nunca borra `localStorage` ni cachés de otros proyectos.

La primera visita necesita conexión. El navegador puede desalojar la caché o el almacenamiento, y el modo privado puede limitarlo. Un service worker no sustituye un respaldo. La aplicación funciona también si el navegador no admite el service worker.

El despliegue conserva el mismo dominio y ruta de GitHub Pages; mover a otro dominio no trasladará el almacenamiento automáticamente.
