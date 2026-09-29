# Implementar una institución o adaptar un formato

Esta guía cubre dos escenarios distintos:

- **Incorporar un plantel al formato actual:** agregar escuela, especialidades, empresas, responsables y horarios.
- **Adaptar el sistema a un formato institucional diferente:** modificar estructura, campos, firmas, PDF y reglas de negocio.

Antes de empezar, define cuál de los dos necesitas.

---

## 1. Elegir el nivel de integración

### Nivel A — Catálogos

Úsalo cuando la institución puede trabajar con el formato actual y sólo necesita:

- aparecer en el selector de plantel;
- definir especialidades, semestres o grupos;
- precargar responsable de Vinculación;
- agregar empresas receptoras;
- definir horarios, áreas, responsables o instructores.

En este nivel normalmente sólo se modifican:

```text
src/data/schools.json
src/data/companies.json
```

Consulta [CATALOGOS.md](CATALOGOS.md).

### Nivel B — Identidad y reglas institucionales

Úsalo cuando el contenido general funciona, pero cambian elementos como:

- logotipo;
- nombre institucional mostrado;
- cargos o bloques de firmas;
- textos obligatorios;
- nomenclatura de grado/semestre;
- días de la semana;
- reglas de validación.

Además de los catálogos, probablemente necesitarás modificar lógica del generador, estilos y pruebas.

### Nivel C — Formato de bitácora diferente

Úsalo cuando la institución exige otra plantilla: orientación distinta, más páginas, otro número de jornadas, otras columnas, firmas diferentes o campos nuevos.

Ese cambio debe tratarse como una adaptación del producto, no como una simple alta de escuela.

---

## 2. Información que debes reunir

No empieces por programar. Primero consigue una copia vigente del formato y confirma:

### Institución

- nombre oficial;
- nombre corto, si existe;
- logotipo autorizado;
- especialidades o carreras;
- semestres/grados y grupos;
- responsable institucional que da visto bueno;
- cargo exacto que debe aparecer.

### Empresa u organismo receptor

- razón social o nombre oficial;
- nombre corto;
- horario habitual;
- área sugerida;
- personas autorizadas para firmar;
- instructores, si se precargan;
- si la sección de instructor debe aparecer activa por defecto.

### Formato

- tamaño de hoja;
- orientación;
- número de páginas;
- días/jornadas;
- campos obligatorios;
- encabezados;
- firmas;
- leyendas;
- si se permite firma genérica;
- reglas sobre faltas, días inhábiles o sin labores;
- espacio disponible para actividades;
- requisitos para identificación o folio.

### Entrega

Si se utilizará el registro de entrega, confirma:

- quién recibe las bitácoras;
- periodicidad;
- fecha y hora límite;
- si se escaneará desde teléfono, tableta o PC;
- si el plantel acepta Data Matrix dentro de la bitácora;
- qué reportes necesita Vinculación.

---

## 3. Preparar el repositorio

```bash
git clone https://github.com/gio-canto/generador-bitacora-dual_2026.git
cd generador-bitacora-dual_2026
npm ci
npm run dev
```

Para una contribución, crea una rama:

```bash
git checkout -b school/nombre-del-plantel
```

Si tu institución mantendrá una variante propia y no pretende incorporarla al repositorio principal, puede usar un fork. Conserva la documentación de los cambios específicos para poder actualizar el proyecto después.

---

## 4. Agregar el plantel

Edita `src/data/schools.json`.

Ejemplo:

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

Reglas:

- `id` debe ser único, estable, en minúsculas y sin datos sensibles.
- `name` debe contener el nombre institucional que debe aparecer en documentos.
- `shortName` se usa cuando el espacio es reducido.
- no inventes nombres o cargos;
- no reutilices el `id` de otro plantel;
- no cambies un `id` existente para corregir sólo texto visible.

---

## 5. Agregar empresas u organismos

Edita `src/data/companies.json`.

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
  "instructors": []
}
```

Si una persona no debe quedar publicada en el repositorio, deja el catálogo sin esa precarga y permite captura manual.

---

## 6. Revisar el formato actual antes de modificarlo

El formato vigente está diseñado alrededor de una bitácora A4 horizontal y un flujo de cuatro jornadas.

Antes de tocar el motor PDF, genera una bitácora de prueba y marca sobre el PDF qué necesita cambiar. Clasifica cada diferencia:

| Diferencia | Tipo |
| --- | --- |
| Sólo nombre de escuela/empresa | Catálogo |
| Otro cargo o responsable | Catálogo o firma |
| Otro texto fijo | Interfaz/PDF |
| Más o menos jornadas | Dominio + PDF + pruebas |
| Otro tamaño/orientación | PDF + estilos + pruebas visuales |
| Nuevas firmas | Dominio + formulario + PDF |
| Nuevos datos obligatorios | Dominio + interfaz + persistencia + PDF |
| Otro identificador de entrega | Data Matrix + registro + compatibilidad |

---

## 7. Adaptar un formato distinto

Los puntos que normalmente deben revisarse son:

### Dominio

`src/domain/records.js` contiene reglas de fechas, jornadas, validación y versión.

Si cambias el número de jornadas, días admitidos o campos obligatorios, actualiza aquí la regla y crea pruebas.

### Generador principal

`src/legacy/editor.js` sigue siendo parte crítica del flujo real del generador y del PDF.

No asumas que modificar un servicio nuevo sustituye automáticamente el motor heredado.

### PDF

Cuando una regla de identificación, contenido o formato exista tanto en `src/legacy/editor.js` como en `src/services/pdf.js`, conserva equivalencia.

Revisa:

- dimensiones;
- márgenes;
- logotipo;
- tipografía;
- encabezado;
- filas;
- firmas;
- saltos;
- Data Matrix.

### Interfaz

Los campos visibles pueden involucrar:

- `src/legacy/shell.html`;
- `src/styles.css`;
- `src/components/` para módulos React;
- `src/data/` para opciones precargadas.

### Data Matrix

El Data Matrix actual identifica alumno y periodo. Si cambias su payload:

1. crea una nueva versión del formato del código;
2. conserva lectura de versiones anteriores cuando sea razonable;
3. actualiza generador y lector;
4. agrega pruebas;
5. documenta la migración en `CHANGELOG.md` y en la documentación técnica.

No reutilices silenciosamente un número de versión del payload para datos con otra estructura.

---

## 8. Registro de entrega

Si la institución utilizará `/registro-entrega/`:

1. configura el plantel;
2. carga alumnos;
3. crea la semana y su fecha límite;
4. prueba al menos una entrega a tiempo y una tardía;
5. prueba un código repetido;
6. prueba un código desconocido;
7. prueba una coincidencia aproximada de nombre y confirma que requiere intervención humana;
8. exporta el JSON portátil;
9. genera CSV y reportes PDF.

Una coincidencia aproximada nunca debe convertirse en registro automático sin confirmación.

---

## 9. Pruebas obligatorias

Antes de proponer la integración:

```bash
npm run check
```

Después realiza revisión manual.

### Para un plantel nuevo

- aparece en el selector;
- especialidades, semestres y grupos son correctos;
- nombre corto cabe en firmas;
- PDF muestra datos institucionales correctos;
- ninguna escuela existente cambió accidentalmente.

### Para empresas

- horario sugerido es correcto;
- empresa y nombre corto aparecen donde corresponde;
- responsables e instructores son seleccionables;
- el valor por defecto del instructor es correcto.

### Para un formato diferente

- captura completa;
- validaciones;
- guardado y reapertura;
- respaldo e importación;
- PDF en pantalla;
- impresión real al 100 %;
- móvil y escritorio;
- Data Matrix;
- registro de entrega;
- actualización desde datos anteriores.

Consulta la matriz completa en [PRUEBAS.md](PRUEBAS.md).

---

## 10. Documentar la integración

Toda integración publicada debe explicar:

- institución agregada;
- alcance del cambio;
- si conserva el formato existente o introduce una variante;
- campos nuevos;
- cambios en PDF;
- impacto sobre datos guardados;
- impacto sobre Data Matrix;
- pruebas realizadas.

Además:

1. incrementa versión;
2. actualiza `CHANGELOG.md`;
3. actualiza estas guías si cambia el procedimiento;
4. mantén sincronizados los archivos de versión.

Consulta [VERSIONADO.md](VERSIONADO.md).

---

## 11. Qué no debe subirse

No publiques para “configurar” una escuela:

- listas de alumnos;
- bitácoras llenas;
- firmas escaneadas;
- respaldos;
- horarios personales asociados a alumnos;
- credenciales;
- documentos internos no destinados a publicación.

Los ejemplos de pruebas deben usar datos sintéticos.

---

## 12. Criterio de aceptación institucional

Antes de decir que una institución está implementada, debe cumplirse todo lo siguiente:

- catálogo verificado;
- formato revisado contra el documento oficial vigente;
- responsables y firmas revisados;
- PDF legible e imprimible;
- flujo móvil funcional;
- respaldo probado;
- Data Matrix probado si aplica;
- registro de entrega probado si aplica;
- `npm run check` exitoso;
- versión y documentación actualizadas.

Una escuela “aparece en el selector” no equivale por sí sola a una implementación completa.
