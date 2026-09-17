<div align="center">

# Generador de Bitácora Dual 2026

Una semana de actividades, un PDF listo para firmar.

[![Beta](https://img.shields.io/badge/beta-0.48.0--beta.1-0066cc)](CHANGELOG.md)
[![Verificación y Pages](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml/badge.svg)](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![MIT](https://img.shields.io/badge/licencia-MIT-555)](LICENSE)

[Abrir aplicación](https://gio-canto.github.io/generador-bitacora-dual_2026/) · [Preguntas frecuentes](https://gio-canto.github.io/generador-bitacora-dual_2026/faq/) · [Notas de versión](CHANGELOG.md) · [Reportar un problema](https://github.com/gio-canto/generador-bitacora-dual_2026/issues)

</div>

## Beta 0.48: Anti-fool upgrate

La aplicación y las preguntas frecuentes ahora utilizan **React + Vite**. Conserva el formato A4 horizontal, las cuatro jornadas de martes a viernes y los catálogos de la beta anterior, con una estructura modular y controles pensados para teléfono, iPad y computadora.

> [!IMPORTANT]
> Continúa en **beta**. El documento debe revisarse antes de imprimirse o entregarse. Los nombres y cargos precargados son referencias del proyecto; confirma quién corresponde a tu caso.

## Qué puedes hacer

- Completar cinco etapas con ayuda contextual y errores junto a cada campo.
- Agregar y editar escuelas, especialidades, semestres, grupos, empresas, horarios, representantes e instructores desde **Catálogos**.
- Revisar fechas duplicadas, semanas incompatibles, horarios invertidos y justificaciones incompletas antes de exportar.
- Ajustar cada jornada; usar Markdown, falta, sin labores o día inhábil.
- Guardar automáticamente el borrador, abrir y duplicar bitácoras, buscar en el historial y deshacer una eliminación.
- Exportar respaldos con historial, borrador y catálogos; importar sin borrar los registros existentes.
- Ampliar la vista previa y descargar el PDF, con opción de compartir en dispositivos compatibles.
- Recibir notificaciones de **Sileo**. Los errores de formulario permanecen junto al campo.
- Seguir usando la aplicación sin conexión después de que su caché se haya instalado. Los ejemplos y el audio se cargan bajo demanda.

No hay cuentas ni servidor de bitácoras. Los datos se conservan en el navegador; no se sincronizan automáticamente entre dispositivos. Los créditos y easter eggs siguen formando parte del proyecto.

## Uso rápido

1. Selecciona escuela, especialidad, semestre y grupo.
2. Escribe el nombre del alumno y elige la empresa.
3. Selecciona una fecha, genera la semana y describe las cuatro jornadas.
4. Revisa los nombres y cargos de los responsables.
5. Comprueba la vista previa, guarda la bitácora y descarga el PDF.

**Historial → Exportar respaldo** crea una copia trasladable a otro navegador. **Catálogos** modifica únicamente los datos de este dispositivo; para cambiar los datos predeterminados para todos, edita los JSON del repositorio.

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

## Estructura

| Ubicación | Responsabilidad |
| --- | --- |
| `src/components/` | Campos, jornadas, responsables, historial, catálogos, FAQ y diálogos |
| `src/data/schools.json` | Planteles, oferta escolar y Vinculación |
| `src/data/companies.json` | Empresas, horarios, áreas, representantes e instructores |
| `src/data/faq.json` | Contenido de ayuda de confianza mantenido en Git |
| `src/domain/` | Reglas de validación, fechas y catálogos |
| `src/services/` | Almacenamiento, respaldo, dibujo y entrega del PDF |
| `src/hooks/` | Estado y autoguardado del espacio de trabajo |
| `public/Assets/` | Encabezado institucional, ejemplos y audio |
| `scripts/build-sw.mjs` | Caché de recursos de cada compilación |
| `tests/` | Pruebas automatizadas |

## Documentación

- [Editar escuelas, empresas y personas](docs/CATALOGOS.md)
- [Arquitectura y diseño](docs/ARQUITECTURA.md)
- [Datos, migración y caché](docs/DATOS_Y_CACHE.md)
- [Comprobaciones de la beta](docs/PRUEBAS.md)
- [Cómo contribuir](CONTRIBUTING.md)
- [Seguridad](SECURITY.md)
- [Historial de cambios](CHANGELOG.md)

## Despliegue

GitHub Actions ejecuta instalación reproducible, pruebas y compilación. Los pull requests se verifican sin desplegar. Los cambios en `main` publican **solamente `dist/`** en GitHub Pages.

La configuración de Pages debe conservar **GitHub Actions** como origen. Se mantienen las rutas `/generador-bitacora-dual_2026/` y `/generador-bitacora-dual_2026/faq/`.

## Alcance y accesibilidad

Diseño claro inspirado en principios de Apple: controles de al menos 44 px, tipografía del sistema, foco visible, retorno de foco en diálogos, ayuda por etapa y preferencias de movimiento, transparencia y contraste. Es una implementación web propia, no una biblioteca oficial de Apple.

El formato PDF sigue siendo institucional y compartido por los planteles. Agregar un plantel no cambia automáticamente el logotipo ni las reglas académicas. Se admite un turno por día, con salida posterior a entrada; no se modelan turnos nocturnos.

El PDF se genera como imagen de alta resolución en una página: su texto no es seleccionable. Borrar el almacenamiento del navegador puede eliminar los datos locales. Mantén respaldos.

## Autor y licencia

**Gio Antonio Canto Gómez** · [@gio-canto](https://github.com/gio-canto)

[Licencia MIT](LICENSE). Creado para facilitar la documentación semanal de Educación Dual.
