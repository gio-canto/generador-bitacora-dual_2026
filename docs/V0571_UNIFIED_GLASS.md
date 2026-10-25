# Registro Dual · Sistema visual unificado de v0.57.1

## Por qué se hizo la corrección

La primera implementación de `v0.57.1-beta.1` aplicó **Editorial Glass** de manera desproporcionada a la vista Datos. El resto del registro seguía con su diseño anterior, y las pantallas parecían pertenecer a aplicaciones diferentes. Esta corrección mantiene la numeración **v0.57.1-beta.1** y extiende el lenguaje visual a **todo Registro Dual**, no al generador de documentos.

## Identidad compartida

- **Familia visual:** Apple Native + Adaptive Pro + editorial institucional. Superficies limpias, elementos nítidos y glass **ligero**, no cristal saturado.
- **Logotipo:** icono PWA Dual oficial `public/Assets/registro-dual-icon-original.png` tanto en la cabecera de escritorio como en móvil; también sigue apareciendo en Datos y en la instalación del PWA.
- **Fondo:** base gris/blanco `#f6f9fb`, halos **muy tenues** aqua y durazno cercanos a la parte superior; ausencia de bloques de color fuerte en pantallas normales.
- **Texto y acciones:** azul Oxford `#192d43`, azul acción `#195b91`, secundarios `#67788b`, contraste mantenido sobre fondos sólidos cuando no existe transparencia.
- **Superficies:** un solo sistema de borde, radio, sombra y `backdrop-filter`, documentado en `src/delivery-unified-glass.css`.
- **Navegación:** la barra superior, la navegación inferior móvil y el menú de Datos comparten la misma apariencia y estados seleccionados.

## Pantallas cubiertas

| Pantalla/flujo | Tratamiento |
| --- | --- |
| Inicio | Hero claro ambiental, tarjetas compactas y accesos unificados; la acción de escaneo no se duplica en móvil |
| Semanas | Encabezados, progreso, listados, botones y formularios consistentes |
| Escáner Data Matrix | Marco, encabezado y botones del sistema; se preserva fondo oscuro **dentro de la cámara** y alertas contrastadas |
| Alumnos / configuración | Pasos, ficha, buscador, formularios, controles y listados del mismo sistema |
| Datos | Hero anterior **atenuado** para armonizar con las demás pantallas, más menú lateral, tarjetas y tablas del mismo lenguaje |
| Reportes PDF | Selector, vista previa, diálogo y controles del sistema; no se modifica el diseño exportado de los PDF |
| Avisos PNG | Editor, categorías, formularios y panel de vista previa uniformes; la imagen PNG resultante **no se modifica** |
| Captura de jornadas | Ventanas, botones, campos y estados consistentes; se preserva su validación y cálculo |
| Tutorial, advertencias e importación | Capas, bordes, botones y mensajes coherentes |

## Arquitectura

- `src/components/DeliveryRegistry.jsx` importa `src/delivery-unified-glass.css` **después** de `src/delivery-registry.css`. Todo se delimita bajo `.delivery-app` para no afectar el generador principal.
- El hero existente `StatisticsHero.jsx` no se duplica; se atempera con tokens compartidos y se mantienen **las mismas métricas**.
- La preferencia de presentación automática/móvil/escritorio se conserva.
- Cambios de color, borde, espaciado y elevación son principalmente CSS; no se modifican el almacenamiento, el esquema, los PDF, los PNG ni las reglas de entrega y asistencia.
- `prefers-reduced-motion`, `prefers-reduced-transparency` y `prefers-contrast: more` cuentan con alternativas, y controles interactivos mantienen foco visible.
- La imagen de cámara y sus overlays oscuros no reciben transparencias blancas que dificulten escanear.

## Comprobaciones

Las pruebas automáticas verifican que el tema está importado, que los selectores abarcan los flujos principales y que la navegación existente sigue operativa. Aun con CI exitoso, antes de considerar el diseño totalmente pulido hay que revisarlo en pantallas reales de iOS, Android, tableta y escritorio, así como con teclado y zoom al 200 %.

## Criterio de aceptación visual

Al navegar Inicio → Semanas → Escáner → Datos → Alumnos → Reportes → Avisos, el usuario debe reconocer **una sola aplicación**, sin un hero intensamente coloreado junto a páginas blancas tradicionales. El cristal se utiliza como *material de superficie*, no como una capa excesiva de brillo o gradientes.

