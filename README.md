<div align="center">

# Generador de Bitácora Dual 2026

**Genera, conserva y registra bitácoras de Educación Dual desde el navegador.**

[![Beta](https://img.shields.io/badge/beta-0.50.0--beta.44-0066cc)](CHANGELOG.md)
[![Verificación y Pages](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml/badge.svg)](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](package.json)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-555)](LICENSE)

[Presentación](https://gio-canto.github.io/generador-bitacora-dual_2026/presentacion/) ·
[Generador](https://gio-canto.github.io/generador-bitacora-dual_2026/) ·
[Registro de entrega](https://gio-canto.github.io/generador-bitacora-dual_2026/registro-entrega/) ·
[FAQ](https://gio-canto.github.io/generador-bitacora-dual_2026/faq/) ·
[Debug](https://gio-canto.github.io/generador-bitacora-dual_2026/debug/) ·
[Contribuir](CONTRIBUTING.md)

</div>

---

## Qué es

**Generador de Bitácora Dual 2026** es un proyecto web local-first para elaborar bitácoras semanales de Educación Dual, generar su PDF y facilitar posteriormente el registro de entrega mediante Data Matrix.

El proyecto funciona sin cuentas y sin una base de datos central propia. El generador, el historial y el registro de entrega trabajan principalmente en el navegador de la persona usuaria.

### Componentes

| Componente | Función |
| --- | --- |
| **Generador** | Captura datos, jornadas, responsables y genera la bitácora en PDF. |
| **Perfil local** | Recuerda datos recurrentes del alumno para reducir captura repetitiva. |
| **Registro de entrega** | Mantiene una base local de alumnos, semanas y estados de recepción. |
| **Data Matrix** | Relaciona la bitácora con alumno, especialidad, empresa y periodo. |
| **Reportes** | Genera listados por semana, historial y matriz global de entregas. |
| **Presentación** | Landing ES/EN/DE que explica el proyecto, muestra testimonios reales en carrusel y las rutas para adoptarlo o colaborar. |
| **Debug** | Área interna para probar módulos, efemérides, cámara, PDF, notificaciones y vistas adaptables. |

## Funciones principales

- PDF A4 horizontal preparado para el formato de bitácora actual.
- Jornadas de martes a viernes, estados especiales y validaciones antes de exportar.
- Motivos frecuentes opcionales para **Falta**, con justificaciones precargadas completamente editables y protección para no sobrescribir texto personalizado sin confirmación.
- Historial, borrador, respaldos e importación local.
- Acceso discreto a bitácoras anteriores desde la barra superior, con contador compacto, revisión de sólo lectura y retorno directo al paso 5 para volver a descargar el PDF.
- Landing pública disponible en español, inglés y alemán; la versión alemana usa terminología contextual de la **duale Berufsausbildung** y **Ausbildungsnachweis (Berichtsheft)**. Las aplicaciones operativas permanecen en español.
- Efemérides visuales del calendario: enero conserva **Nuevo año, nueva bitácora** con el año actual calculado automáticamente, diciembre mantiene una ambientación ligera, Halloween aparece el 31 de octubre y **Día de Muertos** el 1 y 2 de noviembre; las efemérides históricas muestran automáticamente el número de aniversario correspondiente.\n- Perfil con Blobatar y datos recurrentes.
- Corrector ortográfico opcional procesado localmente, con diccionario adicional para catálogos institucionales y vocabulario técnico de programación, contabilidad, RH, IA, e-commerce, ciberseguridad, datos, diseño y gestión.
- Firma genérica opcional del alumno.
- Data Matrix versionado en las bitácoras.
- Escaneo continuo de entregas desde cámara o imagen.
- Clasificación automática de la semana mediante el periodo del código.
- Estados **Entregado a tiempo**, **Entregado a destiempo**, **No entregado** y **No aplica**; este último excluye al alumno del cálculo de cumplimiento de esa semana.
- La fecha y hora límite de una semana puede editarse después de crearla; las entregas registradas por cámara se reclasifican con el nuevo límite, mientras las correcciones manuales y **No aplica** se conservan.
- Cada alumno puede quedar como **Activo** o **Desistido de Dual**. Un desistido conserva sus entregas históricas, deja de aparecer y de contarse en semanas donde nunca tuvo entrega, puede reactivarse y sólo pierde su historial si se usa **Eliminar definitivamente**.
- Coincidencias aproximadas de nombre con confirmación humana mediante una alerta visual integrada al sistema cuando un Data Matrix no coincide exactamente; muestra el nombre leído, la persona sugerida, especialidad/empresa y porcentaje aproximado antes de registrar.
- Filtros, agrupaciones, edición de alumnos, CSV y reportes PDF.

## Implementar otra escuela

Hay dos niveles de integración y conviene no confundirlos:

1. **Agregar una institución al formato existente.** Normalmente basta con editar los catálogos de escuelas y empresas.
2. **Adaptar el sistema a otro formato de bitácora.** Requiere revisar campos, firmas, jornadas, tamaño de hoja, PDF, Data Matrix y pruebas de regresión.

La guía completa está en **[Implementar una institución o adaptar un formato](docs/IMPLEMENTAR_INSTITUCION.md)**.

Para cambios sólo de catálogos consulta **[Catálogos](docs/CATALOGOS.md)**.

## Uso rápido

1. Selecciona plantel, especialidad, semestre o grado y grupo.
2. Escribe o recupera los datos del alumno y la empresa.
3. Genera la semana y completa las jornadas.
4. Revisa responsables, instructor y firmas.
5. Valida la vista previa y descarga el PDF.
6. Si el plantel usa el registro de entrega, escanea posteriormente el Data Matrix desde la página independiente.

## Privacidad y datos

No existe una cuenta obligatoria ni una base central del proyecto para almacenar bitácoras. El historial, borrador, perfil y registro de entrega se conservan en el navegador.

Los respaldos y PDFs descargados pueden contener datos personales. No deben adjuntarse a issues, pull requests ni repositorios públicos.

Consulta:

- [Datos, almacenamiento y respaldos](docs/DATOS_Y_CACHE.md)
- [Seguridad](SECURITY.md)

## Desarrollo local

Requiere **Node.js 22.12 o posterior**. CI utiliza Node.js 24.

```bash
git clone https://github.com/gio-canto/generador-bitacora-dual_2026.git
cd generador-bitacora-dual_2026
npm ci
npm run dev
```

Verificación completa:

```bash
npm run check
```

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo. |
| `npm test` | Ejecuta la suite automatizada. |
| `npm run build` | Compila producción y genera el service worker. |
| `npm run check` | Ejecuta pruebas y compilación. |
| `npm run preview` | Sirve la compilación local. |
| `npm run format` | Aplica Prettier a los archivos configurados. |

## Estructura del repositorio

```text
.
├─ src/
│  ├─ components/        # Componentes React independientes
│  ├─ data/              # Escuelas y empresas
│  ├─ domain/            # Reglas compartidas
│  ├─ legacy/            # Generador y motor PDF heredado
│  └─ services/          # Persistencia, escáner, reportes y utilidades
├─ registro-entrega/     # Entrada del subsistema de recepción
├─ presentacion/         # Landing pública
├─ faq/                  # Preguntas frecuentes
├─ debug/                # Entrada del área de pruebas internas
├─ docs/                 # Documentación técnica e institucional
├─ tests/                # Pruebas automatizadas
└─ .github/workflows/    # Verificación y despliegue
```

La arquitectura es híbrida: el generador principal conserva controladores heredados por compatibilidad, mientras que módulos nuevos como el registro de entrega y la presentación utilizan React. Consulta [Arquitectura](docs/ARQUITECTURA.md).

## Documentación

| Documento | Para qué sirve |
| --- | --- |
| [Índice de documentación](docs/README.md) | Punto de entrada a todas las guías. |
| [Implementar una institución](docs/IMPLEMENTAR_INSTITUCION.md) | Incorporar otra escuela o adaptar su formato. |
| [Catálogos](docs/CATALOGOS.md) | Esquema de escuelas, empresas, responsables e instructores. |
| [Arquitectura](docs/ARQUITECTURA.md) | Límites, módulos y flujos del sistema. |
| [Datos y caché](docs/DATOS_Y_CACHE.md) | Persistencia local, respaldos y Data Matrix. |
| [Pruebas](docs/PRUEBAS.md) | Qué ejecutar y qué revisar manualmente. |
| [Versionado](docs/VERSIONADO.md) | Regla obligatoria para publicar cambios y documentar versiones. |
| [Contribuir](CONTRIBUTING.md) | Flujo de ramas, PR y criterios de aceptación. |
| [Notas de versión](CHANGELOG.md) | Historial de cambios publicados. |

## Regla de publicación

Todo cambio que llegue a `main` debe quedar documentado. Antes de considerarlo terminado se debe:

- actualizar la versión;
- agregar su entrada en `CHANGELOG.md`;
- actualizar la documentación afectada;
- agregar o actualizar pruebas cuando cambie comportamiento;
- ejecutar `npm run check`.

La política completa está en [VERSIONADO.md](docs/VERSIONADO.md).

## Contribuir

Las contribuciones pueden agregar planteles, empresas, corregir documentación, mejorar accesibilidad o modificar funciones. Para cambios institucionales, no publiques datos personales que no deban quedar en el repositorio.

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de enviar una propuesta.

## Licencia

Código distribuido bajo [MIT](LICENSE). Dependencias y recursos de terceros conservan sus propias licencias y atribuciones.
