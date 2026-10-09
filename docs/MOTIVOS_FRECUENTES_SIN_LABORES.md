# Motivos frecuentes de «Sin labores»

El catálogo de motivos que aparece cuando una jornada se marca como **Sin labores** se encuentra en:

```text
src/data/non-working-reasons.json
```

Es independiente de `src/data/absence-reasons.json`, que corresponde al estado **Falta**. No es necesario modificar la lógica del editor.

## Agregar, editar o quitar motivos

Cada objeto del catálogo tiene solamente tres campos:

```json
{
  "id": "facility_maintenance",
  "label": "Mantenimiento de instalaciones",
  "text": "La empresa suspendió las actividades por trabajos de mantenimiento en sus instalaciones durante el horario previsto."
}
```

- **Agregar:** copia un objeto, sepáralo con una coma y cambia `id`, `label` y `text`.
- **Renombrar:** modifica sólo `label`. Conserva el `id` siempre que sea posible.
- **Cambiar el texto:** modifica sólo `text`. El alumno podrá editarlo después de elegir el motivo.
- **Ordenar:** mueve el objeto completo dentro del archivo JSON. El selector respeta ese orden.
- **Eliminar:** borra el objeto completo y corrige la coma si es necesario.

El `id` debe ser único y contener sólo minúsculas, números o guiones bajos. El `text` debe ser legible y tener al menos cuatro palabras. Evita incluir datos personales o afirmar autorizaciones que no constan.

Al terminar, ejecuta `npm run check`. La prueba `tests/non-working-reasons.test.js` revisa los datos del catálogo.

## Uso correcto del estado

Marca **Sin labores** cuando la empresa u organismo receptor suspendió las actividades correspondientes al alumno por mantenimiento, paro, evento, cierre, desastre natural, descanso interno u otra situación de la empresa.

Algunos descansos provienen del **calendario laboral o de acuerdos internos de la empresa** y no necesariamente coinciden con el calendario del CBTis. No se trata de agregar nuevos días inhábiles escolares.

- **Día inhábil:** corresponde a una fecha contemplada como tal en el calendario escolar aplicable.
- **Falta:** la empresa sí tuvo labores, pero el alumno no asistió.
- **Con labores:** el alumno sí realizó actividades, aunque algún departamento estuviera cerrado.

Los motivos son sólo textos sugeridos, no declaraciones automáticas de autorización. Al cambiar el motivo el generador pide confirmación si ya existe una justificación escrita por el alumno. La justificación final se guarda como texto normal: cambiar el catálogo no modifica bitácoras anteriores ni los PDF ya generados.
