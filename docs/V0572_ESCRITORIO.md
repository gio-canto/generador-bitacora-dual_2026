# Restauración de escritorio — Registro Dual v0.57.2

## Motivo

El despliegue de la barra lateral rápida en v0.57.2 desplazaba el área de trabajo de escritorio hacia la derecha y le restaba ancho. La hoja global de cristal también aplicaba reglas de la interfaz móvil a la web, alterando la distribución original. El usuario solicitó que **la versión web de escritorio vuelva a verse y funcionar como antes**, sin perjudicar la app de iPhone/Android.

## Separación por modo

### Escritorio (`.delivery-layout-desktop`)

- Área principal **centrada**, ancho máximo de **1180 px**; encabezado centrado de **1280 px**. Nunca se reserva una columna permanente a la barra lateral de accesos.
- Logotipo horizontal original `Assets/Asset_logo.png`, conservando el icono Dual PWA en modo móvil.
- Inicio con los **cinco accesos originales**: alumnos, semanas, escaneo, reportes y avisos PNG.
- Historial completo de semanas en la pantalla principal, sin el límite de tres usado para la app móvil.
- Estadísticas con título tradicional **Estadísticas**, botón **Abrir Reportes**, controles **Semanal / Mensual / General**, filtros por semana/mes, especialidad y empresa, y los seis indicadores clásicos en Resumen.
- Las secciones Resumen, Asistencia, Empresas, Grupos, Alumnos e Histórico siguen disponibles, presentadas como navegación horizontal en escritorio para no robar ancho a las gráficas.
- Menú de accesos rápidos activado con botón **Menú** y cerrado normalmente. Funciona como panel deslizable superpuesto, no como columna fija que deforme las tarjetas.
- Mantiene el estilo original del Registro de Bitácoras por `src/delivery-registry.css`.

### App móvil (`.delivery-layout-mobile`)

- Conserva la barra inferior, el logotipo cuadrado oficial Dual, el hero Apple Glass, las tres tarjetas compactas de Inicio y las tres semanas recientes.
- Estadísticas conserva el hero de Datos con resumen circular y accesos compactos.
- Su barra lateral abre/cierra como panel táctil sin afectar el ancho del contenido.
- El selector Automática / Móvil / Escritorio conserva su comportamiento anterior. La selección automática se basa en el ancho del viewport.

## Cambios técnicos

1. `src/delivery-quick-sidebar.css`: elimina el `margin-left` y `width` calculados según un sidebar permanente a partir de 1200 px; adopta un *drawer* opcional.
2. `src/delivery-unified-glass.css`: los estilos Apple Glass de toda la app se limitan a `.delivery-app.delivery-layout-mobile`.
3. `src/delivery-desktop-restoration.css`: restablece anchuras y márgenes centrales, logo, tarjetas, navegación, filtros y protección frente a overflow en el modo de escritorio.
4. `src/components/DeliveryRegistry.jsx`: conserva renderizados de Inicio distintos por modalidad y comunica `mobileView` a Estadísticas.
5. `src/components/DeliveryStatistics.jsx`: alterna entre el hero móvil y la cabecera clásica de escritorio; reutiliza los mismos cálculos y filtros.
6. `src/delivery-registry.css` y `src/delivery-statistics.css`: las reglas móviles se limitan por ancho de pantalla, no por `pointer: coarse`, para que una laptop táctil de escritorio no sea forzada al diseño de teléfono.

## Datos y compatibilidad

No se altera el esquema de datos, los registros de alumnos, semanas, respaldo JSON, PDF o PNG, ni las funciones del escáner. Solo cambian presentación y distribución. La versión se mantiene como **0.57.2-beta.1**, al tratarse de una corrección.

## Verificación

Las pruebas `tests/v0572-desktop-restoration.test.jsx` comprueban las cinco tarjetas originales, el historial completo, el encabezado clásico de Estadísticas, sus filtros y la apertura del menú lateral sin desplazamiento. Se conservan las pruebas de interfaz móvil, captura, exportaciones y análisis.

Las pruebas automatizadas no sustituyen una inspección visual real. Verificar en Chrome/Edge para Windows a 1024, 1280, 1440 y 1920 px, con zoom 100 % y 125 %, y contrastar Safari iPhone/Chrome Android para evitar regresiones.

