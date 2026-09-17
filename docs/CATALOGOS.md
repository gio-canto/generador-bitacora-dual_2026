# Editar catálogos

## Desde la aplicación

Abre **Catálogos**. Elige **Escuelas** o **Empresas**, selecciona un elemento y edítalo, o pulsa **Agregar**. Guarda cuando termines. Los datos de las bitácoras existentes no se reescriben.

En escuelas, escribe una especialidad, semestre o grupo por línea. Cada plantel tiene nombre completo, nombre corto y responsable de Vinculación. En empresas, define entrada, salida y área predeterminadas; agrega personas con nombre y cargo. Si hay varios representantes, el alumno debe elegir al que corresponda.

Estos cambios son locales. **Historial → Exportar respaldo** permite trasladar también los catálogos.

## Cambiar los valores para todas las personas

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

Después ejecuta `npm run check`. Los usuarios que hayan personalizado sus catálogos mantienen su copia local; un cambio en Git no la sobrescribe.

El logotipo compartido vive en `public/Assets/Edu.png`. Confirma que el formato corresponda a cada nuevo plantel antes de distribuirlo.
