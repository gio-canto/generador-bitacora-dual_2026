<div align="center">

# Generador de Bitácora Dual 2026

### Crea, administra y exporta bitácoras semanales de Educación Dual desde el navegador

[![Versión](https://img.shields.io/badge/versi%C3%B3n-Beta%200.47-0071E3)](#versión)
[![GitHub Pages](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml/badge.svg)](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml)
[![HTML5](https://img.shields.io/badge/HTML5-aplicaci%C3%B3n-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![Sin dependencias](https://img.shields.io/badge/dependencias-0-087F5B)](#tecnologías)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-075BD8)](LICENSE)

[Abrir aplicación](https://gio-canto.github.io/generador-bitacora-dual_2026/) · [Preguntas frecuentes](https://gio-canto.github.io/generador-bitacora-dual_2026/faq/) · [Reportar un problema](https://github.com/gio-canto/generador-bitacora-dual_2026/issues) · [Ver cambios](https://github.com/gio-canto/generador-bitacora-dual_2026/commits/main)

</div>

---

## Descripción

**Generador de Bitácora Dual 2026** es una aplicación web estática para elaborar bitácoras semanales del modelo de Educación Dual. Su asistente divide el proceso en cinco etapas, conserva una vista previa exacta del documento y genera un PDF A4 horizontal directamente en el dispositivo.

Funciona para estudiantes del CBTis No. 134 que cursan del cuarto al sexto semestre y participan con alguna de las empresas u organismos disponibles. No requiere crear una cuenta, instalar programas ni enviar información personal a un servidor.

## Funciones principales

- Asistente progresivo de cinco etapas.
- Tutorial guiado que se inicia automáticamente en el primer acceso y puede abrirse nuevamente desde el botón **Tutorial**.
- Botón permanente de **Dudas** y acceso a un FAQ independiente con ejemplos y recomendaciones.
- Pantalla de créditos oculta mediante un easter egg en el nombre del alumno.
- Plantel institucional precargado y grupo editable.
- Seis especialidades disponibles: Programación, Contabilidad, Inteligencia Artificial, Comercio Electrónico, Administración de Recursos Humanos y Ofimática.
- Semestres permitidos del cuarto al sexto.
- Catálogo de empresas y organismos receptores.
- Generación automática de jornadas de martes a viernes.
- Horarios predeterminados editables.
- Horarios y área predeterminados ajustados automáticamente según la empresa seleccionada, sin impedir modificaciones manuales.
- UAGro Virtual y Chevrolet Chilpancingo utilizan 09:00–14:00 como horario predeterminado.
- Estados de jornada con labores, sin labores, día inhábil o falta.
- Justificación obligatoria para **Falta** y **Sin labores**; **Día inhábil** utiliza una justificación automática basada en el calendario escolar vigente.
- Avisos preventivos en ventanas visuales: **Falta**, **Sin labores** y **Día inhábil** muestran su recordatorio cada vez que se seleccionan.
- La alerta de **Día inhábil** incluye accesos directos al Modelo de Formación Dual y a DGETI para consultar fuentes oficiales si existe duda.
- Recordatorio final de que las firmas deben ser autógrafas y no se permiten firmas digitales.
- Descripción de actividades con Markdown básico y contador de caracteres.
- Límite dinámico de líneas por jornada: el espacio disponible se recalcula con base en lo escrito en los otros días, bloquea contenido que haría rebasar una hoja y muestra únicamente cuántas líneas quedan.
- Validación obligatoria de exactamente 4 jornadas y mínimo 4 palabras legibles por actividad o justificación.
- Grupo restringido a A, B, C o D.
- Autoguardado del borrador en el almacenamiento local del navegador, con recuperación al volver a abrir la aplicación.
- Aviso no restrictivo cuando un nombre parece contener solo un nombre y un apellido o estar incompleto.
- Áreas o departamentos independientes por día.
- Nombre de quien elabora sincronizado automáticamente con el alumno.
- Datos de Vo.Bo. de M. en A. Vepsania Marino Martínez precargados.
- Autorización de Mtra. Karen Paulina Solís Catalán precargada para COCYTIEG.
- Catálogo de instructores disponible para COCYTIEG.
- Catálogo de responsables de **Autorizó** para el TecNM Campus Chilpancingo, con opción personalizada.
- En los responsables precargados del TecNM, el cargo incluye también la función **Jefe inmediato**.
- Vista previa exacta en formato A4 horizontal.
- Etiquetas de firma en el PDF para alumno, asesor de empresa y Vinculación CBTis No. 134.
- Los rótulos **FALTA**, **SIN LABORES** y **DÍA INHÁBIL** se muestran en negrita dentro del PDF.
- Advertencia automática cuando el contenido rebasa una página.
- Descarga directa del PDF; en teléfonos compatibles se utiliza primero el menú nativo para compartir o guardar el archivo.
- Recordatorio posterior a la generación del PDF con recomendaciones de impresión, firmas y tinta azul.
- Historial local con apertura, duplicado y eliminación.
- Exportación e importación de respaldos JSON.
- Diseño adaptable para computadora, tableta y teléfono.
- Historial de actualizaciones compacto: la versión actual se muestra directamente y las anteriores quedan en una lista desplegable con desplazamiento.
- Compatibilidad con movimiento y transparencia reducidos.

## Empresas y organismos disponibles

- Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG).
- Instituto Tecnológico de Chilpancingo (ITCH).
- Sistema de Universidad Virtual de la Universidad Autónoma de Guerrero (UAGro Virtual).
- El Buen Tzin S.A. de C.V. (100% Natural).
- Chilpancingo Inn, S.A. de C.V. (Holiday Inn).
- Automóviles de Iguala, S.A. de C.V. (Nissan).
- Distribuidora Automotriz Acapulco, S.A. de C.V. (Chevrolet Chilpancingo).
- “La Avispa”, Museo Interactivo.

## Flujo de trabajo

| Etapa | Información solicitada |
|---|---|
| 1. Datos escolares | Plantel, especialidad, semestre y grupo |
| 2. Participantes | Nombre del alumno y empresa receptora |
| 3. Semana | Fechas, horarios, estados, áreas y actividades |
| 4. Responsables | Firmas, cargos e instructor opcional |
| 5. Revisión | Vista previa, registros, respaldos y descarga del PDF |

## Uso

1. Abre la [aplicación web](https://gio-canto.github.io/generador-bitacora-dual_2026/).
2. Completa los datos escolares.
3. Registra al alumno y la empresa.
4. Selecciona una fecha y pulsa **Generar martes a viernes**.
5. Describe las actividades realizadas.
6. Revisa responsables e instructor.
7. Comprueba que el documento cabe en una página.
8. Guarda el registro y descarga el PDF.
9. Revisa las recomendaciones de entrega y recopila las firmas correspondientes.

## Privacidad y almacenamiento

La aplicación funciona completamente del lado del cliente:

- Los registros se guardan mediante Web Storage.
- El borrador en curso se guarda automáticamente en Web Storage para recuperarlo después de cerrar o recargar el navegador.
- Los respaldos se generan como archivos JSON locales.
- El PDF se construye dentro del navegador.
- No existe base de datos remota.
- No se utilizan cookies de seguimiento.
- No se transmiten nombres, actividades ni documentos.

> Borrar los datos del sitio en el navegador también elimina los registros y el borrador local. El autoguardado permite recuperar el progreso en el mismo navegador y dispositivo; para cambiar de dispositivo o protegerse ante pérdida del equipo, se recomienda exportar respaldos JSON periódicamente.

## Formato de salida

| Propiedad | Configuración |
|---|---|
| Tamaño | A4 |
| Orientación | Horizontal |
| Tipografía | Times New Roman compatible |
| Resolución | Aproximadamente 300 dpi |
| Contenido | Encabezado, datos escolares, tabla semanal, etiquetas y espacios de firma |
| Validación | Detección de desbordamiento de una página |

## Tecnologías

- HTML5 semántico.
- CSS3 responsivo.
- JavaScript moderno sin frameworks.
- Canvas 2D para la vista previa.
- API Blob para archivos y respaldos.
- Web Storage para persistencia local.
- GitHub Actions para despliegue.
- GitHub Pages para alojamiento.

No hay dependencias de producción, gestores de paquetes ni procesos de compilación.

## Estructura del repositorio

~~~text
generador-bitacora-dual_2026/
├── .github/
│   └── workflows/
│       └── pages.yml
├── Assets/
│   └── Edu.png
├── faq/
│   └── index.html
├── .nojekyll
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
└── index.html
~~~

## Ejecución local

Puedes abrir **index.html** directamente en un navegador moderno.

Para servirlo localmente:

~~~bash
python -m http.server 8000
~~~

Después abre **http://localhost:8000**.

## Despliegue en GitHub Pages

El archivo **.github/workflows/pages.yml** publica automáticamente el sitio después de cada cambio en la rama **main**.

La primera vez se debe seleccionar:

~~~text
Settings > Pages > Build and deployment > Source > GitHub Actions
~~~

Después de habilitarlo, cada cambio en **main** inicia un nuevo despliegue.

## Compatibilidad

- Google Chrome.
- Microsoft Edge.
- Mozilla Firefox.
- Safari.
- Navegadores móviles basados en Chromium o WebKit.

## Accesibilidad

- Controles utilizables con teclado.
- Estados de enfoque visibles.
- Contraste reforzado en botones y campos.
- Adaptación a preferencias de movimiento reducido.
- Alternativa sólida para transparencia reducida.

## Respaldo y recuperación

**Exportar respaldo** descarga todos los registros en un archivo JSON. **Importar respaldo** permite recuperarlos posteriormente en el mismo dispositivo o trasladarlos a otro navegador.

Antes de importar información, conserva una copia del respaldo actual.

## Versión

**Beta 0.47**

## Desarrollo y colaboración

La aplicación permanece en un solo archivo HTML principal para facilitar el uso sin instalación, la distribución sin conexión, la revisión académica y la publicación directa en servicios estáticos.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) antes de proponer cambios. Los pull requests deben evitar datos personales reales y, cuando afecten el generador, probarse tanto en computadora como en teléfono.

## Seguridad

No publiques bitácoras reales ni respaldos con datos personales dentro del repositorio. Los problemas de seguridad deben comunicarse siguiendo [SECURITY.md](SECURITY.md).

## Licencia

Este proyecto se distribuye bajo la [Licencia MIT](LICENSE).

## Autor

**Gio Antonio Canto Gómez**

- GitHub: [@gio-canto](https://github.com/gio-canto)

---

<div align="center">
Hecho para simplificar la documentación semanal de Educación Dual.
</div>
