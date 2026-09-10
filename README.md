<div align="center">

# Generador de Bitácora Dual 2026

### Crea, administra y exporta bitácoras semanales de Educación Dual desde el navegador

[![GitHub Pages](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml/badge.svg)](https://github.com/gio-canto/generador-bitacora-dual_2026/actions/workflows/pages.yml)
[![HTML5](https://img.shields.io/badge/HTML5-aplicación-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![Sin dependencias](https://img.shields.io/badge/dependencias-0-087F5B)](#tecnologías)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-075BD8)](LICENSE)

[Abrir aplicación](https://gio-canto.github.io/generador-bitacora-dual_2026/) · [Reportar un problema](https://github.com/gio-canto/generador-bitacora-dual_2026/issues) · [Ver cambios](https://github.com/gio-canto/generador-bitacora-dual_2026/commits/main)

</div>

---

## Descripción

**Generador de Bitácora Dual 2026** es una aplicación web estática para elaborar bitácoras semanales del modelo de Educación Dual. Su asistente divide el proceso en cinco etapas, conserva una vista previa exacta del documento y genera un PDF A4 horizontal directamente en el dispositivo.

Funciona para estudiantes del CBTis No. 134 que cursan del cuarto al sexto semestre y participan con alguna de las empresas u organismos disponibles. No requiere crear una cuenta, instalar programas ni enviar información personal a un servidor.

## Funciones principales

- Asistente progresivo de cinco etapas.
- Plantel institucional precargado y grupo editable.
- Seis especialidades disponibles: Programación, Contabilidad, Inteligencia Artificial, Comercio Electrónico, Administración de Recursos Humanos y Ofimática.
- Semestres permitidos del cuarto al sexto.
- Catálogo de empresas y organismos receptores.
- Generación automática de jornadas de martes a viernes.
- Horarios predeterminados editables.
- Estados de jornada laboral, sin labores o día inhábil.
- Descripción de actividades con Markdown básico.
- Límite y contador de caracteres por jornada.
- Áreas o departamentos independientes por día.
- Nombre de quien elabora sincronizado automáticamente con el alumno.
- Datos de Vo.Bo. de M. en A. Vepsania Marino Martínez precargados.
- Autorización de Mtra. Karen Paulina Solís Catalán precargada para el Consejo; captura personalizada para las demás empresas.
- Catálogo de instructores disponible únicamente para el Consejo y captura manual para las demás empresas.
- Vista previa exacta en formato A4 horizontal.
- Advertencia automática cuando el contenido rebasa una página.
- Descarga directa del PDF sin servicios externos.
- Historial local con apertura, duplicado y eliminación.
- Exportación e importación de respaldos JSON.
- Diseño adaptable para computadora, tableta y teléfono.
- Compatibilidad con movimiento y transparencia reducidos.

## Empresas y organismos disponibles

- Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG).
- Instituto Tecnológico de Chilpancingo (ITCH).
- Sistema de Universidad Virtual de la Universidad Autónoma de Guerrero (UAGro Virtual).
- 100% Natural Aeropuerto S.A. de C.V. (100% Natural).
- Chilpancingo Inn, S.A. de C.V. (Holiday Inn).
- Automóviles de Iguala, S.A. de C.V. (Nissan).
- Distribuidora Automotriz Acapulco, S.A. de C.V. (Chevrolet Chilpancingo).
- Operadora de Guerrero Duaabsa, S.A. de C.V. (KFC).
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

## Privacidad y almacenamiento

La aplicación funciona completamente del lado del cliente:

- Los registros se guardan mediante Web Storage.
- Los respaldos se generan como archivos JSON locales.
- El PDF se construye dentro del navegador.
- No existe base de datos remota.
- No se utilizan cookies de seguimiento.
- No se transmiten nombres, actividades ni documentos.

> Borrar los datos del sitio en el navegador también elimina los registros locales. Se recomienda exportar respaldos periódicamente.

## Formato de salida

| Propiedad | Configuración |
|---|---|
| Tamaño | A4 |
| Orientación | Horizontal |
| Tipografía | Times New Roman compatible |
| Resolución | Aproximadamente 300 dpi |
| Contenido | Encabezado, datos escolares, tabla semanal y firmas |
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

## Desarrollo

La aplicación permanece en un solo archivo HTML para facilitar el uso sin instalación, la distribución sin conexión, la revisión académica y la publicación directa en servicios estáticos.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) antes de proponer cambios.

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
