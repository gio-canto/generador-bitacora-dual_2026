# Contribuir

Gracias por colaborar con **Generador de Bitácora Dual 2026**. Este repositorio acepta mejoras de código, documentación, accesibilidad, pruebas, planteles, empresas y adaptaciones institucionales.

Antes de cambiar archivos, identifica qué tipo de contribución estás haciendo.

## Tipos de contribución

| Quiero… | Empieza aquí |
| --- | --- |
| Agregar o corregir una escuela | [Catálogos](docs/CATALOGOS.md) |
| Agregar o corregir una empresa | [Catálogos](docs/CATALOGOS.md) |
| Implementar el proyecto en otro plantel | [Implementar una institución](docs/IMPLEMENTAR_INSTITUCION.md) |
| Adaptar un formato distinto de bitácora | [Implementar una institución](docs/IMPLEMENTAR_INSTITUCION.md) |
| Cambiar código o arquitectura | [Arquitectura](docs/ARQUITECTURA.md) |
| Corregir una regresión | [Pruebas](docs/PRUEBAS.md) |
| Publicar una nueva versión | [Versionado](docs/VERSIONADO.md) |

## Flujo recomendado

1. Parte de `main` actualizado.
2. Crea una rama con un nombre descriptivo.
3. Realiza un cambio acotado.
4. Actualiza pruebas y documentación.
5. Ejecuta:
   ```bash
   npm ci
   npm run check
   ```
6. Revisa manualmente el flujo afectado.
7. Actualiza versión y `CHANGELOG.md` conforme a [VERSIONADO.md](docs/VERSIONADO.md).
8. Abre un pull request explicando qué cambió, por qué y cómo se comprobó.

### Ejemplos de ramas

```text
school/agregar-plantel-x
company/actualizar-empresa-y
fix/scanner-safari
feat/reporte-entregas
docs/guia-institucional
```

## Definition of Done

Un cambio no se considera terminado sólo porque compile. Para integrarlo a `main` debe cumplir, según corresponda:

- [ ] El comportamiento solicitado funciona.
- [ ] No elimina funciones existentes sin una decisión explícita.
- [ ] `npm test` pasa.
- [ ] `npm run build` pasa.
- [ ] La revisión manual del flujo afectado se realizó.
- [ ] Se actualizaron o agregaron pruebas si cambió lógica.
- [ ] Se actualizó la documentación afectada.
- [ ] Se incrementó la versión publicada.
- [ ] `CHANGELOG.md` explica el cambio de esa versión.
- [ ] `package.json`, `package-lock.json` y `src/domain/records.js` muestran la misma versión.
- [ ] No se incluyeron respaldos, bitácoras reales ni otros archivos con datos personales.

## Cambios de escuelas y empresas

Los catálogos canónicos están en:

- `src/data/schools.json`
- `src/data/companies.json`

No cambies un `id` existente sólo para corregir el nombre visible. Los identificadores deben permanecer estables porque pueden actuar como referencia interna y facilitan mantener compatibilidad.

Los nombres, cargos, horarios y responsables que se publiquen deben corresponder a información verificada. No uses ejemplos inventados dentro de los catálogos reales.

## Cambios de formato

Modificar un formato institucional es distinto a agregar una escuela.

Si cambias encabezados, jornadas, firmas, tamaño de hoja, campos obligatorios, orden del documento o Data Matrix, revisa como mínimo:

- `src/legacy/editor.js`;
- `src/services/pdf.js` cuando exista lógica equivalente;
- `src/domain/`;
- `src/styles.css`;
- pruebas de PDF y dominio;
- Data Matrix y registro de entrega;
- documentación de implementación.

El generador mantiene una parte heredada por compatibilidad. No sustituyas un flujo completo por una implementación nueva sin pruebas que demuestren equivalencia.

## Estilo de código

- Conserva el formato existente y ejecuta Prettier.
- Prefiere funciones pequeñas para reglas reutilizables.
- Evita duplicar reglas entre el generador y servicios extraídos.
- No agregues una dependencia cuando una función corta y mantenible resuelva el problema.
- Toda dependencia nueva debe tener una razón concreta, licencia compatible y efecto conocido sobre carga/offline.
- Respeta `prefers-reduced-motion`, navegación por teclado, objetivos táctiles y tipografía móvil legible.

## Datos personales y seguridad

No publiques:

- bitácoras reales;
- respaldos JSON de usuarios;
- listas reales de alumnos;
- firmas autógrafas;
- capturas con datos personales;
- diagnósticos que incluyan contenido del Data Matrix.

Para vulnerabilidades utiliza el proceso indicado en [SECURITY.md](SECURITY.md).

## Pull request

Un PR útil debe responder cuatro preguntas:

1. **Problema:** ¿qué no funcionaba o qué necesidad existe?
2. **Cambio:** ¿qué archivos o reglas se modificaron?
3. **Compatibilidad:** ¿qué comportamiento anterior se conserva?
4. **Verificación:** ¿qué pruebas automatizadas y manuales se realizaron?

Ejemplo:

```md
## Problema
El plantel X no aparece en el selector.

## Cambio
Se agrega su configuración a schools.json y las empresas receptoras necesarias.

## Compatibilidad
No se modifican IDs ni datos de planteles existentes.

## Verificación
- npm run check
- selección del plantel
- generación de PDF
- revisión de firmas
```

## Commits

Usa mensajes breves y específicos. Ejemplos:

```text
Agregar CBTis 000 al catálogo
Corregir lectura Data Matrix en Safari
Documentar adaptación de formatos
```

Evita mensajes como `cambios`, `fix`, `update` o `cosas nuevas` sin contexto.

## Versiones y CHANGELOG

La documentación de versiones es obligatoria. No se publica un cambio en `main` sin dejar trazabilidad en `CHANGELOG.md` y en los archivos de versión.

Consulta [docs/VERSIONADO.md](docs/VERSIONADO.md).
