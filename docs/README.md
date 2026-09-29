# Documentación

Este directorio contiene la documentación mantenible del proyecto. Las notas históricas de versiones permanecen en `CHANGELOG.md`; estas guías describen cómo funciona **la versión actual**.

## Rutas rápidas

| Necesidad | Documento |
| --- | --- |
| Quiero usar el proyecto en otra escuela | [IMPLEMENTAR_INSTITUCION.md](IMPLEMENTAR_INSTITUCION.md) |
| Sólo necesito agregar plantel o empresa | [CATALOGOS.md](CATALOGOS.md) |
| Voy a modificar código | [ARQUITECTURA.md](ARQUITECTURA.md) |
| Necesito entender almacenamiento o respaldos | [DATOS_Y_CACHE.md](DATOS_Y_CACHE.md) |
| Voy a probar una modificación | [PRUEBAS.md](PRUEBAS.md) |
| Voy a publicar cambios | [VERSIONADO.md](VERSIONADO.md) |
| Quiero colaborar | [../CONTRIBUTING.md](../CONTRIBUTING.md) |
| Quiero revisar seguridad | [../SECURITY.md](../SECURITY.md) |

## Principio documental

La documentación de este directorio es **documentación viva**. No debe convertirse en una acumulación de secciones tituladas por número de beta.

Cuando una función cambia:

1. actualiza la guía que describe su comportamiento actual;
2. registra el cambio histórico en `CHANGELOG.md`;
3. incrementa la versión conforme a `VERSIONADO.md`.

Así se evita que una persona tenga que leer veinte notas de versión para entender cómo usar o mantener la aplicación hoy.
