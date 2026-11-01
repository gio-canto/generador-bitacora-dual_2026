# Clasificación de motivos y avisos internos (v0.59)

## Editor del alumno
El alumno elige **Falta** o **Sin labores** y redacta su justificación. El reconocimiento se ejecuta localmente en su navegador, a partir de `src/data/absence-reasons.json` y `src/data/non-working-reasons.json`. Acepta frases con mayúsculas o acentos indistintamente. Si encuentra una coincidencia confiable, la asocia a su código; si no, la jornada queda como **Otro motivo** (código 63).

Los catálogos permiten editar `keywords`, `excludeKeywords` y `priority` sin tocar el componente. Las palabras clave son frases; evita palabras generales como «día», «evento» y «trabajo». Los códigos existentes (1–62) y el 63 reservado no deben alterarse. Si agregas un motivo, asigna un código nuevo y único menor que 63.

La clasificación **no** comprueba si la causa fue autorizada ni determina si un día era inhábil. El alumno sigue seleccionando el tipo de jornada y conserva la posibilidad de elegir manualmente el motivo. **Día de Muertos** y otras conmemoraciones pueden identificar el motivo de **Sin labores**, pero no convierten por sí mismas una fecha en **Día inhábil escolar**.

## Registro Dual: campanita de avisos
En la cabecera aparece una campanita con la cantidad de asuntos pendientes. Se muestran los registros con código 63 de **Falta** o **Sin labores**, identificados por alumno, semana y día. El administrador consulta la bitácora física o PDF y decide:
- **Conservar como Otro motivo:** deja constancia de que fue revisado y lo retira de pendientes.
- **Reclasificar:** selecciona una causa del catálogo correspondiente. Sólo cambia el motivo de esa jornada; las horas, el estado de la jornada y la fecha de entrega permanecen intactos.

La revisión se guarda dentro de `statistics.entries` como `reasonReview` y `reasonReviewedAt`. Los respaldos JSON preservan las decisiones. Las estadísticas se calculan con el código actualizado. Si se vuelve a capturar una bitácora diferente, puede generarse un nuevo aviso.

El Data Matrix **BD26|4** / **S5** contiene estados, horas y códigos de causa, **no** contiene el texto justificativo. No se realiza OCR en esta versión. El administrador nunca debe adivinar la causa leyendo sólo el código 63.

## Verificación
Ejecuta `npm run check`. Se incluyen pruebas para reconocimiento, negaciones, días conmemorativos, huracanes, Data Matrix y conservación de los estados revisados. No se requiere ninguna cuenta externa ni servicio de IA.
