# Editar catálogos en el código

No existe una pantalla de administración de catálogos para el usuario. Los campos del formulario siguen permitiendo ajustar la bitácora individual.

## Configuración compartida

Edita `src/data/schools.json` o `src/data/companies.json`. No hace falta modificar componentes React. Conserva los `id` existentes: identifican cada elemento. Usa un identificador nuevo para cada alta.

Ejemplo de empresa (datos ficticios; no pegar como información real):

```json
{
  "id": "empresa-ejemplo",
  "name": "Empresa de ejemplo",
  "start": "09:00",
  "end": "14:00",
  "area": "Área de Informática",
  "representatives": [
    { "name": "Persona de ejemplo", "role": "Jefatura de área\nJefe inmediato" }
  ],
  "instructors": [
    { "name": "Instructor de ejemplo", "roleMain": "Encargado de Informática" }
  ]
}
```

Ejemplo de escuela:

```json
{
  "id": "plantel-ejemplo",
  "name": "NOMBRE COMPLETO DEL PLANTEL",
  "shortName": "Plantel de ejemplo",
  "voboName": "Responsable de ejemplo",
  "voboRole": "Responsable de Vinculación\nPlantel de ejemplo",
  "specialties": ["Programación"],
  "semesters": ["4", "5", "6"],
  "groups": ["A", "B", "C", "D"]
}
```

Los horarios usan `HH:mm`, con salida posterior a entrada. Cada lista necesita al menos un elemento. Evita nombres repetidos. Los cargos admiten saltos de línea; el PDF reserva hasta cuatro líneas, incluida la empresa cuando corresponda. No inventes nombres, cargos ni relaciones de supervisión.

Después ejecuta `npm run check`. La configuración publicada se aplica a todos. Los registros existentes conservan sus propios datos. El selector de instructores precargados de la interfaz original corresponde a COCYTIEG; para otras empresas el instructor se captura manualmente.

El logotipo compartido vive en `public/Assets/Edu.png`. Confirma que el formato corresponda a cada nuevo plantel antes de distribuirlo.
