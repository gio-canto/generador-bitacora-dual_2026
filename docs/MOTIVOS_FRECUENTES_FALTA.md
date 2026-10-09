# Motivos frecuentes de falta

Los motivos frecuentes que aparecen cuando una jornada se marca como **Falta** se administran desde un único catálogo:

```text
src/data/absence-reasons.json
```

No es necesario editar `src/legacy/editor.js` para agregar, cambiar, ordenar o retirar un motivo.

## Estructura

Cada motivo tiene tres campos:

```json
{
  "id": "medical_appointment",
  "label": "Cita médica",
  "text": "Inasistencia debida a una cita médica previamente programada que coincidió con el horario de actividades."
}
```

| Campo | Uso |
| --- | --- |
| `id` | Identificador interno estable. Debe ser único y usar minúsculas, números o guion bajo. |
| `label` | Texto corto que ve el alumno en el selector. |
| `text` | Justificación que se copia al campo editable cuando se elige el motivo. |

## Agregar un motivo

1. Abre `src/data/absence-reasons.json`.
2. Copia uno de los objetos existentes.
3. Separa el nuevo objeto con una coma.
4. Cambia `id`, `label` y `text`.
5. Guarda el archivo y ejecuta `npm run check`.

Ejemplo:

```json
{
  "id": "public_transport_suspension",
  "label": "Suspensión del transporte público",
  "text": "Inasistencia debida a la suspensión del servicio de transporte público, lo que impidió realizar el traslado hacia la empresa."
}
```

El lugar donde insertes el objeto determina su posición en el selector.

## Cambiar el nombre visible

Para cambiar lo que aparece en el selector, modifica sólo `label`.

Antes:

```json
"label": "Problemas de transporte"
```

Después:

```json
"label": "Incidente de transporte"
```

No cambies el `id` sólo por cambiar el nombre visible.

## Cambiar la justificación

Modifica únicamente `text`. El alumno seguirá pudiendo editar libremente la redacción después de elegir el motivo.

Procura que la redacción:

- sea clara y administrativa;
- tenga al menos cuatro palabras;
- no afirme que la falta fue autorizada;
- no incluya información personal específica;
- no repita innecesariamente “jornada de Educación Dual”.

## Cambiar el orden

Mueve el objeto completo dentro del arreglo JSON. El selector respeta exactamente el orden de `absence-reasons.json`.

## Eliminar un motivo

Elimina el objeto completo y corrige la coma del objeto anterior o siguiente.

Eliminar un motivo **no modifica bitácoras ya guardadas**, porque una vez elegido el motivo la justificación se conserva como texto normal dentro de la jornada.

## Sobre el `id`

El `id` debe mantenerse estable siempre que sea posible.

Formato permitido:

```text
medical_appointment
school_activity
public_transport_suspension
```

Evita espacios, acentos, mayúsculas o identificadores repetidos.

## Comprobaciones automáticas

La suite valida el catálogo para evitar errores comunes:

- JSON válido;
- IDs únicos;
- IDs con formato seguro;
- etiquetas no vacías;
- justificaciones no vacías y suficientemente largas.

Después de cualquier cambio ejecuta:

```bash
npm run check
```

También conviene abrir una jornada, marcar **Falta**, elegir el motivo modificado y comprobar que el texto se inserte y siga siendo editable.

## Qué no debes modificar

Para cambios normales del catálogo no es necesario tocar:

- `src/legacy/editor.js`;
- el generador de PDF;
- almacenamiento;
- perfiles;
- validaciones de jornada.

El editor consume automáticamente el catálogo.
