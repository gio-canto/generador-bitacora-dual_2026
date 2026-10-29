<div align="center">

<img src="public/Assets/publicAssetsAsset_logo.png" alt="Logotipo del Generador de Bitácora Dual" width="420" />

# Generador de Bitácora Dual 2026

**Genera, conserva y registra bitácoras de Educación Dual desde el navegador.**

[![Beta](https://img.shields.io/badge/beta-0.58.1--beta.1-0066cc)](CHANGELOG.md)
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

## v0.58.1-beta.1 · Generador Mobile — Adaptive Glass

**Refinamiento de diseño:** barra inferior flotante estilo Apple Glass con bordes redondeados; Blobatar real del perfil activo, saludos por hora local (con mensaje especial de 01:00 a 04:59) y enlaces a privacidad, cookies, condiciones, accesibilidad y agradecimientos en Más.\n\nEl generador principal incorpora **una interfaz móvil propia** con el logotipo oficial, Inicio, Capturar, Historial, Perfil y Más, superficies Apple Glass, pestañas táctiles para las jornadas y modo de presentación Automático / Móvil / Escritorio.

**El escritorio original sigue intacto.** La vista móvil utiliza el mismo formulario, datos, validaciones, historial, perfil y generador PDF; no existe una segunda copia. Los easter eggs, eventos de calendario, avisos, créditos y tutorial conservan sus activadores. El generador tiene una **PWA independiente** de Registro Dual, con iconos derivados del logotipo original.

Consulta [las notas de v0.58](docs/V058_GENERADOR_MOBILE.md) para compatibilidad, respaldos, modo sin conexión y pruebas.

## Corrección de escritorio · v0.57.2-beta.1

La **interfaz web de escritorio vuelve a su composición clásica**: ancho centrado, logotipo horizontal, cinco accesos del Inicio, historial completo, tarjetas y filtros originales de Estadísticas. La barra lateral ya **no desplaza ni estrecha la página**: se abre solo al pulsar «Menú». Los estilos globales Apple Glass ahora se aplican exclusivamente al **modo móvil**, sin alterar la versión web. Véase [restauración de escritorio](docs/V0572_ESCRITORIO.md).

## Datos → Empresas: dos medidas de horas

**Promedio semanal acumulado por alumno:** para cada semana y empresa, divide las horas capturadas entre los alumnos que sí registraron estadísticas esa semana; después suma todos los promedios semanales del periodo. Por ejemplo, 30 h / 2 alumnos + 40 h / 1 alumno = **55 h de promedio semanal acumulado**, aunque las horas totales sean **70 h**.

**Horas totales por empresa:** conserva la suma original de todas las jornadas, sin normalizar. Las gráficas, la tabla comparativa y el PDF muestran ambas medidas, incluida la distinción «Sin datos» para las empresas sin jornadas. El PDF añade una página comparativa y su anexo muestra las dos columnas.

## v0.57.3-beta.1 · Carta, PDF escaneado y todas las empresas

El PDF de bitácora semanal ahora usa **carta horizontal (11 × 8.5 pulgadas)** con **8 mm de margen imprimible** para que las impresoras no corten el Data Matrix. La pantalla **Escanear** acepta una **foto o un PDF**, incluso multipágina (hasta 16 páginas y 18 MB). La lectura PDF utiliza PDF.js bajo demanda, por lo que la primera vez puede necesitar internet.

En **Datos → Empresas**, las comparaciones y gráficas muestran **todas las empresas** (también con cero faltas o sin capturas); el **PDF estadístico** incorpora páginas adicionales de listado completo para evitar que se pierdan las entidades que no caben en una gráfica resumida.

## v0.57.2-beta.1 · Inicio y herramientas de Registro Dual

**Inicio más limpio:** tres indicadores uniformes (alumnos, semanas y avance de la última semana), y solo tres semanas recientes con acceso al historial completo. **Nueva barra lateral de accesos rápidos** en escritorio y panel desplegable en móvil, con Inicio, Semanas, Datos, Avisos PNG, Escáner, administración de alumnos, reportes y respaldos. **Recordatorios discretos de respaldo JSON** cuando existen cambios: sin alertas durante el escáner ni notificaciones del sistema, con controles para descargar o posponer. No se modifica la lógica de los registros.

Consulta [la documentación de v0.57.2](docs/V0572_INICIO_Y_RESPALDOS.md) para funcionamiento, condiciones, privacidad y compatibilidad.

## Corrección visual integral de v0.57.1-beta.1

**Registro Dual ahora utiliza el mismo diseño Apple Native + Editorial Glass en todas sus pantallas**, no solo en Estadísticas. Inicio, Semanas, Escáner, Alumnos, Formularios, Avisos PNG y Reportes PDF comparten materiales blancos translúcidos, bordes, jerarquía tipográfica y acciones uniformes. El hero de Datos se suavizó para que no se vea distinto al resto; la cámara conserva un fondo contrastado. El símbolo oficial Dual aparece también en la cabecera de escritorio.

Consulta [Sistema visual unificado](docs/V0571_UNIFIED_GLASS.md) para ver alcance y excepciones.

## Novedades de v0.57.1-beta.1

**Datos · Editorial Glass:** el módulo de Estadísticas estrena un hero de inspiración iOS con identidad Dual, fondo aqua y durazno, tipografía editorial, filtros de periodo en cápsulas y detalles plegables, tarjeta translúcida con cumplimiento real y anillo proporcional de entregas puntuales, tardías y pendientes. La vista Resumen tiene accesos breves a Asistencia, Empresas, Grupos, Alumnos e Histórico. En periodos sin registros aplicables, se muestra un estado sin datos en lugar de presentar una tasa ficticia de 0 %. Conserva la misma fuente de datos y los PDF existentes.

Ver [diseño y accesibilidad de Datos v0.57.1](docs/V0571_DATOS_EDITORIAL.md).

## Novedades de v0.57.0-beta.1

El subsistema **Registro de Bitácoras** incorpora una interfaz móvil tipo aplicación (Apple Native + Adaptive Pro) con barra inferior, vistas de semanas y herramientas, modo de presentación automático y opción manual. Estadísticas ahora se organiza mediante **seis secciones** para evitar desplazamientos innecesarios. Los reportes individuales incluyen un **Índice de Seguimiento Dual (0–100)** con una gráfica de sus componentes. El icono Dual oficial identifica el PWA independiente del generador principal.

Consulta [la documentación de Registro Dual v0.57](docs/V057_REGISTRO_DUAL.md) para conocer límites del índice, instalación, accesibilidad, privacidad y uso sin conexión.

## Qué es

**Generador de Bitácora Dual 2026** es un proyecto web local-first para elaborar bitácoras semanales de Educación Dual, generar su PDF y facilitar posteriormente el registro de entrega mediante Data Matrix.

El proyecto funciona sin cuentas y sin una base de datos central propia. El generador, el historial y el registro de entrega trabajan principalmente en el navegador de la persona usuaria.

### Componentes

| Componente | Función |
| --- | --- |
| **Generador** | Captura datos, jornadas, responsables y genera la bitácora en PDF. |
| **Perfil local** | Recuerda datos recurrentes del alumno para reducir captura repetitiva. |
| **Registro de entrega** | Mantiene una base local de alumnos, semanas y estados de recepción. |
| **Data Matrix** | Relaciona la bitácora con alumno, especialidad, empresa, periodo y un resumen compacto de jornadas. |
| **Reportes** | Genera listados por semana, historial y matriz global de entregas. |
| **Estadísticas** | Horas, jornadas, motivos, género, proporción por especialidad y acumulados históricos. El registro manual permite capturar jornadas incluso cuando la bitácora todavía no se entrega, sin alterar el cumplimiento. |
| **Presentación** | Landing ES/EN/DE que explica el proyecto, muestra testimonios reales en carrusel y las rutas para adoptarlo o colaborar. |
| **Debug** | Área interna para probar módulos, efemérides, cámara, PDF, notificaciones y vistas adaptables. |

## Funciones principales

- PDF A4 horizontal preparado para el formato de bitácora actual.
- Jornadas de martes a viernes, estados especiales y validaciones antes de exportar.
- Motivos frecuentes opcionales para **Falta** y **Sin labores**, con justificaciones editables y confirmación antes de reemplazar texto personalizado. Los catálogos están en [`absence-reasons.json`](src/data/absence-reasons.json) y [`non-working-reasons.json`](src/data/non-working-reasons.json); consulta las guías de [Falta](docs/MOTIVOS_FRECUENTES_FALTA.md) y [Sin labores](docs/MOTIVOS_FRECUENTES_SIN_LABORES.md).
- Historial, borrador, respaldos e importación local.
- Acceso discreto a bitácoras anteriores desde la barra superior, con contador compacto, revisión de sólo lectura y retorno directo al paso 5 para volver a descargar el PDF.
- Landing pública disponible en español, inglés y alemán; la versión alemana usa terminología contextual de la **duale Berufsausbildung** y **Ausbildungsnachweis (Berichtsheft)**. Las aplicaciones operativas permanecen en español.
- Efemérides visuales del calendario: enero conserva **Nuevo año, nueva bitácora** con el año actual calculado automáticamente, diciembre mantiene una ambientación ligera, Halloween aparece el 31 de octubre y **Día de Muertos** el 1 y 2 de noviembre; las efemérides históricas muestran automáticamente el número de aniversario correspondiente.\n- Perfil con Blobatar y datos recurrentes.
- Corrector ortográfico opcional procesado localmente, con diccionario adicional para catálogos institucionales y vocabulario técnico de programación, contabilidad, RH, IA, e-commerce, ciberseguridad, datos, diseño y gestión.
- Firma genérica opcional del alumno.
- Data Matrix versionado en las bitácoras, con bloque estadístico compacto S5 y lectura compatible con códigos anteriores.
- Estadísticas semanales, mensuales y generales desde Registro de entrega, con filtros y PDF de descarga directa. El PDF incluye cuatro páginas, con proporciones por especialidad y consolidado de horas de todo el Dual.
- Captura manual de las jornadas, las horas, las causas y el método de elaboración de cada entrega.
- Importación masiva de listados Excel o CSV institucionales con encabezados desplazados, revisión previa y control de duplicados.
- Navegación directa entre Inicio, Alumnos, Semanas y Estadísticas. El género sólo se edita en el registro institucional.
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
| [Motivos frecuentes de falta](docs/MOTIVOS_FRECUENTES_FALTA.md) | Agregar, cambiar, ordenar o retirar motivos precargados de ausencia. |
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

### Registro móvil de jornadas

Desde **Registro de entrega**, selecciona el estado **A tiempo**, **A destiempo** o **No entregado**, o utiliza el botón visible **Horas y jornadas** de cada alumno. Se abre una captura adaptada a teléfono para indicar el método de elaboración, los estados de martes a viernes y las horas o motivos. **No aplica** excluye la jornada de las estadísticas y requiere confirmar la eliminación si ya había horas guardadas. Se pueden guardar entregas sin jornadas cuando aún no se dispone de datos; nunca se presupone que faltan cero horas. Las horas de registros «No entregado» capturadas se muestran de forma independiente y no mejoran el porcentaje de cumplimiento.

### Estadísticas animadas

Al abrir **Estadísticas**, las tarjetas aparecen progresivamente, las cifras muestran un conteo hasta su valor real y las gráficas se dibujan al entrar en pantalla. Al cambiar periodo, semana, especialidad o empresa, los resultados se actualizan con una transición breve. Si el dispositivo tiene activado **Reducir movimiento**, las cifras y las gráficas se muestran de inmediato sin animaciones. Estas mejoras no afectan los datos guardados ni los reportes PDF.

### Faltas académicas y captura semanal · v0.52.4

El catálogo de **Falta** ofrece motivos separados por fase local, estatal y nacional para el Concurso Nacional de Prototipos y Proyectos de Emprendimiento, el Festival Académico y el Encuentro Nacional de Arte y Cultura (ENAC). Los nueve motivos tienen identificadores permanentes y códigos del 20 al 28, compatibles con el Data Matrix estadístico.

Al crear una semana, puedes pulsar **Crear y capturar jornadas** para registrar o modificar las horas, faltas y causas de cada alumno. La ventana permite **Guardar y siguiente**, **Omitir alumno** y **Terminar**. El mismo recorrido puede iniciarse desde **Capturar jornadas** en una semana abierta. Las entregas guardadas en este flujo se registran como **manuales**, independientemente de su origen previo, y las horas de una semana no entregada no la convierten automáticamente en entregada.

### Motivos de concursos simplificados · v0.52.5

Los nueve motivos de faltas por concursos muestran nombres breves en los desplegables, por ejemplo «Festival Académico · Estatal» o «ENAC · Nacional». El texto de la bitácora indica simplemente la participación en el evento y su fase, sin repetir explicaciones sobre la inasistencia. Los IDs y códigos 20–28 permanecen intactos para preservar las bitácoras, estadísticas y Data Matrix anteriores.

### Firmas P. A. (por ausencia de) · v0.53

En **Responsables** puedes activar **P. A. · Por ausencia de** para la firma de **Autorizó** de la empresa y, por separado, para el **Instructor formador**. Cada opción ofrece el mismo listado de personal de la empresa o captura personalizada del suplente, incluido su cargo. Los datos del titular no se reemplazan: se conservan en la bitácora y en el perfil. En la vista previa y en el PDF, el espacio de firma muestra el nombre del suplente, su cargo y la leyenda **P. A. de [titular]**. Sin la opción activada, las firmas funcionan como antes. Los respaldos antiguos siguen siendo compatibles.

### Estadísticas nominales y seguimiento de pendientes · v0.54

En **Registro de entregas → Estadísticas** hay un apartado con comparaciones de **menor cumplimiento**, **más faltas**, **menos faltas**, **mayor puntualidad** y **más horas registradas**. En cada persona se muestra su base de cálculo: semanas vencidas o jornadas con información. Si más de tres alumnos empatan con el mínimo de faltas, la interfaz lo señala y permite ver a todas las personas.

Las comparaciones admiten filtros de periodo, empresa, especialidad y grupo, junto con un desglose dinámico por empresa, especialidad o grupo. La vista **General** incorpora un **historial interno de entregas pendientes** con búsqueda, nivel de atraso y detalle de semanas. El historial no es un buró de crédito ni califica permanentemente a nadie: al capturar una entrega, deja de figurar como pendiente.

Solo se consideran vencidas las semanas con fecha límite superada, periodo concluido o cierre manual; se excluyen las semanas futuras, las entregas «No aplica» y los alumnos desistidos del seguimiento activo. Un alumno sin estadísticas de jornadas no se considera con cero faltas. El PDF institucional incorpora una quinta página de seguimiento por persona. Esta información nominal está destinada exclusivamente al uso administrativo autorizado del plantel y debe manejarse con confidencialidad.

### Expediente individual e historial completo · v0.55

En **Registro de entregas → Estadísticas → Expediente individual** se puede buscar y seleccionar a cualquier alumno, incluido quien haya desistido, para consultar su historial longitudinal completo. La ficha muestra identificadores escolares (especialidad, empresa y grupo), semanas cuyo plazo venció, entregadas a tiempo o tarde, pendientes, «No aplica» y futuras; tasas con su base de cálculo; horas totales, mínimas, máximas y promedio por semana con datos; días conocidos y asistencia; motivos registrados, evolución mensual y todas las semanas en una lista desplegable con detalles diarios. También puedes abrir la ficha pulsando los nombres en las comparaciones y en el historial general.

El historial no es una calificación crediticia ni un score permanente. No se inventan faltas u horas en semanas sin estadísticas ni se confunde el incumplimiento con un periodo aún en plazo. Corrige las entregas en el registro para actualizar la ficha. Los datos personales permanecen sujetos al acceso administrativo local y deben tratarse como confidenciales.

En el paso **Responsables**, la firma **P. A.** se selecciona mediante una casilla discreta, sin recuadro azul. Su leyenda predeterminada es **«P. A. · Por ausencia del titular»** y el PDF consigna **«P. A. · Por ausencia del [nombre]»**, sin modificar al firmante suplente ni al titular guardados.

### PDF individual y estadísticas móviles · v0.55.1

En **Registro de entregas → Estadísticas → Expediente por alumno**, busca o selecciona una persona: la selección descarga directamente el **expediente individual en PDF**, sin abrir un panel largo en el teléfono. También puedes pulsar cualquier nombre de las clasificaciones o del historial de pendientes para descargarlo. Los indicadores generales y las comparaciones por empresa, especialidad y grupo permanecen disponibles.

El documento incluye el **Blobatar** del alumno, resumen del cumplimiento y faltas, horas, actividad mensual, motivos registrados y detalle de cada jornada, repartido automáticamente en tantas páginas como sea necesario. La última página nominal del PDF general también utiliza Blobatar para distinguir alumnos. El informe se genera localmente en el navegador con los datos del registro; no requiere subir información de los estudiantes.

El módulo de Estadísticas ajusta las tarjetas, filtros, tablas y controles para móviles y tabletas. Las tablas horizontales se desplazan dentro de su panel, sin hacer que toda la página desborde. Para registros incompletos se mantiene la distinción entre cero y dato no capturado.

### Expediente compacto y listados de alumnos · v0.55.2

En **Registro de entregas → Estadísticas → Expediente por alumno**, el PDF individual utiliza ahora A4 horizontal, logotipo oficial en todas las páginas y Blobatar del alumno. La primera hoja reúne cumplimiento, puntualidad, pendientes, horas y faltas; incluye una **interpretación automática breve** basada en las semanas vencidas y las jornadas capturadas. Una matriz por meses muestra cada semana con una clave visual para «a tiempo», «tarde», «pendiente vencida», «en plazo» y «no aplica». Las hojas posteriores muestran todas las semanas en tablas compactas que continúan automáticamente. El encabezado no incluye folio, fecha de emisión ni última actualización.

En **Alumnos**, debajo del contador de alumnos activos, aparece **Lista de alumnos en PDF**: elige **orden alfabético, por especialidad o por empresa**, además de «solo activos» o «activos y desistidos». El PDF utiliza el logotipo oficial y Blobs con el nombre, especialidad, empresa, grupo y situación de cada alumno; continúa en otras páginas si es necesario. Todos los PDF se generan localmente en el navegador. No se modifica ningún registro al imprimir o descargar listas.

### Reportes y anuncios · v0.56.0

**Reportes** concentra las descargas PDF desde el inicio del Registro de entregas: listado de una semana, historial semana por semana, global, **expediente individual**, listas de alumnos y reporte estadístico. En Estadísticas ya no se descarga el expediente: pulsar el nombre de cualquier alumno abre Reportes con la persona seleccionada. El informe individual ahora es **A4 vertical**, conserva el logotipo institucional y muestra las semanas según sus nombres reales abreviados (por ejemplo «Semana 20» → **S20**), junto con las interpretaciones, el histórico y los estados originales.

**Estadísticas** presenta explicaciones breves calculadas a partir de los datos del periodo; el PDF general incorpora mini interpretaciones en sus páginas. El «Historial de entregas pendientes» muestra solamente a alumnos con **dos o más** semanas vencidas sin entregar. Este umbral no altera los indicadores generales ni los datos guardados. Las cifras principales tienen mayor jerarquía visual y diseño adaptado a móvil.

**Anuncios** es una nueva sección accesible desde Inicio: reúne recordatorios automáticos de semanas con plazos próximos, avisos personalizados y novedades de la aplicación. Se puede elegir destinatario (todos, empresa, especialidad o alumno), fijar caducidad, editar y eliminar avisos y revisar una vista previa. Los mensajes se guardan en el **registro local y en sus respaldos**, no se envían a otros dispositivos ni crean notificaciones remotas. El inicio muestra hasta tres avisos recientes y el acceso al centro de anuncios. Los anuncios se normalizan al importar y no requieren migrar el esquema anterior.

### Generador de avisos PNG · v0.56.1

En **Registro de entregas → Avisos PNG** hay un estudio para crear imágenes listas para compartir. La pestaña **Automáticos** convierte las fechas límite de las semanas próximas y el anuncio de la versión actual en imágenes. Se pueden descargar por separado o juntas en un ZIP. Los avisos guardados en versiones anteriores permanecen disponibles para editar y exportar también.

La pestaña **Crear aviso** contiene plantillas para recordatorios de entrega, comunicados escolares, novedades del Generador y avisos personalizados. Puedes ajustar título, subtítulo, mensaje, destinatario, fecha visible y pie. La **vista previa en vivo** utiliza el logotipo oficial y permite elegir tres formatos PNG (**1080×1080**, **1080×1350** y **1080×1920**) con tres estilos. El botón **Guardar diseño** mantiene el aviso en el registro y sus respaldos. **Descargar PNG** genera el archivo en el navegador; **Descargar todos · ZIP** agrupa los avisos listos para compartir.

No se envían automáticamente mensajes a otros dispositivos. Si un aviso contiene nombres personales o datos escolares, revisa el destinatario antes de compartirlo. Los avisos antiguos se mantienen compatibles y el esquema del registro no se modifica.
