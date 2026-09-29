# Datos, almacenamiento y respaldos

## Principio general

El proyecto es local-first. No existe una cuenta obligatoria ni una base central propia donde el mantenedor reciba automáticamente las bitácoras.

Los datos se dividen entre:

- almacenamiento del navegador;
- archivos exportados por la persona usuaria;
- caché de recursos de la aplicación.

Estas tres cosas no son equivalentes.

## Generador

Claves principales:

| Clave | Contenido |
| --- | --- |
| `bitacora_dual_clean_v3` | Historial de bitácoras. |
| `bitacora_dual_draft_v1` | Borrador actual. |
| `bitacora_profile_v1` | Datos recurrentes y preferencias del perfil local. |

Existen claves de versiones anteriores usadas únicamente para recuperación o migración. No deben reutilizarse como formatos nuevos.

### Historial

Guardar o descargar una bitácora puede incorporarla al historial local. El historial puede exportarse como respaldo.

### Borrador

El borrador permite continuar una captura interrumpida. Una actualización de assets no debe borrarlo.

### Perfil

El perfil recuerda datos recurrentes como:

- nombre;
- plantel;
- especialidad;
- semestre/grado;
- grupo;
- empresa;
- horario;
- área;
- responsables;
- instructor;
- preferencias recurrentes.

No sustituye al historial y no debe contener actividades semanales como fuente canónica.

## Registro de entrega

Clave actual:

```text
bitacora_dual_delivery_registry_v5
```

Las claves `v1` a `v4` pueden leerse para migración.

El estado contiene, entre otros:

- plantel;
- generación dual;
- alumnos;
- especialidad y empresa por alumno;
- semanas;
- periodo;
- fecha límite;
- estado de cierre;
- entregas por alumno;
- fecha/hora;
- origen de registro.

## Respaldo portátil

**Guardar archivo** en el registro de entrega genera un JSON que contiene el estado editable completo del subsistema.

Ese JSON es el respaldo recomendado para mover o conservar el registro.

El CSV es una exportación de consulta y no conserva toda la estructura necesaria para restaurar el sistema.

## PDF

El PDF es el documento final de una bitácora o reporte. No debe considerarse respaldo editable del historial.

## Service worker y caché

La caché contiene HTML, JS, CSS y otros recursos necesarios para abrir una versión de la aplicación.

**La caché no es un respaldo.**

Borrar caché puede obligar a descargar nuevamente la aplicación. Borrar los datos completos del sitio sí puede eliminar historial, borrador, perfil y registro local según lo que el navegador incluya en esa operación.

## Migraciones

Cuando cambie un esquema persistente:

1. crea una nueva clave o versión de esquema cuando corresponda;
2. lee el formato anterior;
3. convierte a la estructura actual;
4. conserva datos que aún tengan significado;
5. evita sobrescribir silenciosamente una copia anterior si puede servir para recuperación;
6. agrega pruebas de migración;
7. documenta la migración en CHANGELOG y aquí.

## Data Matrix

El Data Matrix contiene información necesaria para identificar la bitácora y su periodo.

El formato actual incluye identidad del alumno y fechas del periodo. Versiones anteriores pueden contener menos información.

El contenido del Data Matrix no debe incluir secretos ni información innecesaria. Tampoco debe copiarse en diagnósticos públicos.

## Coincidencias aproximadas

El registro intenta primero coincidencia exacta. Si el nombre contiene una diferencia pequeña, puede proponer candidatos.

En los payloads actuales, la especialidad y empresa siguen funcionando como restricciones adicionales.

La sugerencia:

- no modifica al alumno;
- no corrige el Data Matrix;
- no registra automáticamente;
- requiere confirmación explícita.

La asociación confirmada puede recordarse durante la sesión de escaneo para evitar preguntas repetidas.

## Exportar antes de operaciones destructivas

Antes de:

- limpiar datos del sitio;
- cambiar de dispositivo;
- reinstalar navegador;
- realizar una migración manual;
- probar cambios de persistencia;

exporta el respaldo correspondiente.

## Privacidad

Los archivos descargados quedan bajo control de quien los conserva. No subas respaldos ni bitácoras reales al repositorio.

Consulta [../SECURITY.md](../SECURITY.md).
