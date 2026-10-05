# Pruebas y verificación

## Puerta mínima antes de publicar

Ejecuta:

```bash
npm run check
```

Ese comando debe completar:

1. `npm test`;
2. `npm run build`.

Un build exitoso no sustituye las pruebas manuales del PDF, cámara o impresión.

## Qué cubre la suite automatizada

La suite incluye pruebas sobre:

- dominio y validaciones;
- generación de fechas;
- almacenamiento y recuperación;
- perfil;
- importación;
- PDF;
- Data Matrix;
- registro de entrega;
- migraciones;
- estados de entrega;
- reportes;
- diagnóstico del escáner;
- regresiones de interfaz.

Cuando agregues una regla, agrega una prueba en el nivel más cercano a esa regla.

## Matriz de revisión manual

### Generador

- crear una bitácora desde cero;
- generar jornadas;
- estados Falta, Sin labores e Inhábil;
- en **Falta**, probar motivos frecuentes, edición libre del texto y confirmación antes de reemplazar una justificación personalizada;
- editar actividades;
- ejecutar el corrector con un término institucional y vocabulario técnico conocido; confirmar que no los marque como error y que siga detectando faltas reales;
- revisar contador/espacio;
- responsables e instructor;
- firma genérica;
- guardar, recargar y reabrir;
- consultar el historial desde la barra superior y comprobar contador/última semana;
- revisar un registro guardado sin reemplazar el borrador actual;
- desde la revisión, usar **Volver a descargar PDF** y comprobar el salto directo al paso 5;
- exportar/importar respaldo;
- descargar PDF.

### PDF

Revisa visualmente:

- tamaño y orientación;
- márgenes;
- logotipo;
- encabezado;
- cortes de texto;
- fechas;
- firmas;
- Data Matrix;
- ausencia de páginas vacías.

Cuando se cambie formato institucional, imprime al menos una prueba a escala 100 %.

### Responsive

Revisa como mínimo:

- 390 px;
- 430 px;
- 768 px;
- 1024 px;
- escritorio amplio.

En móvil verifica:

- objetivos táctiles;
- safe areas;
- inputs de al menos 16 px donde Safari podría hacer zoom;
- ausencia de desbordamiento horizontal;
- orientación vertical y horizontal.

### Accesibilidad

- teclado;
- foco visible;
- etiquetas accesibles;
- contraste;
- `prefers-reduced-motion`;
- acciones críticas comprensibles sin depender sólo de color.

## Registro de entrega

Prueba:

- crear plantel/base;
- alta, edición y eliminación de alumnos;
- importación de Excel/CSV;
- crear semana;
- seleccionar una semana existente, editar su fecha límite y comprobar la reclasificación de entregas hechas por cámara sin alterar correcciones manuales ni **No aplica**;
- cerrar/reabrir;
- estado manual en **Entregado a tiempo**, **Entregado a destiempo**, **No entregado** y **No aplica**;
- comprobar que **No aplica** se conserva al recargar/importar y no reduce el porcentaje de cumplimiento;
- filtros y agrupación;
- JSON;
- CSV;
- tres tipos de reporte PDF.

### Escáner

Prueba al menos:

1. código válido;
2. repetido;
3. desconocido;
4. código de otra semana;
5. entrega posterior al límite;
6. lectura desde imagen;
7. cámara en teléfono;
8. salir y volver;
9. bloquear dispositivo/cambiar de app;
10. errores de cámara y diagnóstico.

### Coincidencia aproximada

Cubre al menos:

- una letra extra;
- una letra faltante;
- una sustitución pequeña;
- nombre suficientemente distinto: no sugerir;
- nombre parecido con especialidad diferente: no sugerir en payload actual;
- nombre parecido con empresa diferente: no sugerir;
- rechazo de candidato;
- confirmación de candidato;
- una coincidencia confirmada no debe requerir confirmación repetida durante la misma sesión.

La coincidencia exacta siempre tiene prioridad.

## Cambios de catálogos

Para una escuela nueva:

- selector;
- especialidades;
- semestres;
- grupos;
- visto bueno;
- nombre corto;
- PDF.

Para una empresa:

- nombre y nombre corto;
- horario;
- área;
- representantes;
- instructores;
- estado por defecto del instructor.

## Cambios de persistencia

Toda migración debe probar:

- estado nuevo vacío;
- lectura del formato inmediatamente anterior;
- datos incompletos válidos;
- archivo dañado;
- campos adicionales;
- no perder identificadores sin necesidad.

## Cambios de Data Matrix

Toda nueva versión de payload debe probar:

- generación;
- parseo;
- identidad;
- periodo;
- compatibilidad anterior;
- código inválido;
- clasificación de semana;
- lectura física o desde captura.

## Códigos de error del escáner

Los diagnósticos se agrupan por capa:

- `CAM-xxx`: cámara/permisos/dispositivo;
- `VID-xxx`: video/frames;
- `ZX-xxx`: ZXing;
- `BD-xxx`: BarcodeDetector;
- `IMG-xxx`: imagen.

El diagnóstico copiado no debe incluir contenido real del Data Matrix ni el `deviceId` completo.

## Cambios de documentación

También deben revisarse:

- enlaces relativos;
- nombres de archivos;
- comandos;
- versión mostrada;
- ausencia de instrucciones obsoletas.

## CI

El workflow de GitHub ejecuta instalación, pruebas y build antes de publicar GitHub Pages.

Una ejecución verde confirma la suite automatizada y la compilación, no la validación institucional del contenido.

## Registro de evidencia

En un PR explica qué verificaste. No adjuntes bitácoras reales; usa datos sintéticos.

Consulta [../CONTRIBUTING.md](../CONTRIBUTING.md).
