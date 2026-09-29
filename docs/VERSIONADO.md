# Versionado y documentación de cambios

## Regla principal

**Todo cambio publicado en `main` debe tener trazabilidad documental.**

En este repositorio, una modificación no está terminada hasta que su versión, CHANGELOG, documentación y pruebas estén alineados.

## Fuente de versión

La versión pública debe coincidir en:

```text
src/domain/records.js
package.json
package-lock.json
README.md
```

`src/domain/records.js` también contiene el nombre corto de la entrega actual mediante `RELEASE`.

## Esquema actual

Durante la etapa beta se utiliza:

```text
0.50.0-beta.N
```

`N` aumenta de forma consecutiva con cada publicación integrada a `main`.

No reutilices un número ya publicado y no cambies el significado de una versión existente.

## Qué debe hacer cada versión

Como mínimo:

1. incrementar el número;
2. actualizar `RELEASE`;
3. sincronizar `package.json` y `package-lock.json`;
4. actualizar la insignia o versión visible del README;
5. agregar una entrada al inicio de `CHANGELOG.md`;
6. actualizar la documentación viva afectada;
7. agregar o actualizar pruebas si cambió comportamiento;
8. ejecutar `npm run check`.

## Formato de CHANGELOG

Cada entrada debe indicar:

- versión;
- área;
- fecha;
- cambios concretos.

Ejemplo:

```md
## 0.50.0-beta.XX · Registro de entrega · 2026-10-01

- Se añade ...
- Se corrige ...
- Se documenta ...
```

No uses una entrada como “cambios menores” si es posible describir qué cambió.

## CHANGELOG vs documentación viva

Tienen propósitos diferentes.

### CHANGELOG

Responde:

> ¿Qué cambió en esta versión?

Es histórico y acumulativo.

### Documentación

Responde:

> ¿Cómo funciona el proyecto ahora?

No debe exigir leer todas las betas anteriores.

Cuando una función cambie, modifica la explicación actual en `docs/` y además registra la diferencia en `CHANGELOG.md`.

## Cuándo incrementar

Incrementa la beta para cualquier cambio publicado en `main` que altere:

- comportamiento;
- interfaz;
- PDF;
- Data Matrix;
- catálogos;
- dependencias;
- seguridad;
- almacenamiento;
- pruebas o CI;
- documentación pública;
- instrucciones de implementación.

Esta regla deliberadamente prioriza trazabilidad sobre reducir la cantidad de versiones.

## Cambios incompatibles

Si una modificación rompe compatibilidad de:

- respaldo;
- esquema local;
- Data Matrix;
- formato institucional;
- API interna consumida por otra entrada;

debe incluir una estrategia de migración o una decisión explícita documentada.

No publiques silenciosamente un cambio incompatible dentro de una beta sin explicarlo.

## Checklist de publicación

```text
[ ] Implementación terminada
[ ] Pruebas nuevas/actualizadas
[ ] npm test
[ ] npm run build
[ ] Revisión manual
[ ] Versión incrementada
[ ] RELEASE actualizado
[ ] package.json sincronizado
[ ] package-lock.json sincronizado
[ ] README sincronizado
[ ] CHANGELOG actualizado
[ ] Documentación viva actualizada
[ ] Sin datos personales de prueba
```

## Commits múltiples

Si una misma tarea necesita varios commits técnicos en rápida sucesión sobre `main`, la última revisión publicada debe dejar una única versión coherente en todos los archivos. Los commits intermedios no justifican omitir el CHANGELOG final.

En contribuciones externas se recomienda trabajar en una rama y producir la versión final al integrar el PR.

## Etiquetas y releases de GitHub

Si en el futuro se crean tags o GitHub Releases, el tag debe corresponder exactamente a la versión del código y su contenido debe derivarse del CHANGELOG, no sustituirlo.
