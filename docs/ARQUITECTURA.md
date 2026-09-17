# Arquitectura y diseño

Aplicación estática React con dos entradas Vite: generador y FAQ. No necesita base de datos ni servidor de aplicación.

| Capa | Responsabilidad |
| --- | --- |
| Datos JSON | Catálogos y respuestas del FAQ |
| Dominio | Generación de fechas, registros y reglas de validez |
| Servicios | Persistencia, importación/exportación, PDF y descarga |
| Componentes | Formulario, vista previa, editor, historial y diálogos |
| `useWorkspace` | Estado persistente y autoguardado |
| `App` | Coordinación del flujo y acciones del usuario |

El PDF conserva el motor de dibujo anterior, ahora con datos explícitos como argumentos. No consulta el DOM del formulario ni modifica prototipos globales. Vista previa y exportación usan el mismo modelo de página. La salida es un JPEG de alta resolución dentro de un PDF A4 horizontal.

La importación trata el JSON como datos no confiables: comprueba estructura, tamaño y catálogos antes de modificar el estado. React representa los valores del alumno como texto. El FAQ utiliza HTML estático revisado en Git; nunca acepta HTML del usuario.

## Criterios visuales

La base existente ya empleaba gris claro, blanco, azul y tipografía del sistema. Se conserva esa identidad con menos decoración, controles táctiles y agrupación por tarea. No se agregan secciones comerciales, imágenes ornamentales ni pantallas de demostración.

Parámetros de diseño aplicados: variación 3/10, movimiento 2/10, densidad 4/10. La legibilidad y la prevención de errores tienen prioridad. Inspiración Apple implementada con CSS propio: tipografía del sistema, respuesta al presionar, translucidez limitada a la barra, radios de 12 px en controles y 20–24 px en paneles.

En móvil los campos usan una columna; la navegación conserva cinco etapas y nombres. En iPad el contenido aprovecha el ancho disponible. Se admite teclado, foco visible, movimiento reducido, transparencia reducida y contraste aumentado. Sileo comunica resultados transitorios; los errores importantes permanecen en el formulario.

## Agregar funciones

1. Ubica la regla en `src/domain/` si no necesita navegador.
2. Usa `src/services/` para efectos y exportación.
3. Crea componentes centrados en una tarea, con datos mediante props.
4. Añade pruebas cuando exista riesgo de pérdida de información, error de fechas o cambio del PDF.
5. Actualiza notas de versión y documentación.

No guardes estado en variables globales ni vuelvas a enlazar campos mediante selectores DOM. No introduzcas servicios externos para procesar bitácoras sin revisar el alcance y actualizar la información de privacidad.
