# Eventos especiales · versión 0.62.0

## Uso

El quinto estado **Evento especial** permite capturar Evento → Fase → Disciplina → Modalidad y editar la descripción. No reemplaza ni cambia el comportamiento de «Falta», «Sin labores» o «Día inhábil».

**Con labores:** el alumno también realizó trabajo Dual; se requieren horas de entrada y salida y el área, y únicamente esos minutos se contabilizan como trabajo.

**Sin labores:** el alumno participó en el evento y no realizó trabajo Dual; en el PDF se muestran guiones en horario y área. La modalidad habla del **alumno**, no de la apertura o cierre de su empresa.

El PDF imprime únicamente **EVENTO** como encabezado de la celda de actividades y no aplica fondo gris. Los eventos no se suman a las faltas. El aviso del Generador pide informar a Vinculación y al responsable correspondiente, sin dar por acreditada una autorización institucional.

## Archivo JSON y visibilidad por plantel

Todos los eventos del sistema están en `src/data/special-events.json`. Se editan y publican desde el repositorio, como los catálogos de faltas. No se modifican desde el navegador público.

Ejemplo de una entrada compartida:

~~~json
{
  "id": "festival",
  "code": 1,
  "label": "Festival Académico de la Dirección General de Educación Tecnológica Industrial y de Servicios",
  "schools": "all",
  "phases": ["local", "regional", "estatal", "nacional"],
  "disciplines": ["No aplica", "Pensamiento matemático", "Inglés"],
  "text": "Durante esta jornada participé en {evento}{fase}{disciplina}, realizando las actividades correspondientes."
}
~~~

Para mostrar un evento sólo en el CBTis No. 134, sustituye `"schools": "all"` por `"schools": ["cbtis-134"]`. Para varios planteles, agrega sus IDs en el mismo arreglo. Para excluir uno de un evento general, añade `"excludeSchools": ["id-del-plantel"]`. Los IDs se definen en `src/data/schools.json`.

### Campos admitidos

| Campo | Uso |
| --- | --- |
| `id` | Identificador único y estable, sin espacios. |
| `code` | Código único entre 1 y 62. El 63 se reserva para «Otros». |
| `label` | Denominación visible completa del evento. |
| `schools` | `"all"` o arreglo de IDs de plantel. |
| `excludeSchools` | Arreglo opcional de planteles donde no se mostrará. |
| `enabled` | `false` para ocultar un evento sin eliminar su historia. |
| `phases` | Fases disponibles del evento. |
| `disciplines` | Lista de modalidades; primera opción «No aplica», con hasta 31 adicionales. |
| `phaseTexts` | Objeto opcional con textos específicos por fase; cada clave debe coincidir con una fase de `phases`. |
| `text` | Texto sugerido editable, con `{evento}`, `{fase}` y `{disciplina}`. |

Fases válidas: `no_aplica`, `local`, `regional`, `estatal`, `nacional` e `internacional`. Declara sólo las etapas previstas en cada convocatoria.

### Agregar, editar y retirar eventos

1. Abre `src/data/special-events.json`.
2. Para agregar un evento, copia un objeto, cambia `id`, asigna un código libre y escribe `label` y `text`.
3. Configura `schools`, `phases` y `disciplines`. Para añadir una disciplina, colócala al final de la lista.
4. Para renombrar un evento, modifica sólo `label` y, si procede, `text`. Conserva su `id` y `code`.
5. Para retirarlo de nuevas capturas, usa `"enabled": false`; para excluir un plantel, usa `excludeSchools`.
6. Comprueba el JSON, ejecuta `npm run check` y registra el cambio en CHANGELOG y la nueva versión.

Cuando las etapas requieran redacciones distintas, agrega `phaseTexts` con claves como `"local"`, `"estatal"` y `"nacional"`; el Generador utilizará ese texto y, para las etapas sin redacción propia, conservará `text` como alternativa.

**No reutilices códigos ni reordenes o elimines disciplinas ya publicadas.** El Data Matrix almacena índices de disciplinas, por lo que el orden del catálogo afecta la lectura histórica.

### Otros

La opción `otros` tiene código 63. Solicita el nombre personalizado y permite indicar una disciplina libre. El nombre permanece en la descripción y el PDF, pero **no se incluye en el Data Matrix**. Registro Dual identificará el código «Otros» y podrá revisar el documento para conocer el título exacto.

## Compatibilidad y registro

Las semanas sin eventos siguen generando `BD26|4` con `S5:`. Las semanas con algún evento generan `BD26|5` con `S6:`.

S6 transporta el estado de cada jornada, minutos efectivamente trabajados, motivo del evento, fase, índice de disciplina del catálogo y modalidad. No incluye textos libres. Registro Dual lee ambas versiones, permite captura manual de eventos, conserva datos en JSON y contabiliza estas jornadas aparte de las faltas.

Los concursos registrados anteriormente como faltas **no se reclasifican automáticamente**. Los PDF históricos siguen siendo válidos.

## Pruebas

Ejecuta `npm run check` y revisa la interfaz en escritorio y móvil, disponibilidad por plantel, «Otros», aviso, descripción, horario y área con/sin labores, PDF sin sombreado, lectura de S5/S6, captura manual, estadísticas y recuperación de respaldos.
