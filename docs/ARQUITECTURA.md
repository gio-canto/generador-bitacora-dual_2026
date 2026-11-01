# Arquitectura

## Resumen

El proyecto es un sitio estático compilado con Vite y desplegado en GitHub Pages. La aplicación combina una base heredada estable para el generador con módulos React incorporados de forma progresiva.

La prioridad arquitectónica es **compatibilidad antes que reescritura**: una función existente no debe sustituirse sólo para “modernizarla” si no existe una prueba clara de equivalencia.

## Entradas

| Ruta | Entrada | Responsabilidad |
| --- | --- | --- |
| `/` | `index.html` | Generador principal. |
| `/registro-entrega/` | `registro-entrega/index.html` | Recepción y control de bitácoras. |
| `/presentacion/` | `presentacion/index.html` | Landing pública. |
| `/faq/` | `faq/index.html` | Ayuda y preguntas frecuentes. |

## Capas

### Dominio

`src/domain/` contiene reglas que deben poder probarse sin depender de la interfaz.

Ejemplos:

- estructura de registros;
- fechas;
- validación;
- reglas de presentación reutilizables.

### Catálogos

`src/data/` contiene configuración compartida de escuelas y empresas.

No almacena datos individuales de alumnos. Además de escuelas y empresas, define los catálogos editables de **Falta** (`absence-reasons.json`) y **Sin labores** (`non-working-reasons.json`), incluidos sus códigos Data Matrix y frases de reconocimiento.

### Generador heredado

`src/legacy/` conserva el flujo principal que produce la bitácora.

Archivos importantes:

| Archivo | Responsabilidad |
| --- | --- |
| `shell.html` | Estructura base de la interfaz. |
| `editor.js` | Jornadas, formulario, historial y motor PDF real. |
| `guide.js` | Tutorial, navegación y créditos. |
| `people.js` | Selección de responsables. |
| `signatures.js` | Reglas de firmas. |
| `easter-egg.js` | Interacción especial conservada. |

Aunque React monta la aplicación, esta zona no es una migración declarativa completa.

### React

`src/components/` contiene módulos que sí funcionan como componentes React independientes.

- `Profile.jsx`: perfil local.
- `DeliveryRegistry.jsx`: registro de entrega.
- `ReasonInbox.jsx`: campanita de avisos internos y revisión de «Otro motivo» por alumno/semana/jornada.

El corrector ortográfico se ejecuta en un Web Worker y combina `dictionary-es` con `src/services/spelling-dictionary.js`. Este último incorpora vocabulario técnico y extrae automáticamente palabras de los catálogos de escuelas y empresas.

La landing vive en `src/presentation.jsx`.

### Servicios

`src/services/` concentra persistencia, recuperación, PDF extraído, perfil, ortografía, reportes y diagnóstico.

Una regla que afecte al PDF o Data Matrix puede existir también en el flujo heredado; antes de modificarla busca sus dos implementaciones y mantenlas consistentes.

Para clasificación de motivos, `reason-classifier.js` normaliza y compara justificaciones escritas **localmente por el alumno**; `matrix-statistics.js` genera o interpreta los códigos de causa de cada jornada. `reason-reviews.js` identifica los casos con código `63` y actualiza la decisión administrativa de manera independiente; `delivery-registry.js` conserva esos campos en los respaldos JSON.

## Flujo del generador

```text
Catálogos
   ↓
Formulario → detección local de motivo (Falta/Sin labores)
   ↓
Validación → borrador/historial
   ↓
Vista previa
   ↓
Motor PDF + Data Matrix
   ↓
PDF descargado
```

## Flujo del registro de entrega

```text
Base local de alumnos
        +
Semanas y fecha límite
        ↓
Cámara / imagen → parsear Data Matrix
        ↓
Coincidencia exacta
        ↓
si falla: candidatos aproximados + confirmación humana
        ↓
Resolver periodo/semana
        ↓
Cola de sesión
        ↓
Confirmar → persistir entrega y códigos S5
        ↓
Avisos internos: código 63 → revisión administrativa
        ↓
JSON / CSV / reportes PDF
```

La coincidencia aproximada es una ayuda de recuperación, no una decisión automática.

## Mensajes y centro de avisos (0.60)

`src/services/generator-message-rules.js` determina destinatarios, fechas, activadores y frecuencia de comunicados configurados en `src/data/generator-messages.json`. El componente React `GeneratorMessageHost.jsx` monta un portal fuera del editor heredado, evitando duplicar formularios o alterar la interfaz clásica. El editor envía un evento de última bitácora **únicamente después de la generación correcta del PDF** y con la casilla explícita marcada.

`src/services/registry-notifications.js` calcula avisos administrativos desde el estado local de Registro Dual, con sonido generado por Web Audio cuando el navegador lo permite. `ReasonInbox.jsx` muestra la bandeja, filtros, clasificación de motivos y navegación; las marcas de lectura no cambian el JSON escolar.

Debug (`src/debug-main.jsx`) integra `EventEditorDebug.jsx` y `DebugInboxLab.jsx`: crean, validan, prueban e importan/exportan configuraciones y escenarios simulados. No hacen commits ni escriben en las bases reales.

Consulta [Mensajes del generador](MENSAJES_GENERADOR.md) y [Centro de avisos](CENTRO_AVISOS.md).

## Data Matrix

El payload actual es versionado. El lector conserva compatibilidad con formatos anteriores cuando es razonable.

Reglas:

- nunca cambies la estructura de un payload manteniendo el mismo número de versión;
- si agregas o reinterpretas campos, crea una nueva versión;
- actualiza generación y lectura;
- conserva pruebas de versiones anteriores;
- documenta la migración.

**Clasificación 0.59:** los códigos de causa ya disponibles siguen interpretándose con los catálogos por tipo de jornada. El código `63` representa «Otro motivo»; no transporta el texto de la justificación. Las revisiones administrativas se guardan localmente y no cambian el código impreso ni el formato del Data Matrix. Consulta [Clasificación de motivos y avisos](CLASIFICACION_MOTIVOS_V059.md).

## Persistencia

No hay base central. Las aplicaciones utilizan almacenamiento del navegador y archivos descargables.

Consulta [DATOS_Y_CACHE.md](DATOS_Y_CACHE.md).

## Service worker

La compilación genera una caché versionada. La caché sirve recursos de aplicación; no es el respaldo del historial.

Una actualización no debe borrar deliberadamente datos locales.

## Dependencias externas del registro

El registro puede cargar desde su HTML bibliotecas destinadas a:

- leer Data Matrix;
- importar hojas de cálculo;
- generar códigos cuando corresponda.

Cambiar proveedores, URLs o versiones es un cambio técnico y de seguridad que debe documentarse.

## Invariantes

Estas reglas deben preservarse salvo cambio deliberado y documentado:

1. los datos del usuario no dependen de una cuenta;
2. el historial local no se borra por actualizar assets;
3. el PDF debe seguir siendo imprimible;
4. el Data Matrix debe ser legible y versionado;
5. una coincidencia aproximada no registra a una persona sin confirmación;
6. cambios de esquema deben migrar datos anteriores;
7. el generador debe seguir funcionando en móvil;
8. `npm run check` debe pasar antes de publicar.

## Modificar arquitectura

Si extraes lógica del legado hacia un módulo nuevo:

1. escribe primero pruebas sobre el comportamiento actual;
2. extrae la regla sin cambiar su resultado;
3. compara PDF o salida;
4. elimina la implementación anterior sólo cuando ya no sea usada;
5. documenta el cambio en arquitectura y CHANGELOG.

No mantengas dos implementaciones divergentes de una misma regla.
