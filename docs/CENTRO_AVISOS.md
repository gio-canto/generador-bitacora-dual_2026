# Centro de avisos · Registro Dual (0.60.0)

La campanita de la cabecera de **Registro Dual** combina alertas calculadas desde el registro local. No utiliza servicios push, correos ni un servidor. Los avisos no son calificaciones ni sanciones escolares.

## Alertas y acciones

| Aviso | Condición | Acción |
| --- | --- | --- |
| Entrega vencida | Semana con fecha límite vencida y alumnos activos sin entregar. | Abrir la semana. |
| Próximo vencimiento | Fecha límite dentro de las 48 horas siguientes con entregas pendientes. | Abrir la semana. |
| Semana sin fecha límite | Falta fecha en una de las semanas recientes. | Abrir la semana. |
| Motivos por revisar | Jornadas de Falta/Sin labores con código 63 sin revisión. | Abrir clasificación de motivos y verificar la bitácora. |
| Entregas a destiempo | Recepciones tardías de semanas recientes. | Abrir Semanas. |
| Registro sin estadísticas | Entregas sin bloque S5 o sin jornadas completas. | Abrir Estadísticas. |
| Hitos | Alumnos que alcanzan 480 o 840 horas; en progreso cercanos a 480. | Abrir Estadísticas. |
| Faltas recurrentes | A partir de 3 jornadas registradas como falta por alumno. | Abrir Estadísticas. |
| Respaldo pendiente | Recordatorio que ya cumple reglas de respaldo. | Descargar el JSON. |

Las semanas de vencimientos y capturas se limitan a las seis más recientes para evitar una acumulación excesiva de alertas históricas. Los hitos consideran el historial completo y son referencias, no acreditaciones oficiales.

## Estados y sonido

Las alertas **activas** se derivan de los datos actuales: cuando desaparece la causa dejan de mostrarse. Las alertas **vistas** se marcan al abrir la bandeja y permanecen activas hasta que el asunto se resuelve en el sistema. La lectura se conserva en `bitacora-dual-inbox-seen-v1` del navegador, sin modificar las entregas ni el JSON de respaldo.

Si hay avisos nuevos y el sonido está activado, el navegador intenta reproducir una campanada corta y sintetizada. La política del navegador puede exigir una interacción previa; por ello el aviso visual siempre funciona y existe **Probar campana**. La preferencia de sonido se conserva en `bitacora-dual-inbox-sound-v1`.

El filtro permite mostrar todos, urgentes, seguimiento o información. Los accesos llevan a Semana, Estadísticas o descarga según el caso. La clasificación de «Otros» mantiene códigos y decisiones como en [Clasificación de motivos](CLASIFICACION_MOTIVOS_V059.md).

## Pruebas

Debug (`/debug/`) contiene un laboratorio que simula entregas vencidas, jornadas desconocidas, estadísticas incompletas, hitos, respaldos, campanada y textos de `Sin labores`, usando alumnos ficticios y memoria aislada. No se emplea la base real.

[Pruebas](PRUEBAS.md) · [Datos y respaldos](DATOS_Y_CACHE.md)
