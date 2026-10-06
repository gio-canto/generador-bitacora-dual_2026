# Catálogos de escuelas y empresas

Los catálogos son la configuración institucional compartida del proyecto. Se editan en Git y se publican junto con la aplicación.

```text
src/data/schools.json
src/data/companies.json
```

No existe una pantalla pública para modificar estos catálogos globales desde el navegador.

## Cuándo usar catálogos

Usa los JSON cuando el formato actual ya sirve y sólo necesitas cambiar o agregar datos precargados.

Si necesitas alterar jornadas, campos, firmas, orientación o estructura del PDF, consulta [IMPLEMENTAR_INSTITUCION.md](IMPLEMENTAR_INSTITUCION.md).

## Escuelas

Esquema:

```json
{
  "id": "plantel-ejemplo",
  "name": "NOMBRE OFICIAL DEL PLANTEL",
  "shortName": "Plantel Ejemplo",
  "voboName": "Nombre verificado",
  "voboRole": "Cargo institucional\nPlantel Ejemplo",
  "specialties": ["Programación"],
  "semesters": ["4", "5", "6"],
  "groups": ["A", "B"]
}
```

| Campo | Obligatorio | Uso |
| --- | --- | --- |
| `id` | Sí | Identificador estable del catálogo. |
| `name` | Sí | Nombre institucional completo. |
| `shortName` | No | Nombre compacto para espacios reducidos y firmas. |
| `voboName` | Según formato | Persona sugerida para visto bueno. |
| `voboRole` | Según formato | Cargo, admite `\n`. |
| `specialties` | Sí | Opciones de especialidad/carrera. |
| `semesters` | Sí | Opciones de semestre o grado soportadas. |
| `groups` | Sí | Grupos disponibles. |

### Reglas de ID

Un ID debe:

- ser único;
- permanecer estable;
- usar minúsculas y guiones cuando sea posible;
- no contener matrícula, correo, CURP u otro dato personal;
- no cambiar sólo porque cambió la forma de escribir el nombre institucional.

## Empresas

Esquema:

```json
{
  "id": "empresa-ejemplo",
  "name": "Nombre oficial de la organización",
  "shortName": "Nombre corto",
  "start": "09:00",
  "end": "14:00",
  "area": "Área de Informática",
  "instructorEnabledByDefault": false,
  "representatives": [
    {
      "name": "Nombre verificado",
      "role": "Cargo real"
    }
  ],
  "instructors": [
    {
      "name": "Nombre verificado",
      "roleMain": "Cargo real"
    }
  ]
}
```

| Campo | Obligatorio | Uso |
| --- | --- | --- |
| `id` | Sí | Identificador estable. |
| `name` | Sí | Nombre o razón social mostrada. |
| `shortName` | No | Variante compacta. |
| `start` | Sí | Hora sugerida `HH:mm`. |
| `end` | Sí | Hora sugerida `HH:mm`. |
| `area` | Sí | Área inicial sugerida. |
| `instructorEnabledByDefault` | Sí | Estado inicial de la sección de instructor. |
| `representatives` | Sí | Lista; puede ser `[]`. |
| `instructors` | Sí | Lista; puede ser `[]`. |

`end` debe ser posterior a `start` dentro del flujo actual.

## Nombre corto

`shortName` no sustituye al nombre legal u oficial. Se usa cuando el espacio del documento es limitado.

Si no existe una abreviatura oficial o conveniente, puede omitirse y el sistema utilizará el nombre completo como respaldo.

## Responsables e instructores

Sólo deben precargarse personas cuya publicación en el catálogo sea apropiada y cuyos datos estén verificados.

Si una organización cambia frecuentemente de responsable o no desea publicarlo, usa una lista vacía y deja la captura manual.

## Agregar una entrada

1. Copia un objeto existente del mismo tipo.
2. Asigna un `id` nuevo.
3. Sustituye todos los datos.
4. Revisa comas y estructura JSON.
5. Ejecuta `npm run check`.
6. Prueba el selector y el PDF.
7. Actualiza versión y `CHANGELOG.md`.

## Modificar una entrada existente

Conserva el `id` salvo que exista un motivo técnico documentado para migrarlo.

Cambiar nombre, cargo, horario o lista de opciones no requiere crear otra entidad si sigue siendo la misma institución u organización.

## Datos que no pertenecen al catálogo

No agregues:

- alumnos;
- matrículas;
- actividades;
- entregas;
- firmas;
- respaldos;
- información sensible;
- datos temporales de una sola persona.

## Logo y formato

El recurso `public/Assets/Edu.png` se conserva para el formato de la bitácora/PDF. Las barras de navegación mantienen por ahora un espacio de identidad vacío y no muestran ese logotipo.

Si necesitas identidad por plantel o un formato diferente, no lo resuelvas añadiendo campos arbitrarios al JSON sin diseñar primero la compatibilidad. Sigue [IMPLEMENTAR_INSTITUCION.md](IMPLEMENTAR_INSTITUCION.md).
