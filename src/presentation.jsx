import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Blobatar } from "blobatar/react";
function SvgIcon({
  name,
  size = 20,
  className = "",
  weight = "regular",
  ...props
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: weight === "bold" ? 2 : 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const paths = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    arrowUpRight: (
      <>
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </>
    ),
    buildings: (
      <>
        <path d="M4 20V7l6-3v16" />
        <path d="M10 9h10v11" />
        <path d="M7 10h.01M7 14h.01M14 12h2M14 16h2" />
      </>
    ),
    checkCircle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16.5 8.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    code: (
      <>
        <path d="m9 7-5 5 5 5" />
        <path d="m15 7 5 5-5 5" />
        <path d="m13 5-2 14" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    desktop: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
    deviceMobile: (
      <>
        <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
        <path d="M10.5 5h3M11 18.5h2" />
      </>
    ),
    deviceTablet: (
      <>
        <rect x="5" y="2.5" width="14" height="19" rx="2.2" />
        <path d="M11 18.5h2" />
      </>
    ),
    filePdf: (
      <>
        <path d="M6 2.5h8l4 4V21H6z" />
        <path d="M14 2.5v4h4M9 12h6M9 15h6" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7h7l2 2h9v9.5H3z" />
        <path d="M3 7V5h6l2 2" />
      </>
    ),
    gitBranch: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="6" cy="19" r="2" />
        <circle cx="18" cy="9" r="2" />
        <path d="M6 7v10M8 7c5 0 4 2 8 2" />
      </>
    ),
    githubLogo: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 15c1.2 1 2.5 1.5 4 1.5s2.8-.5 4-1.5" />
        <path d="M8.5 9.5 7 7.5M15.5 9.5 17 7.5" />
        <path d="M9 12h.01M15 12h.01" />
      </>
    ),
    gitPullRequest: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="6" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
        <path d="M6 7v10M10 5h4a4 4 0 0 1 4 4v8" />
        <path d="m12 3 2 2-2 2" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    qrCode: (
      <>
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <path d="M14 14h2v2h-2zM18 14h2v6h-2M14 18h2v2h-2" />
      </>
    ),
    scan: (
      <>
        <path d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4" />
        <path d="M7 12h10" />
      </>
    ),
    shieldCheck: (
      <>
        <path d="M12 3 19 6v5c0 4.6-2.8 7.7-7 10-4.2-2.3-7-5.4-7-10V6z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    star: (
      <path
        d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
        fill={weight === "fill" ? "currentColor" : "none"}
      />
    ),
    student: (
      <>
        <path d="m3 9 9-5 9 5-9 5z" />
        <path d="M7 12v4c2.8 2 7.2 2 10 0v-4" />
        <path d="M21 9v6" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.2" />
        <path d="M3.5 19c.5-4 2.8-6 5.5-6s5 2 5.5 6" />
        <path d="M14 14c2.8.2 4.8 1.7 5.4 4" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden={props["aria-hidden"] ?? true}
      focusable="false"
      {...common}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

function iconComponent(name) {
  return function LocalIcon(props) {
    return <SvgIcon name={name} {...props} />;
  };
}

const ArrowRight = iconComponent("arrowRight");
const ArrowUpRight = iconComponent("arrowUpRight");
const Buildings = iconComponent("buildings");
const CheckCircle = iconComponent("checkCircle");
const Clock = iconComponent("clock");
const Code = iconComponent("code");
const Database = iconComponent("database");
const Desktop = iconComponent("desktop");
const DeviceMobile = iconComponent("deviceMobile");
const DeviceTablet = iconComponent("deviceTablet");
const FilePdf = iconComponent("filePdf");
const Folder = iconComponent("folder");
const GitBranch = iconComponent("gitBranch");
const GithubLogo = iconComponent("githubLogo");
const GitPullRequest = iconComponent("gitPullRequest");
const Lock = iconComponent("lock");
const Plus = iconComponent("plus");
const QrCode = iconComponent("qrCode");
const Scan = iconComponent("scan");
const ShieldCheck = iconComponent("shieldCheck");
const Star = iconComponent("star");
const Student = iconComponent("student");
const Users = iconComponent("users");

import "./presentation.css";

document.documentElement.classList.add("js", "presentation-react");

const REPO = "https://github.com/gio-canto/generador-bitacora-dual_2026";
const CONTRIBUTE = REPO + "/blob/main/CONTRIBUTING.md";
const LANGS = ["es", "en", "de"];

const COPY = {
  es: {
    nav: {
      students: "Alumnos",
      schools: "Escuelas",
      time: "Tiempos",
      opinions: "Opiniones",
      systems: "Sistemas",
      institutions: "Instituciones",
      collaborate: "Colaborar",
      label: "Navegación",
    },
    hero: {
      alt: "Vista de Bitácora Dual 2026",
      title: "Nunca fue tan fácil hacer una bitácora.",
      text: "Hazla desde tu teléfono, iPad o computadora. La escuela la recibe con un formato consistente y puede llevar un control más rápido de las entregas.",
      collaborate: "Colaborar",
      try: "Probar el generador",
      devices: "Disponible en distintos dispositivos",
      phone: "Teléfono",
      tablet: "iPad",
      desktop: "Computadora",
    },
    student: {
      label: "Para el alumno",
      title: "Escribe lo que hiciste. Lo demás ya debería estar listo.",
      text: "La bitácora deja de ser un archivo que tienes que reconstruir cada semana. Tus datos frecuentes pueden quedar preparados y tú te concentras en registrar las actividades que realmente realizaste.",
      advantages: [
        ["En cualquier dispositivo.", "Crea tu bitácora desde teléfono, PC o iPad, sin depender de un Excel raro o de un Word que cambia según el equipo."],
        ["Tu historial se queda contigo.", "Guarda bitácoras y respaldos en tu propio dispositivo para volver a ellas cuando lo necesites."],
        ["Más intuitivo, menos errores.", "El sistema guía el llenado y mantiene el formato para reducir equivocaciones de captura o estructura."],
        ["Sin repetir lo mismo cada semana.", "Plantel, especialidad, empresa, horarios y otros datos pueden quedar precargados. Tú escribes lo que realizaste y continúas."],
      ],
    },
    school: {
      label: "Para la escuela",
      title: "Un formato igual para todos. Un seguimiento más rápido para Vinculación.",
      text: "Facilitarle la bitácora al alumno también ayuda al plantel: menos formatos alterados, menos archivos distintos y una forma más clara de saber quién entregó.",
      advantages: [
        ["Facilita el proceso al alumno", "Un flujo claro reduce la fricción de elaborar la evidencia semanal."],
        ["Estandariza las bitácoras", "Todos parten de la misma estructura y del mismo formato institucional."],
        ["Evita cambios accidentales", "El alumno no necesita mover celdas, márgenes o elementos del documento para poder llenarlo."],
        ["Controla entregas con rapidez", "Vinculación puede registrar, filtrar y reportar entregas sin volver a capturar cada dato."],
      ],
    },
    time: {
      label: "Tiempo aproximado",
      title: "Menos tiempo llenando y registrando. Más tiempo para lo importante.",
      text: "Comparación orientativa basada en el flujo esperado del proyecto. No es un benchmark formal: los tiempos reales cambian según la persona, el plantel y la cantidad de alumnos.",
      student: "Alumno",
      school: "Escuela",
      without: "Sin el sistema",
      perLog: "aprox. por bitácora",
      with: "Con el sistema",
      preloaded: "cuando sus datos ya están precargados",
      manual: "Registro manual",
      reception: "aprox. para una jornada de recepción",
      automated: "Registro automatizado",
      scanning: "aprox. con escaneo y base preparada",
      disclaimer: "Tiempos aproximados de uso previstos para explicar la diferencia de flujo; no representan una medición científica ni garantizan un tiempo específico.",
      clockAria: "Reloj animado ilustrativo para",
    },
    testimonials: {
      label: "Lo que dicen quienes lo usan",
      title: "Hecho para resolver una tarea real, semana tras semana.",
      text: "Opiniones de estudiantes que ya han usado el generador dentro de su proceso de Educación Dual.",
      quote: "Pues me ha ayudado a hacerlos de manera rápida y limpia; también me ha ayudado bastante a corregir mis faltas ortográficas.",
      name: "Wuendy G.",
      role: "Alumna del Sistema Dual",
      institution: "CBTis 134",
      translated: "",
    },
    systems: {
      label: "El proyecto",
      title: "Tres herramientas para distintas partes del proceso.",
      text: "El alumno no necesita una pantalla administrativa y Vinculación no necesita llenar la bitácora. Cada sistema hace una sola cosa y la hace de forma clara.",
      items: [
        ["Alumnos", "Generador de Bitácora Dual", "Captura la semana, reutiliza información frecuente, conserva historial, muestra una vista previa y genera un PDF listo para revisión y firma.", "Abrir"],
        ["Vinculación", "Registro de entregas", "Administra alumnos y semanas, escanea Data Matrix, distingue entregas a tiempo o a destiempo y genera listados y reportes globales.", "Abrir"],
        ["Constancias", "Sistema de gestión y emisión", "Un sistema complementario para organizar la gestión y emisión de constancias de alumnos de modalidad dual y reducir otro trámite repetitivo.", "Complementario"],
      ],
    },
    matrix: {
      title: "La bitácora también puede identificarse sola.",
      text: "El Data Matrix conecta el documento con el registro de entrega. Incluye la identidad necesaria para ubicar al alumno y el periodo correcto, sin guardar las actividades ni las firmas.",
      student: "Alumno",
      name: "Nombre",
      affiliation: "Adscripción",
      specialty: "Especialidad y empresa",
      period: "Periodo",
      dates: "Fecha inicial y final",
      alt: "Ejemplo de una bitácora con Data Matrix",
      caption: "Ejemplo de una bitácora preparada para el registro de entrega.",
    },
    workflow: {
      label: "Un flujo simple",
      title: "Crear. Entregar. Registrar. Reportar.",
      items: [
        ["El alumno crea", "Completa sus actividades y descarga la bitácora."],
        ["La escuela recibe", "Escanea o registra la entrega manualmente."],
        ["El sistema organiza", "Relaciona alumno, semana y estado de entrega."],
        ["Vinculación reporta", "Consulta por semana o genera una matriz global."],
      ],
    },
    institution: {
      label: "Para instituciones",
      title: "¿Quieres que tu institución pueda usar este sistema?",
      text: "La idea es que el proyecto pueda crecer de forma autónoma. Un alumno, docente o plantel puede aportar directamente: agregar su escuela, empresa, responsable o una mejora completa sin tener que esperar a que alguien lo haga por ellos.",
      route1: "Ruta 1 · Colaborar",
      route1Title: "Tu escuela puede agregarse al proyecto.",
      route1Text: "Estudiantes, docentes o personal de Vinculación pueden editar los catálogos, agregar una escuela o empresa, corregir datos, crear una rama y enviar una pull request. Las aportaciones útiles son bienvenidas.",
      route1Action: "Colaborar en GitHub",
      route2: "Ruta 2 · Implementación acompañada",
      route2Title: "Si necesitan ayuda, también pueden pedirla.",
      route2Text: "Si el plantel no quiere tocar código, se puede revisar su formato, responsables, empresas, calendario, reglas de entrega y reportes para plantear una integración compatible con su procedimiento actual.",
      route2Action: "Pedir apoyo al creador",
      noteTitle: "La meta no es cambiar el procedimiento porque sí.",
      noteText: "Es quitar captura repetida y conservar los controles que la escuela realmente necesita.",
    },
    principles: {
      label: "Cómo está construido",
      privacy: "Privacidad.",
      privacyText: "El generador no necesita una cuenta para crear bitácoras. Los datos de trabajo, historial y registro se mantienen en el navegador o dispositivo y las exportaciones quedan bajo control de quien las descarga.",
      privacyAction: "Leer aviso de privacidad",
      open: "Open source.",
      openText: "El código está disponible públicamente bajo la licencia del proyecto. Cualquier persona puede estudiarlo, proponer mejoras y colaborar mediante issues o pull requests. Un estudiante puede incluso proponer su propio plantel o actualizar un catálogo sin depender de una administración central.",
      openAction: "Colaborar en GitHub",
    },
    github: {
      label: "Proyecto abierto",
      title: "Úsalo. Mejora lo que haga falta. Compártelo.",
      text: "La colaboración es la acción principal del proyecto. Si encuentras algo que pueda mejorar, propón el cambio. Y si te sirve tal como está, una estrella en GitHub ayuda a que más personas lo encuentren.",
      collaborate: "Colaborar",
      star: "Dar estrella",
    },
    closing: {
      title: "Menos tiempo acomodando formatos. Más tiempo documentando lo que hiciste.",
      collaborate: "Colaborar con el proyecto",
      create: "Crear una bitácora",
    },
    footer: {
      beta: "Proyecto open source en beta.",
      links: "Enlaces del pie",
      privacy: "Privacidad",
      accessibility: "Accesibilidad",
    },
    warning: {
      title: "El sistema completo está en español",
      text: "Esta traducción corresponde únicamente a la landing page. El generador, el registro de entregas y sus controles internos continúan disponibles en español.",
      stay: "Quedarme aquí",
      continue: "Continuar al sistema",
    },
  },
  en: {
    nav: { students: "Students", schools: "Schools", time: "Time", opinions: "Reviews", systems: "Systems", institutions: "Institutions", collaborate: "Contribute", label: "Navigation" },
    hero: {
      alt: "Bitácora Dual 2026 preview",
      title: "Creating a dual-education logbook has never been this easy.",
      text: "Create it from your phone, iPad, or computer. Schools receive a consistent format and can track submissions more efficiently.",
      collaborate: "Contribute",
      try: "Try the generator",
      devices: "Available on different devices",
      phone: "Phone",
      tablet: "iPad",
      desktop: "Computer",
    },
    student: {
      label: "For students",
      title: "Write what you did. Everything else should already be ready.",
      text: "Your weekly logbook no longer has to be rebuilt from scratch. Frequent information can stay prepared so you can focus on documenting the work you actually did.",
      advantages: [
        ["On any device.", "Create your logbook on a phone, PC, or iPad without depending on an awkward spreadsheet or a Word file that changes between devices."],
        ["Your history stays with you.", "Keep logbooks and backups on your own device so you can return to them whenever you need them."],
        ["More intuitive, fewer errors.", "The system guides data entry and keeps the format consistent to reduce capture and layout mistakes."],
        ["No repeating the same data every week.", "School, program, company, schedules, and other recurring information can be preloaded. You write what you did and move on."],
      ],
    },
    school: {
      label: "For schools",
      title: "One consistent format for everyone. Faster tracking for school coordinators.",
      text: "Making the logbook easier for students also helps the school: fewer altered formats, fewer mismatched files, and a clearer way to know who submitted.",
      advantages: [
        ["Makes the student process easier", "A clear workflow reduces friction when preparing weekly evidence."],
        ["Standardizes logbooks", "Everyone starts from the same structure and institutional format."],
        ["Prevents accidental changes", "Students do not need to move cells, margins, or document elements just to complete the form."],
        ["Tracks submissions quickly", "Coordinators can register, filter, and report submissions without re-entering every field."],
      ],
    },
    time: {
      label: "Approximate time",
      title: "Less time filling and registering. More time for what matters.",
      text: "An illustrative comparison based on the project's intended workflow. This is not a formal benchmark: actual times vary by person, school, and number of students.",
      student: "Student",
      school: "School",
      without: "Without the system",
      perLog: "approx. per logbook",
      with: "With the system",
      preloaded: "when recurring data is already preloaded",
      manual: "Manual registration",
      reception: "approx. for one intake session",
      automated: "Automated registration",
      scanning: "approx. with scanning and a prepared database",
      disclaimer: "Approximate expected use times shown to illustrate the workflow difference; they are not a scientific measurement and do not guarantee a specific duration.",
      clockAria: "Animated illustrative clock for",
    },
    testimonials: {
      label: "What users are saying",
      title: "Built to solve a real weekly task.",
      text: "Feedback from students who have already used the generator as part of their Dual Education process.",
      quote: "It has helped me do them quickly and neatly, and it has also helped me a lot with correcting my spelling mistakes.",
      name: "Wuendy G.",
      role: "Dual Education student",
      institution: "CBTis 134",
      translated: "Translated from Spanish.",
    },
    systems: {
      label: "The project",
      title: "Three tools for different parts of the process.",
      text: "Students do not need an administrative dashboard, and school coordinators do not need to fill in the logbook. Each system does one job and keeps it clear.",
      items: [
        ["Students", "Dual Logbook Generator", "Capture the week, reuse recurring information, keep history, preview the document, and generate a PDF ready for review and signatures.", "Open"],
        ["School coordination", "Submission registry", "Manage students and weeks, scan Data Matrix codes, distinguish on-time and late submissions, and create lists and global reports.", "Open"],
        ["Certificates", "Management and issuance system", "A complementary system for organizing the management and issuance of certificates for dual-education students and reducing another repetitive process.", "Complementary"],
      ],
    },
    matrix: {
      title: "The logbook can identify itself, too.",
      text: "The Data Matrix connects the document with the submission registry. It includes the identity needed to locate the student and the correct period without storing activities or signatures.",
      student: "Student",
      name: "Name",
      affiliation: "Affiliation",
      specialty: "Program and company",
      period: "Period",
      dates: "Start and end date",
      alt: "Example of a logbook with a Data Matrix",
      caption: "Example of a logbook prepared for submission registration.",
    },
    workflow: {
      label: "A simple workflow",
      title: "Create. Submit. Register. Report.",
      items: [
        ["The student creates", "Completes activities and downloads the logbook."],
        ["The school receives", "Scans or manually registers the submission."],
        ["The system organizes", "Links the student, week, and submission status."],
        ["Coordination reports", "Reviews a week or generates a global matrix."],
      ],
    },
    institution: {
      label: "For institutions",
      title: "Do you want your institution to use this system?",
      text: "The project is designed to grow autonomously. A student, teacher, or school can contribute directly by adding their school, company, responsible staff, or a complete improvement without waiting for someone else to do it.",
      route1: "Path 1 · Contribute",
      route1Title: "Your school can be added to the project.",
      route1Text: "Students, teachers, or coordination staff can edit catalogs, add a school or company, correct data, create a branch, and submit a pull request. Useful contributions are welcome.",
      route1Action: "Contribute on GitHub",
      route2: "Path 2 · Assisted implementation",
      route2Title: "If you need help, you can ask for it too.",
      route2Text: "If the school does not want to touch code, its format, responsible staff, companies, calendar, submission rules, and reports can be reviewed to propose an integration compatible with its current process.",
      route2Action: "Ask the creator for help",
      noteTitle: "The goal is not to change the process just for the sake of it.",
      noteText: "It is to remove repetitive data entry while preserving the controls the school actually needs.",
    },
    principles: {
      label: "How it is built",
      privacy: "Privacy.",
      privacyText: "The generator does not require an account to create logbooks. Work data, history, and registry information stay in the browser or device, and exported files remain under the control of the person who downloads them.",
      privacyAction: "Read the privacy notice",
      open: "Open source.",
      openText: "The code is publicly available under the project's license. Anyone can study it, propose improvements, and contribute through issues or pull requests. A student can even propose their own school or update a catalog without relying on a central administration.",
      openAction: "Contribute on GitHub",
    },
    github: {
      label: "Open project",
      title: "Use it. Improve what needs improving. Share it.",
      text: "Collaboration is the project's main action. If you find something that can be better, propose the change. If it already helps you, a GitHub star can help more people find it.",
      collaborate: "Contribute",
      star: "Star the project",
    },
    closing: {
      title: "Less time fixing formats. More time documenting what you actually did.",
      collaborate: "Contribute to the project",
      create: "Create a logbook",
    },
    footer: {
      beta: "Open-source project in beta.",
      links: "Footer links",
      privacy: "Privacy",
      accessibility: "Accessibility",
    },
    warning: {
      title: "The full system is currently in Spanish",
      text: "Only this landing page is translated. The generator, submission registry, and their internal controls are still available in Spanish.",
      stay: "Stay on this page",
      continue: "Continue to the Spanish system",
    },
  },
  de: {
    nav: { students: "Auszubildende", schools: "Ausbildungspartner", time: "Zeit", opinions: "Stimmen", systems: "Systeme", institutions: "Institutionen", collaborate: "Mitwirken", label: "Navigation" },
    hero: {
      alt: "Vorschau von Bitácora Dual 2026",
      title: "Ausbildungsnachweise für die duale Berufsausbildung – einfacher geführt.",
      text: "Führe deinen Ausbildungsnachweis (Berichtsheft) für die duale Berufsausbildung auf dem Smartphone, iPad oder Computer. Ausbildungsbetrieb und Berufsschule erhalten eine einheitliche Dokumentation, und Nachweise lassen sich schneller zuordnen.",
      collaborate: "Mitwirken",
      try: "Generator ausprobieren",
      devices: "Auf verschiedenen Geräten verfügbar",
      phone: "Smartphone",
      tablet: "iPad",
      desktop: "Computer",
    },
    student: {
      label: "Für Auszubildende",
      title: "Dokumentiere deine Tätigkeiten. Wiederkehrende Angaben sollten schon vorbereitet sein.",
      text: "Der Ausbildungsnachweis muss nicht jede Woche neu aufgebaut werden. Wiederkehrende Angaben können vorbereitet bleiben, damit du dich auf die tatsächlich ausgeführten Tätigkeiten im Ausbildungsbetrieb konzentrierst.",
      advantages: [
        ["Auf jedem Gerät.", "Führe deinen Ausbildungsnachweis auf Smartphone, PC oder iPad, ohne von einer umständlichen Excel-Datei oder einem Word-Dokument abhängig zu sein, das sich je nach Gerät verändert."],
        ["Dein Verlauf bleibt bei dir.", "Speichere Ausbildungsnachweise und Sicherungen auf deinem eigenen Gerät und greife später wieder darauf zu."],
        ["Intuitiver, weniger Fehler.", "Das System führt durch die Eingabe und hält das Format konsistent, um Erfassungs- und Strukturfehler zu reduzieren."],
        ["Nicht jede Woche dieselben Daten.", "Berufsschule, Fachrichtung, Ausbildungsbetrieb, Ausbildungszeiten und weitere wiederkehrende Angaben können vorausgefüllt werden. Du dokumentierst deine Tätigkeiten und machst weiter."],
      ],
    },
    school: {
      label: "Für Ausbildungsbetriebe und Berufsschulen",
      title: "Ein einheitlicher Ausbildungsnachweis. Schnellere Nachverfolgung für Ausbildungspartner.",
      text: "Wenn der Ausbildungsnachweis für Auszubildende einfacher wird, profitieren auch Ausbildungsbetrieb und Berufsschule: weniger veränderte Vorlagen, weniger unterschiedliche Dateien und ein klarerer Überblick über die Dokumentation.",
      advantages: [
        ["Vereinfacht den Ablauf für Auszubildende", "Ein klarer Ablauf reduziert den Aufwand beim regelmäßigen Führen des Ausbildungsnachweises."],
        ["Standardisiert Ausbildungsnachweise", "Alle arbeiten mit derselben Struktur und einem einheitlichen Format für den Ausbildungsnachweis."],
        ["Verhindert versehentliche Änderungen", "Auszubildende müssen keine Zellen, Ränder oder Dokumentelemente verschieben, um den Nachweis auszufüllen."],
        ["Erfasst Nachweise schneller", "Die Ausbildungskoordination kann Abgaben registrieren, filtern und auswerten, ohne alle Daten erneut einzugeben."],
      ],
    },
    time: {
      label: "Ungefähre Zeit",
      title: "Weniger Zeit fürs Ausfüllen und Erfassen. Mehr Zeit für das Wesentliche.",
      text: "Eine illustrative Gegenüberstellung auf Basis des vorgesehenen Projektablaufs. Dies ist kein formaler Benchmark: Die tatsächliche Dauer hängt von den Auszubildenden, dem Ausbildungspartner und der Anzahl der Nachweise ab.",
      student: "Auszubildende",
      school: "Ausbildungspartner",
      without: "Ohne das System",
      perLog: "ca. pro Ausbildungsnachweis",
      with: "Mit dem System",
      preloaded: "wenn wiederkehrende Daten bereits vorausgefüllt sind",
      manual: "Manuelle Erfassung",
      reception: "ca. für einen Termin zur Nachweiserfassung",
      automated: "Automatisierte Erfassung",
      scanning: "ca. mit Scan und vorbereiteter Datenbasis",
      disclaimer: "Die ungefähren Nutzungszeiten dienen nur dazu, den Unterschied im Ablauf zu veranschaulichen; sie sind keine wissenschaftliche Messung und garantieren keine bestimmte Dauer.",
      clockAria: "Animierte illustrative Uhr für",
    },
    testimonials: {
      label: "Was Nutzer sagen",
      title: "Für eine echte Aufgabe entwickelt, die jede Woche wiederkommt.",
      text: "Rückmeldungen von Lernenden, die den Generator bereits in einem dualen Bildungsmodell verwenden. Die deutsche Fassung orientiert sich sprachlich an der dualen Berufsausbildung in Deutschland.",
      quote: "Es hat mir geholfen, meine Nachweise schnell und ordentlich zu erstellen, und außerdem hilft es mir sehr dabei, meine Rechtschreibfehler zu korrigieren.",
      name: "Wuendy G.",
      role: "Teilnehmerin am dualen Bildungsmodell in Mexiko",
      institution: "CBTis 134",
      translated: "Aus dem Spanischen übersetzt.",
    },
    systems: {
      label: "Das Projekt",
      title: "Drei Werkzeuge für unterschiedliche Teile des Ablaufs.",
      text: "Auszubildende brauchen keine Verwaltungsoberfläche, und Ausbildungspartner müssen den Ausbildungsnachweis nicht für sie ausfüllen. Jedes System erfüllt eine klar abgegrenzte Aufgabe.",
      items: [
        ["Auszubildende", "Generator für Ausbildungsnachweise", "Dokumentiert den Ausbildungszeitraum, nutzt wiederkehrende Angaben erneut, speichert den Verlauf, zeigt eine Vorschau und erstellt ein PDF des Ausbildungsnachweises zur Prüfung und Unterschrift.", "Öffnen"],
        ["Ausbildungskoordination", "Nachweis- und Abgaberegister", "Verwaltet Auszubildende und Nachweiszeiträume, scannt Data-Matrix-Codes, unterscheidet fristgerechte und verspätete Abgaben und erstellt Listen sowie Gesamtberichte.", "Öffnen"],
        ["Bescheinigungen", "Verwaltungs- und Ausgabesystem", "Ein ergänzendes System zur Organisation und Ausgabe von Bescheinigungen für Teilnehmende am dualen Modell und zur Reduzierung eines weiteren wiederkehrenden Verwaltungsablaufs.", "Ergänzend"],
      ],
    },
    matrix: {
      title: "Auch der Ausbildungsnachweis kann sich digital zuordnen lassen.",
      text: "Der Data Matrix verbindet den Ausbildungsnachweis mit dem Nachweis- und Abgaberegister. Er enthält die nötigen Angaben, um Auszubildende und Zeitraum zuzuordnen, ohne Tätigkeiten oder Unterschriften zu speichern.",
      student: "Auszubildende",
      name: "Name",
      affiliation: "Ausbildungskontext",
      specialty: "Fachrichtung und Ausbildungsbetrieb",
      period: "Zeitraum",
      dates: "Start- und Enddatum",
      alt: "Beispiel eines Ausbildungsnachweises mit Data Matrix",
      caption: "Beispiel eines für die Nachweiserfassung vorbereiteten Ausbildungsnachweises.",
    },
    workflow: {
      label: "Ein einfacher Ablauf",
      title: "Erstellen. Abgeben. Erfassen. Auswerten.",
      items: [
        ["Auszubildende dokumentieren", "Erfassen ihre Tätigkeiten und laden den Ausbildungsnachweis herunter."],
        ["Der Ausbildungspartner erhält", "Scannt den Nachweis oder erfasst die Abgabe manuell."],
        ["Das System organisiert", "Verknüpft Auszubildende, Nachweiszeitraum und Abgabestatus."],
        ["Die Ausbildungskoordination wertet aus", "Prüft einzelne Nachweiszeiträume oder erzeugt eine Gesamtmatrix."],
      ],
    },
    institution: {
      label: "Für Institutionen",
      title: "Soll deine Institution dieses System nutzen können?",
      text: "Das Projekt soll eigenständig wachsen können. Auszubildende, Ausbilderinnen und Ausbilder, Lehrkräfte an Berufsschulen oder Ausbildungsbetriebe können direkt beitragen: eine Einrichtung oder einen Betrieb ergänzen, zuständige Personen eintragen oder eine vollständige Verbesserung vorschlagen.",
      route1: "Weg 1 · Mitwirken",
      route1Title: "Deine Berufsschule oder dein Ausbildungsbetrieb kann zum Projekt hinzugefügt werden.",
      route1Text: "Auszubildende, Ausbilderinnen und Ausbilder, Berufsschullehrkräfte oder Koordinationspersonal können Kataloge bearbeiten, eine Berufsschule oder einen Ausbildungsbetrieb ergänzen, Daten korrigieren, einen Branch erstellen und einen Pull Request senden. Sinnvolle Beiträge sind willkommen.",
      route1Action: "Auf GitHub mitwirken",
      route2: "Weg 2 · Begleitete Implementierung",
      route2Title: "Wenn Unterstützung nötig ist, kann sie ebenfalls angefragt werden.",
      route2Text: "Wenn eine Einrichtung keinen Code bearbeiten möchte, können Format, Ausbildungsverantwortliche, Ausbildungsbetriebe, Zeiträume, Regeln zur Nachweisabgabe und Berichte geprüft werden, um eine mit dem bestehenden Ablauf kompatible Integration vorzuschlagen.",
      route2Action: "Hilfe beim Ersteller anfragen",
      noteTitle: "Das Ziel ist nicht, den Ablauf grundlos zu verändern.",
      noteText: "Es geht darum, wiederholte Dateneingabe zu reduzieren und die Nachweis- und Kontrollschritte zu erhalten, die Ausbildungspartner tatsächlich benötigen.",
    },
    principles: {
      label: "So ist es aufgebaut",
      privacy: "Datenschutz.",
      privacyText: "Der Generator benötigt kein Konto, um Ausbildungsnachweise zu erstellen. Tätigkeitsdaten, Verlauf und Register bleiben im Browser oder auf dem Gerät; exportierte Dateien bleiben unter Kontrolle der Person, die sie herunterlädt.",
      privacyAction: "Datenschutzhinweis lesen",
      open: "Open Source.",
      openText: "Der Code ist unter der Projektlizenz öffentlich verfügbar. Jede Person kann ihn untersuchen, Verbesserungen vorschlagen und über Issues oder Pull Requests mitwirken. Auszubildende können sogar ihre Berufsschule oder ihren Ausbildungsbetrieb vorschlagen oder einen Katalog aktualisieren, ohne von einer zentralen Verwaltung abhängig zu sein.",
      openAction: "Auf GitHub mitwirken",
    },
    github: {
      label: "Offenes Projekt",
      title: "Nutze es. Verbessere, was verbessert werden muss. Teile es.",
      text: "Zusammenarbeit ist die wichtigste Aktion des Projekts. Wenn du etwas verbessern kannst, schlage die Änderung vor. Wenn es dir bereits hilft, kann ein GitHub-Stern dafür sorgen, dass mehr Menschen das Projekt finden.",
      collaborate: "Mitwirken",
      star: "Stern vergeben",
    },
    closing: {
      title: "Weniger Zeit für Formatierung. Mehr Zeit für einen sauberen Ausbildungsnachweis.",
      collaborate: "Am Projekt mitwirken",
      create: "Ausbildungsnachweis erstellen",
    },
    footer: {
      beta: "Open-Source-Projekt in der Beta-Phase.",
      links: "Links im Seitenfuß",
      privacy: "Datenschutz",
      accessibility: "Barrierefreiheit",
    },
    warning: {
      title: "Das vollständige System ist derzeit auf Spanisch",
      text: "Nur diese Landingpage ist ins Deutsche übertragen und sprachlich an die duale Berufsausbildung in Deutschland angepasst. Der Generator, das Nachweis- und Abgaberegister sowie die zugrunde liegenden Abläufe bleiben auf Spanisch und orientieren sich am mexikanischen Einsatzkontext.",
      stay: "Auf dieser Seite bleiben",
      continue: "Zum spanischen System wechseln",
    },
  },
};

const studentIcons = [DeviceMobile, Folder, CheckCircle, Database];
const schoolIcons = [Student, FilePdf, ShieldCheck, Scan];
const systemMeta = [
  { icon: FilePdf, href: "../" },
  { icon: Scan, href: "../registro-entrega/" },
  { icon: Buildings },
];
const processIcons = [FilePdf, Scan, Database, Buildings];

function initialLanguage() {
  const value = new URLSearchParams(window.location.search).get("lang");
  return LANGS.includes(value) ? value : "es";
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

function useReveal() {
  useEffect(() => {
    const nodes = [...document.querySelectorAll(".reveal")];
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return undefined;
}

function useScrollMotion(reducedMotion) {
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.style.setProperty("--scroll-progress", "0");
      document.documentElement.style.setProperty("--hero-shift", "0px");
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      const heroShift = Math.min(44, window.scrollY * 0.08);
      document.documentElement.style.setProperty(
        "--scroll-progress",
        String(progress),
      );
      document.documentElement.style.setProperty(
        "--hero-shift",
        heroShift + "px",
      );
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);
}

function IconCircle({ icon: Icon, dark = false }) {
  return (
    <span className={dark ? "react-icon dark" : "react-icon"} aria-hidden="true">
      <Icon size={20} weight="regular" />
    </span>
  );
}

function MotionClock({ label, ariaPrefix, school = false }) {
  return (
    <div className="time-clock-wrap">
      <div
        className={school ? "moving-clock school-clock" : "moving-clock"}
        aria-label={ariaPrefix + " " + label.toLowerCase()}
      >
        <span className="clock-dot c1" />
        <span className="clock-dot c2" />
        <span className="clock-dot c3" />
        <span className="clock-dot c4" />
        <span className="clock-hand hour" />
        <span className="clock-hand minute" />
        <span className="clock-center" />
      </div>
      <span className="clock-caption">
        <Clock size={13} weight="bold" /> {label}
      </span>
    </div>
  );
}

function LanguagePicker({ language, onChange }) {
  return (
    <div className="language-picker" aria-label="Language">
      {LANGS.map((code) => (
        <button
          type="button"
          key={code}
          className={language === code ? "active" : ""}
          aria-pressed={language === code}
          onClick={() => onChange(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Header({ language, copy, onLanguage }) {
  return (
    <header className="site-nav">
      <div className="scroll-progress" aria-hidden="true" />
      <a className="brand" href="./" aria-label="Bitácora Dual 2026">
        Bitácora Dual
      </a>
      <nav className="desktop-nav" aria-label={copy.nav.label}>
        <a href="#alumnos">{copy.nav.students}</a>
        <a href="#escuelas">{copy.nav.schools}</a>
        <a href="#tiempos">{copy.nav.time}</a>
        <a href="#opiniones">{copy.nav.opinions}</a>
        <a href="#sistemas">{copy.nav.systems}</a>
        <a href="#matrix">Data Matrix</a>
        <a href="#instituciones">{copy.nav.institutions}</a>
      </nav>
      <div className="nav-tools">
        <LanguagePicker language={language} onChange={onLanguage} />
        <a
          className="nav-cta"
          href={CONTRIBUTE}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitPullRequest size={15} weight="bold" />
          {copy.nav.collaborate}
        </a>
      </div>
    </header>
  );
}

function Hero({ copy, onSystemLink }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img className="hero-image" src="../Assets/asset_landing.png" alt={copy.hero.alt} />
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-copy reveal">
        <p className="eyebrow light">Bitácora Dual 2026</p>
        <h1 id="hero-title">{copy.hero.title}</h1>
        <p>{copy.hero.text}</p>
        <div className="hero-actions">
          <a className="button white" href={CONTRIBUTE} target="_blank" rel="noopener noreferrer">
            <GitPullRequest size={18} weight="bold" />
            {copy.hero.collaborate}
          </a>
          <a className="button glass" href="../" onClick={(event) => onSystemLink(event, "../")}>
            <FilePdf size={18} weight="bold" />
            {copy.hero.try}
          </a>
        </div>
        <div className="hero-device-row" aria-label={copy.hero.devices}>
          <span><DeviceMobile size={18} /> {copy.hero.phone}</span>
          <span><DeviceTablet size={18} /> {copy.hero.tablet}</span>
          <span><Desktop size={18} /> {copy.hero.desktop}</span>
        </div>
      </div>
    </section>
  );
}

function StudentSection({ copy }) {
  return (
    <section className="editorial intro" id="alumnos">
      <div className="section-label reveal">
        <Student size={16} weight="bold" /> {copy.student.label}
      </div>
      <div className="editorial-copy reveal">
        <h2>{copy.student.title}</h2>
        <p>{copy.student.text}</p>
      </div>
      <div className="advantage-list reveal">
        {copy.student.advantages.map(([title, text], index) => (
          <article key={title}>
            <div className="advantage-title">
              <IconCircle icon={studentIcons[index]} />
              <strong>{title}</strong>
            </div>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SchoolSection({ copy }) {
  return (
    <section className="school-section" id="escuelas">
      <div className="school-inner">
        <div className="section-label light reveal">
          <Buildings size={16} weight="bold" /> {copy.school.label}
        </div>
        <div className="school-lead reveal">
          <h2>{copy.school.title}</h2>
          <p>{copy.school.text}</p>
        </div>
        <div className="school-points reveal">
          {copy.school.advantages.map(([title, text], index) => {
            const Icon = schoolIcons[index];
            return (
              <div key={title} className="school-point">
                <div className="school-point-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={24} weight="regular" aria-hidden="true" />
                </div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TimeSection({ copy }) {
  const t = copy.time;
  return (
    <section className="time-section" id="tiempos">
      <div className="time-inner">
        <div className="section-label reveal">
          <Clock size={16} weight="bold" /> {t.label}
        </div>
        <div className="time-lead reveal">
          <h2>{t.title}</h2>
          <p>{t.text}</p>
        </div>
        <div className="time-comparisons">
          <article className="time-comparison reveal">
            <MotionClock label={t.student} ariaPrefix={t.clockAria} />
            <div className="time-data">
              <div className="time-row old"><span>{t.without}</span><strong>10–20 min</strong><small>{t.perLog}</small></div>
              <ArrowRight className="time-arrow-icon" size={28} aria-hidden="true" />
              <div className="time-row new"><span>{t.with}</span><strong>≈ 5 min</strong><small>{t.preloaded}</small></div>
            </div>
          </article>
          <article className="time-comparison reveal">
            <MotionClock label={t.school} ariaPrefix={t.clockAria} school />
            <div className="time-data">
              <div className="time-row old"><span>{t.manual}</span><strong>1–1.5 h</strong><small>{t.reception}</small></div>
              <ArrowRight className="time-arrow-icon" size={28} aria-hidden="true" />
              <div className="time-row new"><span>{t.automated}</span><strong>&lt; 10 min</strong><small>{t.scanning}</small></div>
            </div>
          </article>
        </div>
        <p className="time-disclaimer reveal">{t.disclaimer}</p>
      </div>
    </section>
  );
}

function TestimonialsSection({ copy }) {
  const t = copy.testimonials;
  return (
    <section className="testimonials" id="opiniones">
      <div className="testimonials-inner">
        <div className="section-label reveal">{t.label}</div>
        <div className="testimonials-lead reveal">
          <h2>{t.title}</h2>
          <p>{t.text}</p>
        </div>
        <div className="testimonial-list">
          <figure className="testimonial reveal">
            <blockquote>“{t.quote}”</blockquote>
            <figcaption>
              <Blobatar name={t.name} size={44} alt="" />
              <span>
                <strong>{t.name}</strong>
                <small>{t.role} · {t.institution}</small>
                {t.translated && <em>{t.translated}</em>}
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function SystemsSection({ copy, onSystemLink }) {
  return (
    <section className="editorial systems" id="sistemas">
      <div className="section-label reveal">
        <Code size={16} weight="bold" /> {copy.systems.label}
      </div>
      <div className="editorial-copy reveal">
        <h2>{copy.systems.title}</h2>
        <p>{copy.systems.text}</p>
      </div>
      <div className="systems-list">
        {copy.systems.items.map(([eyebrow, title, text, action], index) => {
          const meta = systemMeta[index];
          const Icon = meta.icon;
          return (
            <article className="system-row reveal" key={title}>
              <div className="system-number">
                <Icon size={26} weight="regular" />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="system-text">
                <p className="eyebrow">{eyebrow}</p>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              {meta.href ? (
                <a className="arrow-link" href={meta.href} onClick={(event) => onSystemLink(event, meta.href)} aria-label={action + " " + title}>
                  {action} <ArrowUpRight size={16} weight="bold" />
                </a>
              ) : (
                <span className="system-note">{action}</span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MatrixSection({ copy }) {
  const m = copy.matrix;
  return (
    <section className="matrix" id="matrix">
      <div className="matrix-inner">
        <div className="matrix-copy reveal">
          <p className="eyebrow light"><QrCode size={16} weight="bold" /> Data Matrix</p>
          <h2>{m.title}</h2>
          <p>{m.text}</p>
          <dl>
            <div><dt><Student size={16} /> {m.student}</dt><dd>{m.name}</dd></div>
            <div><dt><Buildings size={16} /> {m.affiliation}</dt><dd>{m.specialty}</dd></div>
            <div><dt><Clock size={16} /> {m.period}</dt><dd>{m.dates}</dd></div>
          </dl>
        </div>
        <figure className="matrix-example reveal">
          <img src="../Assets/Asset_cont_matrix.png" alt={m.alt} />
          <figcaption><Scan size={15} /> {m.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}

function WorkflowSection({ copy }) {
  return (
    <section className="editorial workflow">
      <div className="section-label reveal"><ArrowRight size={16} weight="bold" /> {copy.workflow.label}</div>
      <div className="editorial-copy reveal"><h2>{copy.workflow.title}</h2></div>
      <ol className="process reveal">
        {copy.workflow.items.map(([title, text], index) => {
          const Icon = processIcons[index];
          return (
            <li key={title}>
              <span className="process-icon"><Icon size={21} weight="regular" /></span>
              <div className="process-index">{String(index + 1).padStart(2, "0")}</div>
              <div><strong>{title}</strong><p>{text}</p></div>
              <ArrowRight className="process-arrow" size={20} aria-hidden="true" />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function InstitutionSection({ copy }) {
  const i = copy.institution;
  return (
    <section className="institution" id="instituciones">
      <div className="institution-inner">
        <div className="section-label reveal"><Users size={16} weight="bold" /> {i.label}</div>
        <div className="institution-lead reveal"><h2>{i.title}</h2><p>{i.text}</p></div>
        <div className="adoption-paths">
          <article className="adoption-path reveal">
            <div className="path-icon"><GitPullRequest size={29} weight="regular" /></div>
            <p className="path-label">{i.route1}</p>
            <h3>{i.route1Title}</h3>
            <p>{i.route1Text}</p>
            <div className="path-actions">
              <a className="button dark" href={CONTRIBUTE} target="_blank" rel="noopener noreferrer">
                <GitBranch size={18} weight="bold" /> {i.route1Action}
              </a>
            </div>
          </article>
          <article className="adoption-path reveal">
            <div className="path-icon"><Buildings size={29} weight="regular" /></div>
            <p className="path-label">{i.route2}</p>
            <h3>{i.route2Title}</h3>
            <p>{i.route2Text}</p>
            <div className="path-actions secondary-action">
              <a className="arrow-link" href="https://www.instagram.com/gio_canto_g/" target="_blank" rel="noopener noreferrer">
                {i.route2Action} <ArrowUpRight size={16} weight="bold" />
              </a>
            </div>
          </article>
        </div>
        <div className="institution-note reveal"><strong>{i.noteTitle}</strong><p>{i.noteText}</p></div>
      </div>
    </section>
  );
}

function PrinciplesSection({ copy }) {
  const p = copy.principles;
  return (
    <section className="editorial principles">
      <div className="section-label reveal"><ShieldCheck size={16} weight="bold" /> {p.label}</div>
      <div className="principles-grid">
        <article className="principle reveal">
          <IconCircle icon={Lock} />
          <h2>{p.privacy}</h2>
          <p>{p.privacyText}</p>
          <a className="arrow-link" href="../privacy/">{p.privacyAction} <ArrowUpRight size={16} weight="bold" /></a>
        </article>
        <article className="principle reveal">
          <IconCircle icon={Code} />
          <h2>{p.open}</h2>
          <p>{p.openText}</p>
          <a className="arrow-link" href={REPO} target="_blank" rel="noopener noreferrer">
            {p.openAction} <ArrowUpRight size={16} weight="bold" />
          </a>
        </article>
      </div>
    </section>
  );
}

function GithubSection({ copy }) {
  const g = copy.github;
  return (
    <section className="github-callout">
      <div className="github-inner reveal">
        <div>
          <p className="eyebrow light"><GithubLogo size={17} weight="bold" /> {g.label}</p>
          <h2>{g.title}</h2>
          <p>{g.text}</p>
        </div>
        <div className="github-actions">
          <a className="button white" href={CONTRIBUTE} target="_blank" rel="noopener noreferrer">
            <GitPullRequest size={18} weight="bold" /> {g.collaborate}
          </a>
          <a className="button outline-light star-button" href={REPO} target="_blank" rel="noopener noreferrer">
            <Star size={18} weight="fill" /> {g.star}
          </a>
        </div>
      </div>
    </section>
  );
}

function Closing({ copy, onSystemLink }) {
  return (
    <section className="closing">
      <div className="closing-inner reveal">
        <p className="eyebrow">Bitácora Dual 2026</p>
        <h2>{copy.closing.title}</h2>
        <div className="closing-actions">
          <a className="button primary" href={CONTRIBUTE} target="_blank" rel="noopener noreferrer">
            <GitPullRequest size={18} weight="bold" /> {copy.closing.collaborate}
          </a>
          <a className="button secondary" href="../" onClick={(event) => onSystemLink(event, "../")}>
            <Plus size={18} weight="bold" /> {copy.closing.create}
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer({ copy }) {
  return (
    <footer>
      <div><strong>Bitácora Dual 2026</strong><span>{copy.footer.beta}</span></div>
      <nav aria-label={copy.footer.links}>
        <a href="../faq/">FAQ</a>
        <a href="../privacy/">{copy.footer.privacy}</a>
        <a href="../accessibility/">{copy.footer.accessibility}</a>
        <a href={REPO} target="_blank" rel="noopener noreferrer"><GithubLogo size={14} /> GitHub</a>
      </nav>
    </footer>
  );
}

function LanguageNotice({ copy, href, onClose }) {
  if (!href) return null;
  return (
    <div className="language-warning" role="dialog" aria-modal="true" aria-labelledby="language-warning-title">
      <div className="language-warning-card">
        <div className="language-warning-icon" aria-hidden="true">ES</div>
        <h2 id="language-warning-title">{copy.warning.title}</h2>
        <p>{copy.warning.text}</p>
        <div className="language-warning-actions">
          <button className="button secondary" type="button" onClick={onClose}>{copy.warning.stay}</button>
          <a className="button primary" href={href}>{copy.warning.continue}</a>
        </div>
      </div>
    </div>
  );
}

function Presentation() {
  const [language, setLanguage] = useState(initialLanguage);
  const [pendingSystem, setPendingSystem] = useState("");
  const reducedMotion = useReducedMotion();
  const copy = COPY[language];
  useReveal();
  useScrollMotion(reducedMotion);

  const changeLanguage = (next) => {
    if (!LANGS.includes(next)) return;
    setLanguage(next);
    const url = new URL(window.location.href);
    if (next === "es") url.searchParams.delete("lang");
    else url.searchParams.set("lang", next);
    window.history.replaceState({}, "", url);
  };

  const openSystem = (event, href) => {
    if (language === "es") return;
    event.preventDefault();
    setPendingSystem(href);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === "en"
        ? "Bitácora Dual 2026 · Project presentation"
        : language === "de"
          ? "Bitácora Dual 2026 · Projektvorstellung"
          : "Bitácora Dual 2026 · Presentación";
  }, [language]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register("../sw.js", { updateViaCache: "none" })
      .then(async (registration) => {
        await registration.update().catch(() => {});

        const activateWaiting = () => {
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        };

        activateWaiting();

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              activateWaiting();
            }
          });
        });
      })
      .catch(() => {
        // La landing continúa funcionando aunque el service worker falle.
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return (
    <>
      <Header language={language} copy={copy} onLanguage={changeLanguage} />
      <main>
        <Hero copy={copy} onSystemLink={openSystem} />
        <StudentSection copy={copy} />
        <SchoolSection copy={copy} />
        <TimeSection copy={copy} />
        <TestimonialsSection copy={copy} />
        <SystemsSection copy={copy} onSystemLink={openSystem} />
        <MatrixSection copy={copy} />
        <WorkflowSection copy={copy} />
        <InstitutionSection copy={copy} />
        <PrinciplesSection copy={copy} />
        <GithubSection copy={copy} />
        <Closing copy={copy} onSystemLink={openSystem} />
      </main>
      <Footer copy={copy} />
      <LanguageNotice
        copy={copy}
        href={pendingSystem}
        onClose={() => setPendingSystem("")}
      />
    </>
  );
}

const root = document.getElementById("presentation-root");
if (root) createRoot(root).render(<Presentation />);
