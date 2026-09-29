# Seguridad

## Alcance

Generador de Bitácora Dual 2026 es una aplicación web principalmente local-first. No ofrece cuentas de usuario ni una base de datos central propia para recibir las bitácoras creadas desde el generador.

El navegador sí puede conservar información local como borrador, historial, perfil y registro de entrega. Cualquier persona con acceso al mismo perfil del navegador o a un respaldo exportado podría consultar esos datos.

## Reportar una vulnerabilidad

No publiques detalles explotables en un issue público.

Utiliza el canal privado de seguridad de GitHub cuando esté habilitado. Si no está disponible, solicita al mantenedor un medio privado sin incluir inicialmente secretos, datos personales ni un exploit completo en espacios públicos.

Incluye, cuando sea posible:

- versión afectada;
- navegador y sistema operativo;
- componente afectado;
- pasos mínimos para reproducir;
- impacto observado;
- evidencia técnica sin datos personales;
- propuesta de mitigación, si la conoces.

## Datos que no deben publicarse

No adjuntes a issues, PR o discusiones públicas:

- bitácoras reales;
- respaldos JSON;
- listas de alumnos;
- firmas;
- nombres vinculados con horarios o entregas si no son datos destinados al catálogo público;
- contenido real de Data Matrix;
- identificadores de cámara;
- capturas que revelen datos personales.

Usa datos sintéticos para reproducir errores.

## Principios del proyecto

- Los datos del generador se procesan localmente siempre que sea posible.
- La caché de archivos no debe confundirse con un respaldo de datos.
- Limpiar o actualizar caché no debe borrar deliberadamente historial o registro de entrega.
- Los archivos importados deben validarse antes de incorporarse.
- El contenido introducido por usuarios no debe ejecutarse como HTML o código.
- No deben agregarse envíos remotos, analítica identificable, autenticación o sincronización sin revisar previamente privacidad, seguridad y documentación.
- Las dependencias y scripts externos deben mantenerse limitados, justificados y documentados.

## Dependencias externas

El registro de entrega puede cargar bibliotecas declaradas en su entrada para lectura Data Matrix e importación de hojas. Una modificación de esos orígenes, permisos o versiones debe tratarse como un cambio de seguridad y documentarse en la versión correspondiente.

## Pérdida de datos

Antes de borrar datos del navegador o realizar una migración manual, exporta un respaldo. Un PDF, CSV o caché no sustituye al respaldo JSON cuando se necesita conservar el estado editable completo.

Consulta [docs/DATOS_Y_CACHE.md](docs/DATOS_Y_CACHE.md).
