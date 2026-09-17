# Contribuir al Generador de Bitácora Dual

La configuración de escuelas y empresas está en dos archivos JSON. Se edita en el repositorio; los alumnos no necesitan una pantalla de administración.

## Abrir el archivo correcto

[![Editar escuelas](https://img.shields.io/badge/Editar-escuelas-0071e3?style=for-the-badge)](https://github.com/gio-canto/generador-bitacora-dual_2026/edit/main/src/data/schools.json)
[![Editar empresas](https://img.shields.io/badge/Editar-empresas-0071e3?style=for-the-badge)](https://github.com/gio-canto/generador-bitacora-dual_2026/edit/main/src/data/companies.json)

| Quiero cambiar… | Archivo y campo |
| --- | --- |
| Nombre de la escuela | [schools.json](src/data/schools.json) → `name` |
| Abreviatura de la escuela en firmas | `schools.json` → `shortName` |
| Responsable de Vinculación | `schools.json` → `voboName` y `voboRole` |
| Especialidades, semestres o grupos | `schools.json` → `specialties`, `semesters`, `groups` |
| Nombre completo de la empresa | [companies.json](src/data/companies.json) → `name` |
| Abreviatura de la empresa en firmas | `companies.json` → `shortName` |
| Horario y área sugeridos | `companies.json` → `start`, `end`, `area` |
| Personas que autorizan | `companies.json` → `representatives` |
| Instructores disponibles | `companies.json` → `instructors` |
| Activar el instructor al elegir una empresa | `companies.json` → `instructorEnabledByDefault` |

## Editar desde GitHub, paso a paso

1. Pulsa **Editar escuelas** o **Editar empresas** arriba e inicia sesión en GitHub.
2. Si abriste el archivo en modo lectura, pulsa el lápiz **Edit this file**; también aparece dentro del menú de tres puntos.
3. Busca el nombre de la escuela o empresa. Cambia solo sus valores entre comillas. Conserva su `id`.
4. Para agregar otra, copia un objeto completo dentro de la lista `[...]`, sepáralo del anterior con una coma y ponle un `id` nuevo. No dejes una coma después del último objeto.
5. Pulsa **Commit changes…**. Describe el cambio, por ejemplo: “Actualizar horario de la empresa”. Elige crear una rama para revisarlo antes de integrarlo.
6. Pulsa **Propose changes** o **Create pull request**, según lo que muestre GitHub. Si no tienes permisos, GitHub puede crear una copia del repositorio para tu propuesta.
7. Comprueba que **Verificar y publicar en GitHub Pages** termine correctamente. Revisa los datos y el PDF antes de integrar la propuesta. Al integrarse en `main`, se publica la actualización.

## Escuelas: qué significa cada dato

```json
{
  "id": "plantel-ejemplo",
  "name": "NOMBRE COMPLETO DEL PLANTEL",
  "shortName": "Plantel de ejemplo",
  "voboName": "Nombre real de quien firma",
  "voboRole": "Cargo real\nPlantel de ejemplo",
  "specialties": ["Programación", "Contabilidad"],
  "semesters": ["4", "5", "6"],
  "groups": ["A", "B", "C", "D"]
}
```

`name` se usa en los datos del documento; `shortName` se usa en la zona de firmas. Si omites `shortName` o dejas `""`, se usa el nombre completo. `voboName` es una persona, no el nombre de la escuela. `\n` separa líneas dentro del cargo.

## Empresas: horario, firmas e instructor

```json
{
  "id": "empresa-ejemplo",
  "name": "Nombre completo de la empresa",
  "shortName": "Nombre corto",
  "start": "09:00",
  "end": "14:00",
  "area": "Área de Informática",
  "instructorEnabledByDefault": true,
  "representatives": [
    { "name": "Nombre real de quien autoriza", "role": "Cargo real\nJefe inmediato" }
  ],
  "instructors": [
    { "name": "Nombre real del instructor", "roleMain": "Cargo real" }
  ]
}
```

- `shortName`: abreviatura para las firmas; si falta, se usa `name`, sin intentar adivinar una abreviatura.
- `start` y `end`: horario de 24 horas, siempre `HH:mm`; la salida debe ser posterior a la entrada.
- `instructorEnabledByDefault`: `true` activa la sección al elegir la empresa; `false` la deja apagada. COCYTIEG lleva `true`. El alumno puede cambiarla; abrir una bitácora guardada respeta lo que eligió.
- `representatives`: personas que pueden autorizar. Con una, se sugiere automáticamente; con varias, aparece un selector. Verifica los nombres y cargos.
- `instructors`: opciones del selector de instructor. Puedes dejar `[]` si no hay personas precargadas: se permite escribir el nombre y cargo manualmente.

Estos son ejemplos, no datos para publicar sin comprobar. No pongas nombres inventados en los catálogos reales.

## Otros archivos de configuración

| Archivo | Cuándo editarlo |
| --- | --- |
| [package.json](package.json) | Versión, comandos y dependencias; no contiene escuelas ni alumnos |
| [package-lock.json](package-lock.json) | Lo actualiza npm al instalar dependencias; no se edita a mano |
| [faq/index.html](faq/index.html) | Preguntas frecuentes y notas visibles en la ayuda; no es JSON |
| [src/legacy/shell.html](src/legacy/shell.html) | Textos y estructura de la interfaz original |

Los respaldos descargados contienen datos personales del navegador. No se publican en el repositorio.

## Desarrollar y comprobar

```bash
npm ci
npm run dev
npm run check
```

Usa Node.js 24. Si cambias el PDF, revísalo además visualmente. Comprueba teléfono, iPad, teclado y movimiento reducido. Conserva el diseño original, los créditos y los disparadores de easter eggs. Documenta el cambio en [CHANGELOG.md](CHANGELOG.md).

Blobatar se instala con `npm i blobatar` y se importa desde `blobatar/react`; esa ruta es parte del paquete, no una segunda instalación. El nombre y el avatar se procesan localmente.
