# Registro Dual · v0.57.0-beta.1

## Alcance

Esta actualización modifica el **Registro de Bitácoras** (`/registro-entrega/`), no los formularios ni los PDF del generador principal. El registro continúa siendo **local-first**: la información administrativa y los datos del alumnado permanecen en el navegador, salvo cuando el usuario exporta o comparte un archivo. No se crea un servidor de calificaciones.

## Interfaz adaptable (Apple Native + Adaptive Pro)

- **Automático (predeterminado):** a 760 px o menos la interfaz cambia al modo móvil. La detección reacciona a cambios de tamaño y orientación; no depende de adivinar modelos de teléfono por el user agent.
- **Móvil:** cabecera con símbolo Dual, tablero compacto, navegación inferior Inicio / Semanas / Escanear / Datos / Más. La pantalla del escáner conserva su flujo dedicado.
- **Escritorio:** distribución tradicional sin barra inferior. Los botones de navegación administrativa y las tablas completas permanecen disponibles.
- **Selector de presentación:** Herramientas → Presentación. Las preferencias Automática, Móvil y Escritorio se guardan en el `localStorage` del mismo navegador. Es una preferencia visual, no un dato exportado al respaldo.
- La sección **Semanas** muestra el historial, el avance de entrega y permite crear periodos. **Más** reúne PDF, avisos PNG, administración de alumnos, tutorial, importación y copia de seguridad.

> En pantallas extremadamente pequeñas, las tablas se desplazan horizontalmente dentro de su contenedor. Si fuerzas «Escritorio» en un teléfono, se preservan ciertas reglas CSS de seguridad para evitar cortes y garantizar accesibilidad.

## Navegación de Estadísticas

El menú fijo lateral en escritorio se convierte en panel desplegable en móvil. Los indicadores ya no se muestran todos en una sola página: cada sección monta solo sus componentes. Las opciones son:

1. **Resumen:** KPIs del periodo, interpretaciones y actividad de formación.
2. **Asistencia:** estados de jornadas, motivos de faltas, motivos de días sin labores, indicadores de cumplimiento y cobertura.
3. **Empresas:** horas y comparaciones, mayor/menor tasa de faltas y tamaño de la base evaluable.
4. **Grupos:** distribución del alumnado, comparación de grupos, especialidades, género y uso del generador.
5. **Alumnos:** clasificaciones nominales, historiales de pendientes y acceso a expedientes PDF.
6. **Histórico:** horas acumuladas de Educación Dual y distribución por especialidad.

Los filtros por periodo, especialidad y empresa se comparten entre secciones. En móvil, los filtros aparecen contraídos y se abren bajo **Filtros del periodo**.

## Índice de Seguimiento Dual del PDF individual

El índice **no es un Buró de Crédito**, una calificación escolar oficial ni un pronóstico sobre el alumno. Solo resume registros de entregas verificables. Su máximo es 100 y no se almacena en el registro: se calcula en el momento de generar el reporte.

### Fórmula

`Índice = redondear(0.50 × C + 0.30 × P + 0.20 × R)`

- **C — Cumplimiento:** bitácoras recibidas (puntuales o tardías) / semanas vencidas aplicables × 100.
- **P — Puntualidad:** bitácoras recibidas a tiempo / semanas vencidas aplicables × 100.
- **R — Regularidad reciente:** bitácoras recibidas / hasta cuatro semanas vencidas aplicables más recientes × 100.
- Solo cuentan plazos ya vencidos. Las semanas marcadas **No aplica** se excluyen.
- Si **no hay plazos vencidos**, se muestra **Sin evaluación**; no se asigna cero.
- Con **menos de cuatro semanas vencidas**, el resultado se identifica como **provisional**.
- Las faltas, sus justificaciones, horas, días inhábiles y días sin labores **no afectan la puntuación**.
- No se imputan valores por datos de jornadas ausentes.

### Bandas descriptivas

| Índice | Interpretación |
| --- | --- |
| 85–100 | Seguimiento sólido |
| 70–84 | Seguimiento favorable |
| 50–69 | Seguimiento por reforzar |
| 0–49 | Requiere atención en entregas |
| Sin semanas vencidas | Sin evaluación |

**Reglas de uso:** nunca emplear este número como sanción, decisión automática de permanencia, selección, contratación, reporte crediticio, diagnóstico personal ni difusión pública. Revisar y rectificar los registros individuales antes de compartir cualquier PDF. El resultado expresa únicamente la información cargada en ese navegador y puede estar incompleto.

## PWA y logotipo oficial

- **Original:** `public/Assets/registro-dual-icon-original.png`.
- **Generación:** `node scripts/create-pwa-icons.mjs` (también en `predev` y `prebuild`). Produce iconos de 192, 512, 512 maskable, 180 Apple y favicon 32, sin sobrescribir el original.
- **Manifiesto:** `public/registro-entrega/manifest.webmanifest` enlazado solo desde `registro-entrega/index.html`; `start_url`, `scope` e `id` son relativos a `/registro-entrega/`.
- **Cache:** `scripts/build-sw.mjs` incluye manifiesto e iconos en los recursos precargados, con la versión del cache derivada del contenido.
- **Instalación:** en Chrome Android abrir Registro de Bitácoras → Instalar app / Agregar a inicio; en Safari iPhone → Compartir → Agregar a pantalla de inicio. Si aparece un icono antiguo, eliminar el acceso directo y volverlo a agregar.
- El registro necesita abrirse una primera vez con conectividad para instalar y llenar la caché. El escaneo de cámara requiere permisos y compatibilidad del navegador; librerías CDN que no estén disponibles sin conexión pueden limitar ciertas funciones de lectura, aunque el registro manual y los datos locales se conservan.

## Compatibilidad y validación

Se conserva el esquema actual de estudiantes, semanas y entregas. No hay migración ni eliminación de respaldos. El conjunto de pruebas cubre PWA, estadísticas, captura de jornadas, PDF y el índice. Antes de despliegues mayores, verificar Safari iOS, Chrome Android, orientación vertical y horizontal, teclado, lectores de pantalla y zoom del navegador; una compilación exitosa no sustituye esas pruebas reales.

