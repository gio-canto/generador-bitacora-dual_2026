# Clasificación de motivos y avisos internos

## Alcance y responsables

La función se introdujo en **0.59.0**. Su mantenimiento se realiza desde dos aplicaciones conectadas por Data Matrix, pero con responsabilidades distintas:

- **Generador del alumno (`/`):** reconoce frases mientras el alumno escribe una justificación de **Falta** o **Sin labores** y guarda el motivo con las jornadas.
- **Registro Dual (`/registro-entrega/`):** recibe los códigos de causa de cada jornada. Una campanita ofrece al administrador la revisión de las causas identificadas como **Otro motivo** (código `63`).

No se requiere API externa ni un modelo de IA: es clasificación mediante **reglas locales**. La información escrita no se envía al administrador a través del código. El alumno elige **el estado de la jornada**; el clasificador **no decide** si una ausencia estuvo autorizada o si una fecha fue inhábil de manera oficial.

## Archivos y responsabilidades

| Archivo | Uso |
| --- | --- |
| `src/data/absence-reasons.json` | Motivos y frases reconocibles para **Falta**. |
| `src/data/non-working-reasons.json` | Motivos y frases reconocibles para **Sin labores**. |
| `src/services/reason-classifier.js` | Normalización, búsqueda de frases, exclusiones y resolución de coincidencias. |
| `src/legacy/editor.js` | Detección y mensaje visible al alumno; conserva la selección manual. |
| `src/services/matrix-statistics.js` | Códigos para el bloque `S5:` y lectura de motivos. |
| `src/services/reason-reviews.js` | Consulta de casos pendientes y actualización de una jornada revisada. |
| `src/components/ReasonInbox.jsx` | Campanita, bandeja y botones de revisión. |
| `src/delivery-reason-inbox.css` | Estilos de los avisos en escritorio y móvil. |
| `src/services/delivery-registry.js` | Persistencia de la decisión al normalizar, exportar o recuperar el registro. |
| `tests/v059-reason-classification.test.js` | Pruebas automáticas del motor, compatibilidad y revisiones. |

## Añadir o modificar palabras clave

Cada entrada de los dos catálogos conserva los campos `id`, `label`, `text` y `code`, y admite las propiedades opcionales `keywords`, `excludeKeywords`, `priority` y `requiresAny`. Ejemplo con la estructura real:

```json
{
  "id": "medical_appointment",
  "label": "Cita médica",
  "text": "Inasistencia debida a una cita médica previamente programada que coincidió con el horario de actividades.",
  "code": 1,
  "keywords": [
    "cita médica",
    "consulta médica",
    "consulta con el doctor"
  ],
  "excludeKeywords": [
    "cita cancelada"
  ],
  "priority": 10
}
```

| Propiedad | Efecto |
| --- | --- |
| `id` | Identificador de la causa; **no cambiarlo** en motivos existentes. |
| `label` | Nombre que aparece en los selectores y estadísticas. |
| `text` | Justificación sugerida que puede editar el alumno. |
| `code` | Número que se codifica en el Data Matrix; **no reutilizar ni cambiar códigos publicados**. |
| `keywords` | Frases completas que el detector busca en la justificación. |
| `excludeKeywords` | Si aparece cualquiera de estas frases, descarta ese motivo. |
| `priority` | Preferencia numérica para distinguir causas que coinciden a la vez. |
| `requiresAny` | Si se define, exige además la presencia de **al menos una** frase de esa lista. |

La normalización ignora diferencias de mayúsculas, acentos y puntuación, pero **no** interpreta sinónimos no incluidos ni sustituye una revisión humana. Las frases se buscan con límites de palabra: una palabra incluida dentro de otra no debe contar como coincidencia. La comprobación de negaciones es **limitada**; revisa términos concretos cercanos a la frase encontrada, no hace análisis gramatical completo.

En el algoritmo actual, entre candidatos coincidentes se calcula `priority * 1000 + longitud de la frase más específica`. Si dos motivos empatan exactamente, la detección devuelve `null`, en lugar de escoger arbitrariamente. Una prioridad alta puede desplazar otra coincidencia pertinente: por eso hay que probar expresiones superpuestas.

**Edición recomendada:** añadir frases específicas, por ejemplo «empresa cerrada por mantenimiento»; evitar palabras genéricas como «empresa», «día», «evento», «trabajo» y «lluvia». Al agregar una causa nueva, utilizar código único disponible entre `1` y `62` dentro del catálogo correspondiente. El `63` está reservado para «Otro motivo» y el `0` representa ausencia de clasificación.

## Qué se reconoce y qué NO se presupone

Los catálogos actuales incluyen, entre otros:

- **Faltas:** atención y cita médica, enfermedades, accidentes, asuntos familiares, exámenes universitarios, trámites, problemas de transporte, manifestaciones y concursos de Prototipos, Festival Académico y ENAC por etapa.
- **Sin labores:** huracanes y tormentas, lluvias, inundaciones, sismos, mantenimiento, suspensión de operaciones, paro laboral, fallas eléctricas, seguridad, capacitaciones, días festivos de empresa, conmemoraciones y vacaciones colectivas.

**Importante:** mencionar «Día de Muertos», «Día de las Madres» o cualquier otra celebración no crea un día inhábil oficial. La categoría `local_company_holiday` se consulta **únicamente si el estado seleccionado ya es Sin labores**. Un fenómeno meteorológico no implica automáticamente que la empresa estuviera cerrada; el estado seleccionado y los hechos de la bitácora deben reflejar lo ocurrido.

## Flujo del alumno y precedencia

1. El alumno marca la jornada **Falta** o **Sin labores**.
2. Escribe o modifica la justificación. El detector consulta **sólo** el catálogo de ese estado.
3. Si reconoce una causa, se actualizan `reasonId` y el indicador visible de detección. Si no, el motivo queda vacío y la codificación asigna `63` a una causa personalizada.
4. El alumno puede escoger manualmente un motivo frecuente. El editor marca `reasonMode: "manual"` y conserva esa elección al editar la redacción.
5. Si cambia de tipo de jornada, la selección anterior deja de ser válida y se vuelve a evaluar contra el nuevo catálogo.
6. Al construir el Data Matrix, `reasonFromEntry` prioriza `reasonId` válido; después compara el texto exacto sugerido y, por último, ejecuta el detector. Sin coincidencia retorna `63`.

Una selección manual de un motivo frecuente puede reemplazar la justificación con su texto predefinido **previa confirmación** si el alumno ya escribió texto propio. La clasificación automática **no reemplaza** el texto de la justificación.

## Flujo del administrador: campanita

La campanita **Avisos internos** aparece en la cabecera de Registro Dual, en las vistas permitidas, con contador de pendientes. Comparte bandeja con el recordatorio de respaldo cuando está activo. No es una notificación push ni un servicio de mensajes: es una vista del estado **local** almacenado en ese navegador.

Un caso pendiente se genera cuando existen estadísticas de jornada, el estado es `falta` o `sin_labores`, el `reasonCode` es `63` y `reasonReview` aún no es `kept`. Se muestra:

- alumno;
- semana;
- día de martes a viernes;
- tipo de jornada.

**Revisión:** abre la bitácora física o PDF y verifica el motivo antes de escoger una categoría. El **Data Matrix no incluye el texto de la justificación**.

- **Guardar clasificación:** utiliza un código válido del catálogo del estado registrado; en la entrega se actualizan `reasonCode`, `reasonId`, `reasonReview: "classified"` y `reasonReviewedAt`.
- **Revisado: conservar Otro motivo:** deja `reasonCode: 63`, marca `reasonReview: "kept"` y fecha de revisión. El asunto sale de la bandeja.
- La operación modifica exclusivamente la jornada seleccionada; no altera horas, condición de la jornada ni fecha de entrega.

La bandeja no realiza OCR ni obtiene automáticamente la redacción de la bitácora. Los registros antiguos que no traigan bloque `S5:` tampoco producen un motivo verificable; **no hay que inventar causas**.

## Compatibilidad, persistencia y respaldos

Se conserva el encabezado Data Matrix `BD26|4` y el bloque `S5:`, los estados y códigos existentes, y `bitacora_dual_delivery_registry_v9` con `schemaVersion: 9`. No se exige migración de esquema. Los nuevos datos administrativos se guardan como **campos opcionales dentro de `statistics.entries`**. Los respaldos JSON y su reimportación conservan la revisión cuando los datos permanecen válidos.

La clasificación realizada por el administrador **no se escribe de vuelta al PDF ya emitido** ni modifica el Data Matrix impreso. Las estadísticas del registro local emplean el código revisado. Una nueva captura de la jornada puede volver a necesitar revisión si se sustituyeron sus datos.

## Pruebas y mantenimiento

Ejecutar:

```bash
npm run check
```

Las pruebas automatizadas cubren coincidencias (citas, exámenes, concursos, Día de Muertos, huracanes, mantenimiento y fallas eléctricas), textos no reconocidos y frases negadas, compatibilidad `BD26|4`/`S5`, pendientes por jornada, reclasificación y persistencia. No prueban todas las combinaciones posibles de frases.

Revisión manual recomendada en escritorio y móvil:

1. Escribir una justificación conocida y verificar etiqueta y código en el Data Matrix.
2. Escribir una justificación sin coincidencia y comprobar que termina como «Otro motivo».
3. Seleccionar un motivo manualmente, editar la redacción y verificar que conserva `reasonId`.
4. Cambiar de **Falta** a **Sin labores** y verificar que no hereda una categoría incompatible.
5. Escanear o capturar una jornada `63`, abrir la campanita, reclasificarla o conservarla como otro y verificar su desaparición de pendientes.
6. Descargar y reimportar el JSON del registro: la decisión debe permanecer y las estadísticas reflejarla.
7. Confirmar que **Día inhábil**, horarios, PDF carta, reportes anteriores, móvil y escritorio siguen operando igual.

Utilizar únicamente datos ficticios en pruebas y PR; no subir bitácoras ni nombres reales de alumnos.

## Referencias

- [Catálogo de faltas](MOTIVOS_FRECUENTES_FALTA.md)
- [Catálogo de Sin labores](MOTIVOS_FRECUENTES_SIN_LABORES.md)
- [Arquitectura](ARQUITECTURA.md)
- [Datos, almacenamiento y respaldos](DATOS_Y_CACHE.md)
- [Pruebas](PRUEBAS.md)
- [Historial de cambios](../CHANGELOG.md)
