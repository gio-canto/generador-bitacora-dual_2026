import { notify } from "../services/rare-notification.jsx";
import { CREDIT_NAMES } from "../domain/presentation.js";
export function startGuide() {
  (() => {
    "use strict";
    let step = 0,
      highestStep = 0,
      tourIndex = 0;
    const STEP_KEY = "bitacora_dual_wizard_step_v1";
    const panels = [...document.querySelectorAll("[data-step]")],
      links = [...document.querySelectorAll("[data-step-link]")],
      req = [
        ["school", "specialty", "semester", "group"],
        ["student", "company"],
        ["weekDate"],
        [],
        [],
      ];
    function announce(msg) {
      notify("warning", "Revisa este campo", msg);
    }
    function valid(i) {
      for (const id of req[i]) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
          announce("Completa los campos necesarios para continuar");
          el?.focus();
          return false;
        }
      }
      if (
        i === 0 &&
        !["A", "B", "C", "D"].includes(document.getElementById("group")?.value)
      ) {
        window.bitacoraAlert?.(
          "Grupo no válido",
          "El grupo solo puede ser A, B, C o D.",
        );
        return false;
      }
      if (i === 2) {
        const check = window.bitacoraValidateWeek
          ? window.bitacoraValidateWeek()
          : { ok: true };
        if (!check.ok) {
          window.bitacoraAlert?.(check.title, check.message);
          return false;
        }
      }
      return true;
    }
    async function advance() {
      if (!valid(step)) return;
      if (
        step === 1 &&
        window.bitacoraConfirmNames &&
        !(await window.bitacoraConfirmNames("student"))
      )
        return;
      if (
        step === 3 &&
        window.bitacoraConfirmNames &&
        !(await window.bitacoraConfirmNames("representatives"))
      )
        return;
      showStep(step + 1, true);
    }
    function showStep(i, force = false) {
      if (i > step && !force && !valid(step)) return;
      step = Math.max(0, Math.min(panels.length - 1, i));
      highestStep = Math.max(highestStep, step);
      try {
        localStorage.setItem(STEP_KEY, String(step));
      } catch {}
      panels.forEach((p, j) => p.classList.toggle("active", j === step));
      links.forEach((l, j) => l.classList.toggle("active", j === step));
      const pct = (step + 1) * 20;
      document.getElementById("wizardBar").style.width = pct + "%";
      document.getElementById("wizardPct").textContent = pct + "%";
      document
        .querySelector(".workspace")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    }
    document
      .querySelectorAll(".wizard-next")
      .forEach((b) => (b.onclick = advance));
    document
      .querySelectorAll(".wizard-prev")
      .forEach((b) => (b.onclick = () => showStep(step - 1, true)));
    links.forEach(
      (l, i) =>
        (l.onclick = () =>
          i <= highestStep
            ? showStep(i, true)
            : announce("Completa primero la etapa actual")),
    );
    document.getElementById("newBtn").addEventListener("click", () => {
      highestStep = 0;
      showStep(0, true);
    });
    window.addEventListener("bitacora-edit-name", () => {
      showStep(1, true);
      document.getElementById("student").focus();
      document.getElementById("student").select();
    });
    const welcome = document.getElementById("welcomeDialog"),
      layer = document.getElementById("tourLayer"),
      focus = document.getElementById("tourFocus"),
      card = document.getElementById("tourCard"),
      help = document.getElementById("tourHelp"),
      KEY = "bitacora_dual_onboarding_v3",
      tour = [
        {
          section: 0,
          selector: '.step-panel[data-step="0"] .fields',
          title: "1. Datos escolares",
          text: "Comienza con el plantel, la especialidad, el semestre y el grupo.",
        },
        {
          section: 1,
          selector: '.step-panel[data-step="1"] .fields',
          title: "2. Alumno y empresa",
          text: "Escribe tu nombre completo y selecciona la empresa receptora.",
        },
        {
          section: 2,
          selector: '.step-panel[data-step="2"] .fields.three',
          title: "3. Genera la semana",
          text: "Elige el martes de inicio, revisa la entrada y salida y pulsa Generar martes a viernes.",
        },
        {
          section: 2,
          selector: "#days",
          title: "Registra cada jornada",
          text: "Describe tus actividades y usa Con labores, Sin labores, Día inhábil o Falta según corresponda.",
        },
        {
          section: 3,
          selector: '.step-panel[data-step="3"] .section',
          title: "4. Responsables",
          text: "Revisa quién elabora, quién da el visto bueno y quién autoriza. Si dudas sobre cargos o firmas, el FAQ tiene ejemplos.",
        },
        {
          section: 4,
          selector: ".preview-shell",
          title: "5. Revisa el documento",
          text: "Comprueba que el PDF cabe en una página antes de guardarlo.",
        },
        {
          section: 4,
          selector: '.step-panel[data-step="4"] .step-actions',
          title: "Guarda, descarga y resuelve tus dudas",
          text: "Guarda el registro y genera el PDF. En teléfono se usará el menú nativo de compartir o guardar cuando sea posible. Si todavía tienes dudas, abre las preguntas frecuentes.",
        },
      ];
    function position() {
      if (layer.hidden) return;
      const target = document.querySelector(tour[tourIndex].selector);
      if (!target) return;
      const r = target.getBoundingClientRect(),
        g = 8,
        left = Math.max(g, r.left - 6),
        top = Math.max(g, r.top - 6);
      focus.style.transform = `translate(${left}px,${top}px)`;
      focus.style.width = Math.min(innerWidth - left - g, r.width + 12) + "px";
      focus.style.height =
        Math.min(innerHeight - top - g, r.height + 12) + "px";
      const cr = card.getBoundingClientRect(),
        below = r.bottom + 16,
        ct =
          below + cr.height <= innerHeight - 12
            ? below
            : Math.max(12, r.top - cr.height - 16),
        cl = Math.max(12, Math.min(innerWidth - cr.width - 12, r.left));
      card.style.top = ct + "px";
      card.style.left = cl + "px";
    }
    function renderTour() {
      const x = tour[tourIndex];
      if (step !== x.section) showStep(x.section, true);
      document.getElementById("tourProgress").textContent =
        `Paso ${tourIndex + 1} de ${tour.length}`;
      document.getElementById("tourTitle").textContent = x.title;
      document.getElementById("tourText").textContent = x.text;
      document.getElementById("tourBack").disabled = tourIndex === 0;
      document.getElementById("tourNext").textContent =
        tourIndex === tour.length - 1 ? "Terminar" : "Siguiente";
      help.hidden = tourIndex !== tour.length - 1;
      document
        .querySelector(x.selector)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      requestAnimationFrame(() => requestAnimationFrame(position));
      setTimeout(position, 250);
    }
    function startTour() {
      if (welcome.open) welcome.close();
      tourIndex = 0;
      layer.hidden = false;
      document.querySelector(".shell").inert = true;
      document.body.style.overflow = "hidden";
      renderTour();
    }
    function endTour(v = "completed") {
      layer.hidden = true;
      document.querySelector(".shell").inert = false;
      document.body.style.overflow = "";
      try {
        localStorage.setItem(KEY, v);
      } catch {}
      highestStep = 0;
      showStep(0, true);
      document.getElementById("tourBtn").focus();
    }
    document.getElementById("firstTimeYes").onclick = startTour;
    document.getElementById("firstTimeNo").onclick = () => {
      try {
        localStorage.setItem(KEY, "skipped");
      } catch {}
      welcome.close();
    };
    welcome.addEventListener("cancel", (e) => e.preventDefault());
    document.getElementById("tourBtn").onclick = startTour;
    document.getElementById("tourSkip").onclick = () => endTour("skipped");
    document.getElementById("tourBack").onclick = () => {
      if (tourIndex > 0) {
        tourIndex--;
        renderTour();
      }
    };
    document.getElementById("tourNext").onclick = () => {
      if (tourIndex === tour.length - 1) {
        endTour();
        return;
      }
      tourIndex++;
      renderTour();
    };
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, { passive: true });
    let state = null;
    try {
      state = localStorage.getItem(KEY);
    } catch {}
    if (!state) requestAnimationFrame(() => welcome.showModal());
    else {
      try {
        const savedStep = Math.max(
          0,
          Math.min(4, Number(localStorage.getItem(STEP_KEY) || 0)),
        );
        if (localStorage.getItem("bitacora_dual_draft_v1")) {
          highestStep = savedStep;
          requestAnimationFrame(() => showStep(savedStep, true));
        }
      } catch {}
    }
    const credits = document.getElementById("creditsDialog");
    const EASTER_EGG_NAMES = new Set(CREDIT_NAMES);
    const normalizeEasterEggName = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    document.getElementById("student").addEventListener("input", (e) => {
      if (
        EASTER_EGG_NAMES.has(normalizeEasterEggName(e.target.value)) &&
        !credits.open
      )
        credits.showModal();
    });
    document.getElementById("creditsClose").onclick = () => credits.close();
  })();
}
