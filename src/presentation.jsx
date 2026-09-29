import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  Buildings,
  CheckCircle,
  Clock,
  Code,
  Database,
  Desktop,
  DeviceMobile,
  DeviceTablet,
  FilePdf,
  Folder,
  GitBranch,
  GithubLogo,
  GitPullRequest,
  Lock,
  Plus,
  QrCode,
  Scan,
  ShieldCheck,
  Star,
  Student,
  Users,
} from "@phosphor-icons/react";
import "./presentation.css";

document.documentElement.classList.add("js", "presentation-react");

const REPO = "https://github.com/gio-canto/generador-bitacora-dual_2026";
const CONTRIBUTE = REPO + "/blob/main/CONTRIBUTING.md";

const studentAdvantages = [
  {
    icon: DeviceMobile,
    title: "En cualquier dispositivo.",
    text: "Crea tu bitácora desde teléfono, PC o iPad, sin depender de un Excel raro o de un Word que cambia según el equipo.",
  },
  {
    icon: Folder,
    title: "Tu historial se queda contigo.",
    text: "Guarda bitácoras y respaldos en tu propio dispositivo para volver a ellas cuando lo necesites.",
  },
  {
    icon: CheckCircle,
    title: "Más intuitivo, menos errores.",
    text: "El sistema guía el llenado y mantiene el formato para reducir equivocaciones de captura o estructura.",
  },
  {
    icon: Database,
    title: "Sin repetir lo mismo cada semana.",
    text: "Plantel, especialidad, empresa, horarios y otros datos pueden quedar precargados. Tú escribes lo que realizaste y continúas.",
  },
];

const schoolAdvantages = [
  {
    icon: Student,
    title: "Facilita el proceso al alumno",
    text: "Un flujo claro reduce la fricción de elaborar la evidencia semanal.",
  },
  {
    icon: FilePdf,
    title: "Estandariza las bitácoras",
    text: "Todos parten de la misma estructura y del mismo formato institucional.",
  },
  {
    icon: ShieldCheck,
    title: "Evita cambios accidentales",
    text: "El alumno no necesita mover celdas, márgenes o elementos del documento para poder llenarlo.",
  },
  {
    icon: Scan,
    title: "Controla entregas con rapidez",
    text: "Vinculación puede registrar, filtrar y reportar entregas sin volver a capturar cada dato.",
  },
];

const systems = [
  {
    icon: FilePdf,
    eyebrow: "Alumnos",
    title: "Generador de Bitácora Dual",
    text: "Captura la semana, reutiliza información frecuente, conserva historial, muestra una vista previa y genera un PDF listo para revisión y firma.",
    href: "../",
    action: "Abrir",
  },
  {
    icon: Scan,
    eyebrow: "Vinculación",
    title: "Registro de entregas",
    text: "Administra alumnos y semanas, escanea Data Matrix, distingue entregas a tiempo o a destiempo y genera listados y reportes globales.",
    href: "../registro-entrega/",
    action: "Abrir",
  },
  {
    icon: Buildings,
    eyebrow: "Constancias",
    title: "Sistema de gestión y emisión",
    text: "Un sistema complementario para organizar la gestión y emisión de constancias de alumnos de modalidad dual y reducir otro trámite repetitivo.",
    note: "Complementario",
  },
];

const process = [
  {
    icon: FilePdf,
    title: "El alumno crea",
    text: "Completa sus actividades y descarga la bitácora.",
  },
  {
    icon: Scan,
    title: "La escuela recibe",
    text: "Escanea o registra la entrega manualmente.",
  },
  {
    icon: Database,
    title: "El sistema organiza",
    text: "Relaciona alumno, semana y estado de entrega.",
  },
  {
    icon: Buildings,
    title: "Vinculación reporta",
    text: "Consulta por semana o genera una matriz global.",
  },
];

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

function MotionClock({ label, school = false }) {
  return (
    <div className="time-clock-wrap">
      <div
        className={school ? "moving-clock school-clock" : "moving-clock"}
        aria-label={"Reloj animado ilustrativo para " + label.toLowerCase()}
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

function Header() {
  return (
    <header className="site-nav">
      <div className="scroll-progress" aria-hidden="true" />
      <a className="brand" href="./" aria-label="Bitácora Dual 2026">
        Bitácora Dual
      </a>
      <nav className="desktop-nav" aria-label="Navegación">
        <a href="#alumnos">Alumnos</a>
        <a href="#escuelas">Escuelas</a>
        <a href="#tiempos">Tiempos</a>
        <a href="#sistemas">Sistemas</a>
        <a href="#matrix">Data Matrix</a>
        <a href="#instituciones">Instituciones</a>
      </nav>
      <a
        className="nav-cta"
        href={CONTRIBUTE}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitPullRequest size={15} weight="bold" />
        Colaborar
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img
        className="hero-image"
        src="../Assets/asset_landing.png"
        alt="Vista de Bitácora Dual 2026"
      />
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-copy reveal">
        <p className="eyebrow light">Bitácora Dual 2026</p>
        <h1 id="hero-title">Nunca fue tan fácil hacer una bitácora.</h1>
        <p>
          Hazla desde tu teléfono, iPad o computadora. La escuela la recibe
          con un formato consistente y puede llevar un control más rápido de
          las entregas.
        </p>
        <div className="hero-actions">
          <a
            className="button white"
            href={CONTRIBUTE}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitPullRequest size={18} weight="bold" />
            Colaborar
          </a>
          <a className="button glass" href="../">
            <FilePdf size={18} weight="bold" />
            Probar el generador
          </a>
        </div>
        <div className="hero-device-row" aria-label="Disponible en distintos dispositivos">
          <span><DeviceMobile size={18} /> Teléfono</span>
          <span><DeviceTablet size={18} /> iPad</span>
          <span><Desktop size={18} /> Computadora</span>
        </div>
      </div>
    </section>
  );
}

function StudentSection() {
  return (
    <section className="editorial intro" id="alumnos">
      <div className="section-label reveal">
        <Student size={16} weight="bold" /> Para el alumno
      </div>
      <div className="editorial-copy reveal">
        <h2>Escribe lo que hiciste. Lo demás ya debería estar listo.</h2>
        <p>
          La bitácora deja de ser un archivo que tienes que reconstruir cada
          semana. Tus datos frecuentes pueden quedar preparados y tú te
          concentras en registrar las actividades que realmente realizaste.
        </p>
      </div>

      <div className="advantage-list reveal">
        {studentAdvantages.map(({ icon, title, text }) => (
          <article key={title}>
            <div className="advantage-title">
              <IconCircle icon={icon} />
              <strong>{title}</strong>
            </div>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SchoolSection() {
  return (
    <section className="school-section" id="escuelas">
      <div className="school-inner">
        <div className="section-label light reveal">
          <Buildings size={16} weight="bold" /> Para la escuela
        </div>
        <div className="school-lead reveal">
          <h2>Un formato igual para todos. Un seguimiento más rápido para Vinculación.</h2>
          <p>
            Facilitarle la bitácora al alumno también ayuda al plantel: menos
            formatos alterados, menos archivos distintos y una forma más clara
            de saber quién entregó.
          </p>
        </div>

        <div className="school-points reveal">
          {schoolAdvantages.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="school-point">
              <div className="school-point-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon size={24} weight="regular" aria-hidden="true" />
              </div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimeSection() {
  return (
    <section className="time-section" id="tiempos">
      <div className="time-inner">
        <div className="section-label reveal">
          <Clock size={16} weight="bold" /> Tiempo aproximado
        </div>
        <div className="time-lead reveal">
          <h2>Menos tiempo llenando y registrando. Más tiempo para lo importante.</h2>
          <p>
            Comparación orientativa basada en el flujo esperado del proyecto.
            No es un benchmark formal: los tiempos reales cambian según la
            persona, el plantel y la cantidad de alumnos.
          </p>
        </div>

        <div className="time-comparisons">
          <article className="time-comparison reveal">
            <MotionClock label="Alumno" />
            <div className="time-data">
              <div className="time-row old">
                <span>Sin el sistema</span>
                <strong>10–20 min</strong>
                <small>aprox. por bitácora</small>
              </div>
              <ArrowRight className="time-arrow-icon" size={28} aria-hidden="true" />
              <div className="time-row new">
                <span>Con el sistema</span>
                <strong>≈ 5 min</strong>
                <small>cuando sus datos ya están precargados</small>
              </div>
            </div>
          </article>

          <article className="time-comparison reveal">
            <MotionClock label="Escuela" school />
            <div className="time-data">
              <div className="time-row old">
                <span>Registro manual</span>
                <strong>1–1.5 h</strong>
                <small>aprox. para una jornada de recepción</small>
              </div>
              <ArrowRight className="time-arrow-icon" size={28} aria-hidden="true" />
              <div className="time-row new">
                <span>Registro automatizado</span>
                <strong>&lt; 10 min</strong>
                <small>aprox. con escaneo y base preparada</small>
              </div>
            </div>
          </article>
        </div>

        <p className="time-disclaimer reveal">
          Tiempos aproximados de uso previstos para explicar la diferencia de
          flujo; no representan una medición científica ni garantizan un tiempo
          específico.
        </p>
      </div>
    </section>
  );
}

function SystemsSection() {
  return (
    <section className="editorial systems" id="sistemas">
      <div className="section-label reveal">
        <Code size={16} weight="bold" /> El proyecto
      </div>
      <div className="editorial-copy reveal">
        <h2>Tres herramientas para distintas partes del proceso.</h2>
        <p>
          El alumno no necesita una pantalla administrativa y Vinculación no
          necesita llenar la bitácora. Cada sistema hace una sola cosa y la
          hace de forma clara.
        </p>
      </div>

      <div className="systems-list">
        {systems.map(({ icon: Icon, eyebrow, title, text, href, action, note }, index) => (
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
            {href ? (
              <a className="arrow-link" href={href} aria-label={action + " " + title}>
                {action} <ArrowUpRight size={16} weight="bold" />
              </a>
            ) : (
              <span className="system-note">{note}</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function MatrixSection() {
  return (
    <section className="matrix" id="matrix">
      <div className="matrix-inner">
        <div className="matrix-copy reveal">
          <p className="eyebrow light">
            <QrCode size={16} weight="bold" /> Data Matrix
          </p>
          <h2>La bitácora también puede identificarse sola.</h2>
          <p>
            El Data Matrix conecta el documento con el registro de entrega.
            Incluye la identidad necesaria para ubicar al alumno y el periodo
            correcto, sin guardar las actividades ni las firmas.
          </p>
          <dl>
            <div>
              <dt><Student size={16} /> Alumno</dt>
              <dd>Nombre</dd>
            </div>
            <div>
              <dt><Buildings size={16} /> Adscripción</dt>
              <dd>Especialidad y empresa</dd>
            </div>
            <div>
              <dt><Clock size={16} /> Periodo</dt>
              <dd>Fecha inicial y final</dd>
            </div>
          </dl>
        </div>

        <figure className="matrix-example reveal">
          <img
            src="../Assets/Asset_cont_matrix.png"
            alt="Ejemplo de una bitácora con Data Matrix"
          />
          <figcaption>
            <Scan size={15} /> Ejemplo de una bitácora preparada para el
            registro de entrega.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="editorial workflow">
      <div className="section-label reveal">
        <ArrowRight size={16} weight="bold" /> Un flujo simple
      </div>
      <div className="editorial-copy reveal">
        <h2>Crear. Entregar. Registrar. Reportar.</h2>
      </div>
      <ol className="process reveal">
        {process.map(({ icon: Icon, title, text }, index) => (
          <li key={title}>
            <span className="process-icon">
              <Icon size={21} weight="regular" />
            </span>
            <div className="process-index">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
            <ArrowRight className="process-arrow" size={20} aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  );
}

function InstitutionSection() {
  return (
    <section className="institution" id="instituciones">
      <div className="institution-inner">
        <div className="section-label reveal">
          <Users size={16} weight="bold" /> Para instituciones
        </div>
        <div className="institution-lead reveal">
          <h2>¿Quieres que tu institución pueda usar este sistema?</h2>
          <p>
            La idea es que el proyecto pueda crecer de forma autónoma. Un
            alumno, docente o plantel puede aportar directamente: agregar su
            escuela, empresa, responsable o una mejora completa sin tener que
            esperar a que alguien lo haga por ellos.
          </p>
        </div>

        <div className="adoption-paths">
          <article className="adoption-path reveal">
            <div className="path-icon">
              <GitPullRequest size={29} weight="regular" />
            </div>
            <p className="path-label">Ruta 1 · Colaborar</p>
            <h3>Tu escuela puede agregarse al proyecto.</h3>
            <p>
              Estudiantes, docentes o personal de Vinculación pueden editar los
              catálogos, agregar una escuela o empresa, corregir datos, crear
              una rama y enviar una <strong>pull request</strong>. Las
              aportaciones útiles son bienvenidas.
            </p>
            <div className="path-actions">
              <a
                className="button dark"
                href={CONTRIBUTE}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitBranch size={18} weight="bold" />
                Colaborar en GitHub
              </a>
            </div>
          </article>

          <article className="adoption-path reveal">
            <div className="path-icon">
              <Buildings size={29} weight="regular" />
            </div>
            <p className="path-label">Ruta 2 · Implementación acompañada</p>
            <h3>Si necesitan ayuda, también pueden pedirla.</h3>
            <p>
              Si el plantel no quiere tocar código, se puede revisar su formato,
              responsables, empresas, calendario, reglas de entrega y reportes
              para plantear una integración compatible con su procedimiento
              actual.
            </p>
            <div className="path-actions secondary-action">
              <a
                className="arrow-link"
                href="https://www.instagram.com/gio_canto_g/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pedir apoyo al creador <ArrowUpRight size={16} weight="bold" />
              </a>
            </div>
          </article>
        </div>

        <div className="institution-note reveal">
          <strong>La meta no es cambiar el procedimiento porque sí.</strong>
          <p>
            Es quitar captura repetida y conservar los controles que la escuela
            realmente necesita.
          </p>
        </div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  return (
    <section className="editorial principles">
      <div className="section-label reveal">
        <ShieldCheck size={16} weight="bold" /> Cómo está construido
      </div>
      <div className="principles-grid">
        <article className="principle reveal">
          <IconCircle icon={Lock} />
          <h2>Privacidad.</h2>
          <p>
            El generador no necesita una cuenta para crear bitácoras. Los datos
            de trabajo, historial y registro se mantienen en el navegador o
            dispositivo y las exportaciones quedan bajo control de quien las
            descarga.
          </p>
          <a className="arrow-link" href="../privacy/">
            Leer aviso de privacidad <ArrowUpRight size={16} weight="bold" />
          </a>
        </article>

        <article className="principle reveal">
          <IconCircle icon={Code} />
          <h2>Open source.</h2>
          <p>
            El código está disponible públicamente bajo la licencia del
            proyecto. Cualquier persona puede estudiarlo, proponer mejoras y
            colaborar mediante issues o pull requests. Un estudiante puede
            incluso proponer su propio plantel o actualizar un catálogo sin
            depender de una administración central.
          </p>
          <a
            className="arrow-link"
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            Colaborar en GitHub <ArrowUpRight size={16} weight="bold" />
          </a>
        </article>
      </div>
    </section>
  );
}

function GithubSection() {
  return (
    <section className="github-callout">
      <div className="github-inner reveal">
        <div>
          <p className="eyebrow light">
            <GithubLogo size={17} weight="bold" /> Proyecto abierto
          </p>
          <h2>Úsalo. Mejora lo que haga falta. Compártelo.</h2>
          <p>
            La colaboración es la acción principal del proyecto. Si encuentras
            algo que pueda mejorar, propón el cambio. Y si te sirve tal como
            está, una estrella en GitHub ayuda a que más personas lo
            encuentren.
          </p>
        </div>
        <div className="github-actions">
          <a
            className="button white"
            href={CONTRIBUTE}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitPullRequest size={18} weight="bold" />
            Colaborar
          </a>
          <a
            className="button outline-light star-button"
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Star size={18} weight="fill" /> Dar estrella
          </a>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="closing">
      <div className="closing-inner reveal">
        <p className="eyebrow">Bitácora Dual 2026</p>
        <h2>Menos tiempo acomodando formatos. Más tiempo documentando lo que hiciste.</h2>
        <div className="closing-actions">
          <a
            className="button primary"
            href={CONTRIBUTE}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitPullRequest size={18} weight="bold" />
            Colaborar con el proyecto
          </a>
          <a className="button secondary" href="../">
            <Plus size={18} weight="bold" />
            Crear una bitácora
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div>
        <strong>Bitácora Dual 2026</strong>
        <span>Proyecto open source en beta.</span>
      </div>
      <nav aria-label="Enlaces del pie">
        <a href="../faq/">FAQ</a>
        <a href="../privacy/">Privacidad</a>
        <a href="../accessibility/">Accesibilidad</a>
        <a href={REPO} target="_blank" rel="noopener noreferrer">
          <GithubLogo size={14} /> GitHub
        </a>
      </nav>
    </footer>
  );
}

function Presentation() {
  const reducedMotion = useReducedMotion();
  useReveal();
  useScrollMotion(reducedMotion);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("../sw.js", { updateViaCache: "none" })
      .catch(() => {
        // La landing continúa funcionando aunque el service worker falle.
      });
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <StudentSection />
        <SchoolSection />
        <TimeSection />
        <SystemsSection />
        <MatrixSection />
        <WorkflowSection />
        <InstitutionSection />
        <PrinciplesSection />
        <GithubSection />
        <Closing />
      </main>
      <Footer />
    </>
  );
}

const root = document.getElementById("presentation-root");
if (root) createRoot(root).render(<Presentation />);
