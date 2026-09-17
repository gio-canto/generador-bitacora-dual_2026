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
| `src/services/rare-notification.jsx` | Carga diferida de Sileo tras importar un respaldo |
| `faq/index.html` | FAQ original con buscador, ejemplos y versiones |

La vista previa espera 120 ms desde la última modificación y solo dibuja si su panel es visible. La exportación mantiene la resolución original de 11.81 píxeles/mm. Los ajustes del logotipo y etiquetas de firma se aplican dentro del motor, sin modificar prototipos globales de Canvas.

La prioridad de esta corrección es recuperar comportamiento e identidad visual. La extracción futura de componentes React debe hacerse por partes, con pruebas de equivalencia antes de sustituir los controladores originales.
