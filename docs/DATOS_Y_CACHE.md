# Datos, almacenamiento y respaldos

## Principio general

El proyecto es local-first. No existe una cuenta obligatoria ni una base central propia donde el mantenedor reciba automáticamente las bitácoras.

Los datos se dividen entre:

- almacenamiento del navegador;
- archivos exportados por la persona usuaria;
- caché de recursos de la aplicación.

Estas tres cosas no son equivalentes.

## Generador

Claves principales:

| Clave | Contenido |
| --- | --- |
| `bitacora_dual_clean_v3` | Historial de bitácoras. |
| `bitacora_dual_draft_v1` | Borrador actual. |
| `bitacora_profile_v1` | Datos recurrentes y preferencias del perfil local. |

Existen claves de versiones anteriores usadas únicamente para recuperación o migración. No deben reutilizarse como formatos nuevos.

### Historial

Guardar o descargar una bitácora puede incorporarla al historial local. El historial puede exportarse como respaldo.

Las bitácoras anteriores pueden consultarse desde **Bitácoras anteriores** en la barra superior o desde **Registros guardados** en el paso 5. La revisión es de sólo lectura: no sustituye el borrador actual ni carga el registro en el formulario. Desde la revisión, **Volver a descargar PDF** carga explícitamente ese registro y lleva al paso 5. La zona de administración conserva además la apertura para edición, duplicado y eliminación.

### Borrador

El borrador permite continuar una captura interrumpida. Una actualización de assets no debe borrarlo.

### Perfil

El perfil recuerda datos recurrentes como:

- nombre;
- plantel;
- especialidad;
- semestre/grado;
- grupo;
- empresa;
- horario;
- área;
- responsables;
- instructor;
- preferencias recurrentes.

No sustituye al historial y no debe contener actividades semanales como fuente canónica.

## Registro de entrega

Clave actual:

```text
bitacora_dual_delivery_registry_v9
```

Las claves `v1` a `v8` pueden leerse para migración.

El estado contiene, entre otros:

- plantel;
- generación dual;
- alumnos;
- especialidad y empresa por alumno;
- semanas;
- periodo;
- fecha límite;
- estado de cierre;
- estado del alumno en Dual (activo o desistido) y fecha de desistimiento;
- entregas por alumno;
- fecha/hora;
- origen de registro;
- versión de código y resumen opcional de jornadas en las entregas;
- género opcional y grupo desde el padrón;
- método de elaboración para cada entrega manual (`generator` u `other`);
- estadísticas diarias capturadas manualmente o procedentes del Data Matrix;
- campos heredados de utilización sin atribución automática desde el padrón;
- estado de entrega: a tiempo, a destiempo, no entregado o **No aplica**.

**No aplica** se conserva como un estado explícito por alumno y semana. Indica que esa persona no tenía obligación de entregar en ese periodo, por lo que se excluye del denominador utilizado para calcular el porcentaje de cumplimiento.

## Respaldo portátil

**Guardar archivo** en el registro de entrega genera un JSON que contiene el estado editable completo del subsistema.

Ese JSON es el respaldo recomendado para mover o conservar el registro.

El CSV es una exportación de consulta y no conserva toda la estructura necesaria para restaurar el sistema.

## PDF

El PDF es el documento final de una bitácora o reporte. No debe considerarse respaldo editable del historial.

## Service worker y caché

La caché contiene HTML, JS, CSS y otros recursos necesarios para abrir una versión de la aplicación.

**La caché no es un respaldo.**

Borrar caché puede obligar a descargar nuevamente la aplicación. Borrar los datos completos del sitio sí puede eliminar historial, borrador, perfil y registro local según lo que el navegador incluya en esa operación.

## Migraciones

Cuando cambie un esquema persistente:

1. crea una nueva clave o versión de esquema cuando corresponda;
2. lee el formato anterior;
3. convierte a la estructura actual;
4. conserva datos que aún tengan significado;
5. evita sobrescribir silenciosamente una copia anterior si puede servir para recuperación;
6. agrega pruebas de migración;
7. documenta la migración en CHANGELOG y aquí.

## Data Matrix

El Data Matrix contiene información necesaria para identificar la bitácora y su periodo.

El formato actual conserva el encabezado `BD26|4` con identidad, especialidad, empresa y fechas. Añade opcionalmente `S5:` seguido de 14 caracteres Base64URL (10 bytes) con estados, minutos y códigos numéricos de causas para cuatro jornadas. La codificación ocupa un solo bloque añadido al final y los lectores antiguos siguen leyendo los siete campos originales. Los códigos anteriores carecen de las estadísticas nuevas y se mantienen sin datos para esos indicadores. El género nunca se incluye en Data Matrix.

El contenido del Data Matrix no debe incluir secretos ni información innecesaria. Tampoco debe copiarse en diagnósticos públicos.

## Coincidencias aproximadas

El registro prioriza el nombre exacto y acepta la inversión entre grupos de nombres y apellidos (por ejemplo, «Gio Antonio Canto Gómez» y «Canto Gómez Gio Antonio»), sin modificar el alumno o el Data Matrix. Para asociar automáticamente un código de versión 3 o 4 se exige una coincidencia única que también corresponda en especialidad y empresa. Si hay más de un candidato, o si el código es antiguo y sólo contiene el nombre, el lector pide confirmación. Las diferencias pequeñas de ortografía siguen generando sugerencias.

La sugerencia:

- no modifica al alumno;
- no corrige el Data Matrix;
- no registra automáticamente;
- requiere confirmación explícita.

La asociación confirmada puede recordarse durante la sesión de escaneo para evitar preguntas repetidas.

## Exportar antes de operaciones destructivas

Antes de:

- limpiar datos del sitio;
- cambiar de dispositivo;
- reinstalar navegador;
- realizar una migración manual;
- probar cambios de persistencia;

exporta el respaldo correspondiente.

## Privacidad

Los archivos descargados quedan bajo control de quien los conserva. No subas respaldos ni bitácoras reales al repositorio.

Consulta [../SECURITY.md](../SECURITY.md).

## Acumulado histórico de Educación Dual

El panel y el PDF calculan las horas históricas a partir de las entregas con estadísticas válidas de jornada. El consolidado incluye todas las semanas almacenadas del alumno, incluso si ha desistido. Si existen varias semanas con la misma fecha inicial y entrega para un mismo alumno, se conserva únicamente el registro válido más reciente. Los códigos anteriores que no contienen estadísticas de jornada no se convierten en cero horas.

La proporción por especialidad usa el padrón de alumnos activos. El promedio, mediana, mínimo, máximo y rango de horas se calculan por alumno sobre quienes tienen al menos una semana con estadísticas registradas. Las jornadas con cero horas efectivamente registradas permanecen en el cálculo. Los filtros de especialidad y empresa también afectan el consolidado, pero los filtros de mes o semana no limitan su acumulación histórica.

## v0.52.2: jornadas capturadas sin bitácora entregada

El estado `no_entregado` puede guardarse con un resumen de jornadas, horas y método de elaboración. Su presencia **no equivale a una entrega recibida**: sigue contando en pendientes y en el denominador de cumplimiento. Si contiene estadísticas válidas, esas horas se incluyen en las estadísticas de actividad y se identifican separadamente como «pendientes con horas». `no_aplica` no admite estadísticas; el administrador debe confirmar cualquier eliminación de jornadas existentes al seleccionar este estado. Las semanas antiguas sin jornadas no representan cero horas trabajadas. Se mantiene `schemaVersion: 9`, con retrocompatibilidad de registros anteriores.
