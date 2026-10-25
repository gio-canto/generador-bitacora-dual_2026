# v0.57.1-beta.1 · Datos Editorial Glass (Registro Dual)

## Objetivo y alcance

Rediseño visual del módulo **Datos** en `/registro-entrega/`, inspirado en la jerarquía de Apple Health y adaptado a una identidad **editorial premium** propia. No es una reproducción literal ni utiliza tecnología privada de Apple: el efecto «liquid glass» se **emula con CSS**, desenfoque, transparencias, bordes y sombras. Se mantiene el símbolo Dual oficial aportado al repositorio.

Esta versión **no cambia las reglas de cálculo**, el origen de datos, las estructuras de respaldo, las jornadas o los reportes PDF. Solo reorganiza su presentación en pantalla. El generador principal permanece independiente.

## Estructura

1. **Hero:** imagen ambiental aqua / durazno / blanco cálido sin imágenes pesadas, botón Volver, marca Dual, título «Datos.» y acceso a Reportes.
2. **Periodo:** botones Semanal, Mensual y General con `aria-pressed`, seleccionables por teclado y táctiles.
3. **Filtros contextuales:** botón «Filtros» abre/cierra la selección de semana o mes, especialidad y empresa; los filtros activos se anuncian debajo del selector. Se reutiliza el mismo estado que `calculateDeliveryStatistics`.
4. **Tarjeta glass en Resumen:** cumplimiento de entrega, fracción entregada del total aplicable, puntuales, tardías y no entregadas. Anillo SVG con segmentos proporcionales. Cuatro miniindicadores: horas registradas, asistencia, faltas y cobertura.
5. **En detalle:** tarjetas compactas que cambian a Asistencia, Empresas, Grupos, Alumnos e Histórico, manteniendo el menú lateral existente y evitando una segunda cuadrícula de KPIs redundante.
6. **Pantallas especializadas:** en las cinco secciones distintas de Resumen, el hero se reduce y conserva título, filtros, marca y acceso a reportes; las tablas, gráficas y análisis originales permanecen debajo.

## Integridad y denominadores

- **Cumplimiento:** `(entregado + entregado_tarde) / aplicable`, donde «No aplica» no forma parte del denominador. Su resultado reproduce `data.deliveryRate`.
- **Anillo:** recorre exclusivamente `data.delivered`, `data.late`, `data.notDelivered` y `data.applicable` de `src/services/statistics.js`. No inventa datos.
- **Sin datos aplicables:** muestra «—» y la explicación correspondiente en lugar de afirmar «0 %».
- **Asistencia:** jornadas «laboral» / («laboral» + «falta»), y solo se presenta si hay jornadas de esas dos clases.
- **Faltas:** se muestra «—» si no existe ninguna semana con estadísticas; los días `sin_labores` e `inhabil` nunca se agregan como faltas.
- **Cobertura:** porcentaje `data.coverage` solo para un denominador `applicable` positivo.
- **Horas:** provienen de `data.totalMinutes/60` del periodo, no de una estimación.

> Las estadísticas de cumplimiento por periodo incluyen los registros aplicables de las semanas seleccionadas. No deben confundirse con el indicador del expediente individual, que considera **exclusivamente semanas vencidas**.

## Responsividad y accesibilidad

- Móvil: el hero ajusta jerarquía tipográfica, controles táctiles y tarjeta, con dos columnas de miniindicadores; el anillo se reduce sin perder lectura.
- Escritorio y tableta: composición de datos principal + anillo y cuatro miniindicadores horizontales.
- Los números y estados aparecen en texto real y el anillo dispone de `aria-label`; no se depende del color para leer el estado.
- Compatible con teclado (`focus-visible`), `prefers-reduced-motion` y `prefers-reduced-transparency`.
- Sin `backdrop-filter`, el contenido mantiene un fondo blanco legible.
- No se requieren nuevas dependencias ni llamadas de red para dibujar la visualización.

## Archivos

- `src/components/StatisticsHero.jsx`
- `src/delivery-statistics-hero.css`
- `src/components/DeliveryStatistics.jsx`
- `tests/v0571-hero.test.jsx` (pruebas de interfaz y de estados sin datos)
- `src/domain/records.js`, `package.json`, `package-lock.json`, `README.md`, `CHANGELOG.md`

## Comprobaciones manuales recomendadas

Probar 320, 375, 390, 430, 768, 1024 y 1440 píxeles, zoom al 200 %, Safari iOS, Chrome Android, cambios de orientación, botones de filtro, accesibilidad y generación del reporte. Comprobar que el resultado del hero coincide con el PDF y con la tabla de entregas bajo los mismos filtros.

