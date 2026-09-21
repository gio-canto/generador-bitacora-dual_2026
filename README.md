<div align="center">

# Generador de Bitácora Dual 2026

Una semana de actividades, un PDF listo para firmar.

[![Beta](https://img.shields.io/badge/beta-0.49.0--beta.2-0066cc)](CHANGELOG.md)
[![Verificación y Pages](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml/badge.svg)](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![MIT](https://img.shields.io/badge/licencia-MIT-555)](LICENSE)

[Abrir aplicación](https://gio-canto.github.io/generador-bitacora-dual_2026/) · [Preguntas frecuentes](https://gio-canto.github.io/generador-bitacora-dual_2026/faq/) · [Notas de versión](CHANGELOG.md) · [Reportar un problema](https://github.com/gio-canto/generador-bitacora-dual_2026/issues)

</div>

## Beta 0.49.0-beta.3 · Anti-fool upgrade · Parte 3

La revisión final incorpora una firma genérica opcional para el alumno. Si se activa, el PDF coloca únicamente el nombre del estudiante con apariencia de tinta azul en su espacio de firma; no genera ni modifica firmas de Vinculación, empresa o instructor. La preferencia se guarda con la bitácora y el sistema recuerda verificar si la institución acepta este recurso.

## Beta 0.49.0-beta.2 · Anti-fool upgrate · Parte 2

Corrección del rediseño: vuelve la interfaz original de Beta 0.47, con su navegación, tutorial, ayuda y funciones. React se conserva como punto de entrada con una capa de compatibilidad para el controlador original. La FAQ vuelve a su implementación estática original.

## Qué puedes hacer

- Completar los cinco pasos originales y usar el tutorial guiado.
- Generar martes a viernes o agregar jornadas manualmente, con un máximo de cuatro.
- Editar horarios, actividades, responsables e instructor de cada bitácora.
- Usar Markdown y los estados Falta, Sin labores y Día inhábil, con sus recordatorios.
- Ver las líneas disponibles antes de exceder una hoja y exportar el PDF A4 horizontal.
- Recuperar el borrador, guardar, abrir, duplicar y eliminar registros con confirmación.
- Exportar el historial e importar respaldos sin borrar los registros actuales.
- Consultar la ayuda, los ejemplos y las notas de versión originales.

**Los catálogos se modifican únicamente en el código**, en `src/data/schools.json` y `src/data/companies.json`. No hay pantalla Catálogos. Consulta [la guía de configuración](docs/CATALOGOS.md).

Sileo confirma acciones como guardar o importar y muestra avisos breves del sistema. El autoguardado no genera notificaciones. Las confirmaciones, avisos de jornadas y recomendaciones de entrega conservan sus ventanas.

La semana pide el martes de inicio, entrada y salida. Markdown sigue activo en Más opciones. Historial y respaldos están plegados. La barra superior recuerda el nombre con un Blobatar local; puedes cambiarlo u olvidarlo. COCYTIEG activa el instructor por defecto. Los nombres cortos para firmas se configuran en los JSON.

No hay cuentas ni servidor de bitácoras. Los datos permanecen en el navegador. Descargar PDF guarda también la semana en el historial. Para llevarte una copia del historial, usa Exportar respaldo en el último paso.

## Uso rápido

1. Selecciona escuela, especialidad, semestre y grupo.
2. Escribe el nombre del alumno y elige la empresa.
3. Genera la semana y describe las cuatro jornadas.
4. Revisa los responsables.
5. Revisa la vista previa, guarda y descarga el PDF.

## Desarrollo local

Requiere Node.js 22.12 o posterior; se recomienda Node.js 24, utilizado en CI.

```bash
npm ci
npm run dev
```

Abre la dirección indicada por Vite. Para comprobar una compilación de producción:

```bash
npm run check
npm run preview
```

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas de formularios, datos, migración y PDF |
| `npm run build` | Compila `dist/` y genera la caché versionada |
| `npm run preview` | Sirve `dist/` para revisión |
| `npm run format` | Formatea el código con Prettier |

Sileo ya está declarado y fijado en `package-lock.json`; se incorporó con `npm i sileo`. No se descargan librerías desde CDN durante el uso.

## Documentación

- [Arquitectura y límites de la integración React](docs/ARQUITECTURA.md)
- [Configuración de catálogos](docs/CATALOGOS.md)
- [Datos, respaldos y caché](docs/DATOS_Y_CACHE.md)
- [Verificación](docs/PRUEBAS.md)
- [Notas de versión](CHANGELOG.md)

## Contribuir

Conserva la interfaz original y verifica las funciones existentes antes de cambiar un flujo. Describe el problema, el cambio y las comprobaciones en cada propuesta. Continúa en beta.

### Corrector ortográfico

En cada actividad o justificación, pulsa **Revisar ortografía**. Elige una sugerencia u **Omitir palabra**; **Cerrar** te devuelve al texto. Los cambios se guardan con el borrador y respetan el espacio del PDF. No cambia nombres, firmas ni empresas automáticamente y no bloquea la descarga.

Usa [nspell](https://github.com/wooorm/nspell) (MIT) y [dictionary-es](https://github.com/wooorm/dictionaries/tree/main/dictionaries/es) 4.0.0 (diccionario es_ES; pueden faltar regionalismos mexicanos). Revisa palabras, no gramática ni contexto. El procesamiento es local en un Web Worker: no envía los textos a un servicio externo. El recurso de unos 884 kB sin comprimir se descarga al abrir el corrector, no al iniciar la aplicación, y el service worker lo guarda para siguientes usos sin conexión.

Licencias y atribuciones: [nspell](public/licenses/nspell.txt), [diccionario español](public/licenses/dictionary-es.txt). Los archivos originales del diccionario se distribuyen sin modificar mediante la dependencia fijada en package-lock.json.
