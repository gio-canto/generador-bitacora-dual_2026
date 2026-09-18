import { validDate, validTime, weekDates } from "../domain/records.js";
import {
  weekSetup,
  signatureName,
  schoolSignatureRole,
} from "../domain/presentation.js";
import {
  readProfile,
  rememberName,
  initializeProfile,
} from "../services/profile.js";
import companies from "../data/companies.json";
import schools from "../data/schools.json";
import { parseBackup } from "../services/storage.js";
import { notify, notifyImported } from "../services/rare-notification.jsx";
export function startEditor() {
  "use strict";
  (() => {
    const $ = (s) => document.querySelector(s),
      deepCopy = (v) => JSON.parse(JSON.stringify(v)),
      escapeHtml = (v) =>
        String(v ?? "").replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#039;",
            })[c],
        );
    const COUNCIL =
      "Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)";
    const NATURAL_COMPANY = "El Buen Tzin S.A. de C.V. (100% Natural)";
    const LEGACY_COMPANY_ALIASES = {
      "100% Natural Aeropuerto S.A. de C.V. (100% Natural)": NATURAL_COMPANY,
    };
    const INHABIL_JUSTIFICATION =
      "Falta de acuerdo con el calendario escolar vigente";
    const STATUS_NOTICES = {
      falta:
        "No olvides avisar a la directora de Vinculación sobre tu falta y a tu jefe inmediato.",
      sin_labores:
        "No olvides avisar a la directora de Vinculación que en tu empresa no laborarán.",
      inhabil:
        "Esta opción es exclusiva para los días contemplados como inhábiles o feriados en los calendarios oficiales vigentes de la DGETI, CBTis, SEP y el calendario interno propio aplicable a Educación Dual.",
    };
    function showStatusNotice(status) {
      const message = STATUS_NOTICES[status];
      if (!message) return;
      const dialog = $("#statusDialog"),
        title = $("#statusTitle"),
        body = $("#statusMessage"),
        mark = $("#statusMark"),
        help = $("#statusHelp");
      const meta =
        status === "falta"
          ? { title: "Antes de registrar la falta", mark: "!" }
          : status === "sin_labores"
            ? { title: "Antes de marcar Sin labores", mark: "i" }
            : { title: "Antes de marcar Día inhábil", mark: "★" };
      if (!dialog) {
        alert(meta.title + "\n\n" + message);
        return;
      }
      dialog.dataset.status = status;
      title.textContent = meta.title;
      body.textContent = message;
      mark.textContent = meta.mark;
      if (help) help.hidden = status !== "inhabil";
      if (typeof dialog.showModal === "function") dialog.showModal();
      else alert(meta.title + "\n\n" + message);
    }

    const COMPANY_PRESETS = Object.fromEntries(
      companies.map((c) => [c.name, c]),
    );
    function companyDefaults(company) {
      company = LEGACY_COMPANY_ALIASES[company] || company;
      return (
        COMPANY_PRESETS[company] || {
          start: "10:00",
          end: "14:00",
          area: "Área de Informática",
        }
      );
    }
    function applyCompanyDefaults() {
      const preset = companyDefaults($("#company").value);
      $("#defaultStart").value = preset.start;
      $("#defaultEnd").value = preset.end;
    }

    const DEFAULTS = {
      student: "",
      company: "",
      school:
        "CENTRO DE BACHILLERATO TECNOLÓGICO INDUSTRIAL Y DE SERVICIOS NO. 134",
      specialty: "Programación",
      semester: "4",
      group: "B",
      authorities: {
        elaboroName: "",
        elaboroRole: "Alumno de Educación Dual\nCBTis No. 134",
        voboName: "M. en A. Vepsania Marino Martínez",
        voboRole:
          "Jefa del Departamento de Vinculación con el Sector Productivo\nCBTis No. 134",
        autorizoName: "",
        autorizoRole: "",
      },
      instructor: {
        enabled: false,
        preset: "__custom__",
        name: "",
        roleMain: "",
        note: "Instructor Formador",
      },
    };
    Object.assign(DEFAULTS, {
      school: schools[0].name,
      specialty: schools[0].specialties[0],
      semester: schools[0].semesters[0],
      group: schools[0].groups.includes("B") ? "B" : schools[0].groups[0],
    });
    Object.assign(DEFAULTS.authorities, {
      elaboroRole: "Alumno de Educación Dual\n" + signatureName(schools[0]),
      voboName: schools[0].voboName,
      voboRole: schools[0].voboRole,
    });
    const COUNCIL_AUTHORITY = companies.find((c) => c.name === COUNCIL)
      ?.representatives[0] || { name: "", role: "" };
    const instructors = () =>
      companies.find((c) => c.name === $("#company").value)?.instructors || [];
    const SEED = {
      id: "week1-2026-09-01",
      title: "Semana 1 · 1 al 4 de septiembre de 2026",
      student: "Gio Antonio Canto Gómez",
      company: COUNCIL,
      specialty: "Programación",
      semester: "4",
      group: "B",
      markdown: true,
      authorities: {
        elaboroName: "Gio Antonio Canto Gómez",
        elaboroRole: "Alumno de Educación Dual\nCBTis No. 134",
        voboName: "M. en A. Vepsania Marino Martínez",
        voboRole:
          "Jefa del Departamento de Vinculación con el Sector Productivo\nCBTis No. 134",
        autorizoName: COUNCIL_AUTHORITY.name,
        autorizoRole: COUNCIL_AUTHORITY.role,
      },
      instructor: {
        enabled: true,
        preset: "Ing. Emmanuel Sandoval Mejía",
        name: "Ing. Emmanuel Sandoval Mejía",
        roleMain: "Encargado de Informática",
        note: "Instructor Formador",
      },
      entries: [
        {
          date: "2026-09-01",
          start: "09:00",
          end: "14:00",
          area: "Sala de conferencias / Área de Informática",
          activity:
            "- Inicio de la modalidad dual y reunión de bienvenida con personal del Consejo.\n- Aplicación de cuestionario, integración de equipos y asignación al área de Informática.\n- Asignación del proyecto de software web para creación y validación de constancias.",
          status: "laboral",
        },
        {
          date: "2026-09-02",
          start: "09:00",
          end: "14:00",
          area: "Área de Informática",
          activity:
            "- Diseño del prototipo visual del frontend del **Sistema Automatizado de Gestión de Constancias (SAGC)**.\n- Elaboración de un diagrama de uso básico y definición del objetivo general.\n- Inicio del estudio de React, base de datos y procesos automatizados.",
          status: "laboral",
        },
        {
          date: "2026-09-03",
          start: "10:00",
          end: "14:00",
          area: "Área de Informática",
          activity:
            "- Adaptación del diseño del inicio de sesión mediante CSS e inicio del diseño de la base de datos.\n- Definición preliminar de Usuarios, Eventos, Plantillas, Constancias y Contador de Folios.",
          status: "laboral",
        },
        {
          date: "2026-09-04",
          start: "10:00",
          end: "14:00",
          area: "Área de Informática",
          activity:
            "- Continuación del diseño preliminar de la base de datos y del sistema de inicio de sesión.\n- Instalación y configuración de GitHub para control de versiones.",
          status: "laboral",
        },
      ],
      updatedAt: "2026-09-08T14:26:00.000Z",
    };
    const STORE_KEY = "bitacora_dual_clean_v3",
      SEEDED_KEY = "bitacora_dual_clean_v3_seeded",
      DRAFT_KEY = "bitacora_dual_draft_v1",
      ACTIVITY_LIMIT = 900,
      MAX_DAYS = 4,
      PAGE = { w: 297, h: 210 };
    const layout = {
      logo: { x: 68.5, y: 5.5, w: 160, h: 18.75 },
      strip: { x: 62.5, y: 31, w: 172, h: 5.7 },
      programY: 48.4,
      bitacoraY: 58.4,
      metaY: [67, 73, 79],
      table: {
        x: 10.5,
        y: 84,
        w: 276,
        headH: 7,
        colRatio: [0.075, 0.47, 0.11, 0.345],
      },
      signatures: {
        x: 10.5,
        y: 159,
        w: 276,
        colRatio: [0.18, 0.34, 0.28, 0.2],
        lineY: 184.6,
      },
    };
    const sizes = {
      strip: 11.5,
      title: 20,
      meta: 13,
      tableHead: 11,
      activity: 9,
      other: 9.5,
      signatureHead: 9.5,
      name: 8.3,
      role: 7.7,
      note: 7.3,
    };
    let entries = [],
      currentId = null,
      dirty = false,
      logoImage = null;
    const createId = () =>
      "bitacora-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    function readStore() {
      try {
        const p = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
    function writeStore(v) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(v));
        return true;
      } catch {
        showGuardAlert(
          "No se pudo guardar",
          "El almacenamiento no está disponible o está lleno. Exporta un respaldo antes de cerrar la página.",
        );
        return false;
      }
    }
    function ensureSeed() {
      if (!localStorage.getItem(SEEDED_KEY)) {
        if (!readStore().length) writeStore([SEED]);
        localStorage.setItem(SEEDED_KEY, "1");
      }
    }
    function setSaveState(t, k = "") {
      const n = $("#saveState");
      n.textContent = t;
      n.className = "pill" + (k ? " " + k : "");
    }
    function markDirty() {
      dirty = true;
      setSaveState("Sin guardar", "warn");
      queueDraftSave();
    }
    function populateInstructorSelect() {
      const s = $("#instructorPreset");
      s.innerHTML =
        '<option value="__custom__">Personalizar / otra persona…</option>';
      instructors().forEach((p) => {
        const o = document.createElement("option");
        o.value = p.name;
        o.textContent = p.name + " · " + p.roleMain;
        s.appendChild(o);
      });
    }
    function setInstructorEnabledUI() {
      const on = $("#instructorEnabled").checked,
        isCouncil = instructors().length > 0;
      $("#instructorBox").classList.toggle("disabled", !on);
      [
        "instructorPreset",
        "instructorName",
        "instructorRoleMain",
        "instructorNote",
      ].forEach(
        (id) =>
          ($("#" + id).disabled =
            !on || (id === "instructorPreset" && !isCouncil)),
      );
    }
    function applyInstructorPreset() {
      const p = instructors().find(
        (x) => x.name === $("#instructorPreset").value,
      );
      if (!p) return;
      $("#instructorName").value = p.name;
      $("#instructorRoleMain").value = p.roleMain;
      $("#instructorNote").value = "Instructor Formador";
      markDirty();
      updatePreview();
    }
    function blankEntry(date = "") {
      const preset = companyDefaults($("#company").value);
      return {
        date,
        status: "laboral",
        start: $("#defaultStart").value || preset.start,
        end: $("#defaultEnd").value || preset.end,
        area: preset.area,
        activity: "",
      };
    }
    let guardResolver = null,
      draftTimer = null,
      lastSpaceNotice = 0;
    const confirmedShortNames = new Set();
    function settleGuard(value) {
      const d = $("#guardDialog"),
        resolve = guardResolver;
      guardResolver = null;
      if (d?.open) d.close();
      if (resolve) resolve(value);
    }
    function openGuardDialog(
      title,
      message,
      {
        confirm = false,
        kind = "warning",
        confirmText = "Entendido",
        cancelText = "Revisar",
      } = {},
    ) {
      const d = $("#guardDialog");
      if (!d) {
        if (confirm) return Promise.resolve(window.confirm(message));
        alert(title + "\n\n" + message);
        return Promise.resolve(false);
      }
      if (d.open) d.close();
      d.dataset.kind = kind;
      $("#guardTitle").textContent = title;
      $("#guardMessage").textContent = message;
      $("#guardMark").textContent = kind === "info" ? "i" : "!";
      $("#guardConfirm").textContent = confirmText;
      $("#guardCancel").textContent = cancelText;
      $("#guardCancel").hidden = !confirm;
      return new Promise((resolve) => {
        guardResolver = resolve;
        if (typeof d.showModal === "function") d.showModal();
        else
          resolve(confirm ? window.confirm(message) : (alert(message), false));
      });
    }
    function showGuardAlert(title, message, kind = "warning") {
      openGuardDialog(title, message, { kind });
      return false;
    }
    function showGuardConfirm(
      title,
      message,
      confirmText = "Está correcto",
      cancelText = "Revisar",
    ) {
      return openGuardDialog(title, message, {
        confirm: true,
        kind: "warning",
        confirmText,
        cancelText,
      });
    }
    function nameWords(value) {
      return (
        String(value || "")
          .trim()
          .match(
            /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[.'’\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*/g,
          ) || []
      );
    }
    function getShortNames(scope = "all") {
      const fields = [];
      if (scope === "student" || scope === "all")
        fields.push(["Alumno", $("#student")?.value || ""]);
      if (scope === "representatives" || scope === "all") {
        fields.push(
          ["Vo.Bo.", $("#voboName")?.value || ""],
          ["Autorizó", $("#autorizoName")?.value || ""],
        );
        if ($("#instructorEnabled")?.checked)
          fields.push([
            "Instructor formador",
            $("#instructorName")?.value || "",
          ]);
      }
      return fields
        .filter(([, value]) => value.trim() && nameWords(value).length < 3)
        .filter(
          ([label, value]) =>
            !confirmedShortNames.has(label + "|" + value.trim().toLowerCase()),
        );
    }
    async function confirmShortNames(scope = "all") {
      const short = getShortNames(scope);
      if (!short.length) return true;
      const list = short
        .map(([label, value]) => `${label}: ${value}`)
        .join("\n");
      const ok = await showGuardConfirm(
        "¿El nombre está completo?",
        `Solo tienes 1 nombre y un apellido o está incompleto:\n\n${list}\n\nVerifica que esté escrito correctamente. Si la persona no utiliza apellido materno o su nombre legal realmente tiene menos palabras, puedes hacer caso omiso y continuar.`,
        "Sí, está correcto",
        "Revisar",
      );
      if (ok)
        short.forEach(([label, value]) =>
          confirmedShortNames.add(label + "|" + value.trim().toLowerCase()),
        );
      return ok;
    }
    function activityWords(value) {
      return (
        String(value || "")
          .replace(/[*_`#>•]/g, " ")
          .match(
            /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(?:['’\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})*/g,
          ) || []
      );
    }
    function validateActivityText(value) {
      const words = activityWords(value);
      if (words.length < 4)
        return {
          ok: false,
          reason: `Tiene ${words.length} palabra${words.length === 1 ? "" : "s"}; se requieren al menos 4 palabras.`,
        };
      const lower = words.map((w) => w.toLowerCase());
      const unique = new Set(lower);
      const obvious = words.filter(
        (w) =>
          /(.)\1{3,}/i.test(w) || /(asdf|qwer|zxcv|hjkl|lorem|ipsum)/i.test(w),
      );
      if (
        unique.size < Math.min(3, Math.ceil(words.length * 0.5)) ||
        obvious.length >= Math.ceil(words.length * 0.5)
      )
        return {
          ok: false,
          reason:
            "El texto parece repetitivo o poco legible. Usa palabras completas que describan la actividad o la justificación.",
        };
      return { ok: true };
    }
    function validateWeekEntries() {
      if (entries.length !== MAX_DAYS)
        return {
          ok: false,
          title: "Faltan o te pasaste de días",
          message:
            "Recuerda que en tu modalidad dual tienes que registrar tus días de martes a viernes. Si no laboras uno de esos días, selecciona la casilla correspondiente.",
        };
      if (entries.some((e) => !String(e.date || "").trim()))
        return {
          ok: false,
          title: "Falta una fecha",
          message:
            "Cada una de las 4 jornadas debe tener una fecha antes de continuar.",
        };
      if (new Set(entries.map((e) => e.date)).size !== MAX_DAYS)
        return {
          ok: false,
          title: "Hay fechas repetidas",
          message: "Las 4 jornadas deben corresponder a fechas distintas.",
        };
      if (entries.some((e) => !validDate(e.date)))
        return {
          ok: false,
          title: "Revisa las fechas",
          message: "Hay una fecha que no existe. Corrígela antes de continuar.",
        };
      const actual = entries.map((e) => e.date).sort(),
        expected = weekDates(actual[0]);
      if (actual.some((date, i) => date !== expected[i]))
        return {
          ok: false,
          title: "Revisa la semana",
          message:
            "Las cuatro fechas deben ser de martes a viernes de la misma semana.",
        };
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (
          e.status === "laboral" &&
          (!validTime(e.start) || !validTime(e.end) || e.end <= e.start)
        )
          return {
            ok: false,
            title: `Revisa el horario del día ${i + 1}`,
            message:
              "Completa entrada y salida. La salida debe ser después de la entrada.",
          };
        if (e.status === "inhabil") continue;
        const check = validateActivityText(e.activity);
        if (!check.ok)
          return {
            ok: false,
            title: `Revisa la jornada ${i + 1}`,
            message: `${check.reason}\n\nCada actividad o justificación debe tener al menos 4 palabras y ser legible.`,
          };
      }
      const model = buildPageModel();
      if (!model.fits)
        return {
          ok: false,
          title: "La semana ya no cabe en una hoja",
          message:
            "Reduce el texto de una o más jornadas. El sistema calcula el espacio de los cuatro días de forma compartida para conservar el PDF en una sola página.",
        };
      return { ok: true };
    }
    function activityLineMetrics(model = buildPageModel()) {
      const slack = Math.max(0, model.maxBottom - model.bottom);
      return model.rows.map((row) => {
        const labelLines = row.special ? 1 : 0,
          used = Math.max(0, row.activityLines.length - labelLines),
          maxTotal = Math.max(
            row.activityLines.length,
            Math.floor((row.h + slack - 3) / 3.38),
          ),
          max = Math.max(used, maxTotal - labelLines);
        return { used, max };
      });
    }
    function refreshLineLimits() {
      if (!entries.length) return;
      const metrics = activityLineMetrics();
      metrics.forEach((m, i) => {
        const el = document.querySelector(`[data-lines="${i}"]`);
        if (!el) return;
        const left = Math.max(0, m.max - m.used);
        el.textContent =
          entries[i]?.status === "inhabil"
            ? "Automático"
            : `Te queda${left === 1 ? "" : "n"} ${left} línea${left === 1 ? "" : "s"}`;
        el.classList.toggle("near", m.max > 0 && m.used >= m.max - 1);
        el.classList.toggle("full", m.max > 0 && m.used >= m.max);
      });
    }
    function notifySpaceLimit() {
      const now = Date.now();
      if (now - lastSpaceNotice < 1400) return;
      lastSpaceNotice = now;
      showGuardAlert(
        "Límite de espacio alcanzado",
        "Ese cambio haría que la bitácora dejara de caber en una sola hoja. El máximo de líneas de esta jornada se calcula con base en lo que ya ocupan las otras tres. Reduce texto en otra jornada si necesitas liberar más espacio aquí.",
      );
    }
    function collectDraft() {
      return {
        version: 1,
        currentId,
        weekDate: $("#weekDate")?.value || "",
        defaultStart: $("#defaultStart")?.value || "10:00",
        defaultEnd: $("#defaultEnd")?.value || "14:00",
        markdown: $("#markdown")?.checked !== false,
        identity: getIdentity(),
        entries: deepCopy(entries),
        savedAt: new Date().toISOString(),
      };
    }
    function saveDraftNow() {
      clearTimeout(draftTimer);
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
        if (dirty) setSaveState("Borrador guardado", "warn");
      } catch {
        setSaveState("No se pudo guardar el borrador", "bad");
      }
    }
    function queueDraftSave() {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(saveDraftNow, 180);
    }
    function clearDraft() {
      clearTimeout(draftTimer);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
    }
    function restoreDraft() {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        if (!d || !d.identity || !Array.isArray(d.entries)) return false;
        currentId = d.currentId || null;
        entries = deepCopy(d.entries).slice(0, MAX_DAYS);
        fillIdentity(d.identity);
        $("#weekDate").value =
          weekDates(d.weekDate || entries[0]?.date)[0] || "";
        $("#defaultStart").value =
          d.defaultStart || companyDefaults($("#company").value).start;
        $("#defaultEnd").value =
          d.defaultEnd || companyDefaults($("#company").value).end;
        $("#markdown").checked = d.markdown !== false;
        renderDays();
        dirty = true;
        setSaveState("Borrador recuperado", "warn");
        updatePreview();
        return true;
      } catch {
        return false;
      }
    }
    window.bitacoraAlert = showGuardAlert;
    window.bitacoraConfirm = showGuardConfirm;
    window.bitacoraValidateWeek = validateWeekEntries;
    window.bitacoraConfirmNames = confirmShortNames;
    function renderDays() {
      const host = $("#days");
      host.innerHTML = "";
      if (!entries.length) {
        host.innerHTML =
          '<div class="empty">Selecciona una fecha y genera de martes a viernes, o agrega un día manualmente.</div>';
        return;
      }
      entries.forEach((e, i) => {
        if (e.status === "inhabil") e.activity = INHABIL_JUSTIFICATION;
        const card = document.createElement("div");
        card.className =
          "day-card" + (e.status !== "laboral" ? " nonwork" : "");
        const activityLabel =
          e.status === "falta"
            ? "Justificación de la falta"
            : e.status === "sin_labores"
              ? "Justificación de sin labores"
              : e.status === "inhabil"
                ? "Justificación de día inhábil"
                : "Actividad";
        const activityPlaceholder =
          e.status === "falta"
            ? "Explica brevemente el motivo"
            : e.status === "sin_labores"
              ? "Explica por qué no hubo labores en la empresa"
              : e.status === "inhabil"
                ? INHABIL_JUSTIFICATION
                : "Puedes usar **negritas**, *cursivas* y listas con -";
        card.innerHTML = `<div class="day-grid"><div class="field"><label>Fecha</label><input data-index="${i}" data-key="date" type="date" value="${escapeHtml(e.date)}"></div><div class="field"><label>Tipo de día</label><select data-index="${i}" data-key="status"><option value="laboral" ${e.status === "laboral" ? "selected" : ""}>Con labores</option><option value="sin_labores" ${e.status === "sin_labores" ? "selected" : ""}>Sin labores</option><option value="inhabil" ${e.status === "inhabil" ? "selected" : ""}>Día inhábil</option><option value="falta" ${e.status === "falta" ? "selected" : ""}>Falta</option></select></div><div class="field"><label>Entrada</label><input data-index="${i}" data-key="start" type="time" value="${escapeHtml(e.start)}" ${e.status !== "laboral" ? "disabled" : ""}></div><div class="field"><label>Salida</label><input data-index="${i}" data-key="end" type="time" value="${escapeHtml(e.end)}" ${e.status !== "laboral" ? "disabled" : ""}></div><div class="field"><label>Área</label><input data-index="${i}" data-key="area" value="${escapeHtml(e.area)}" ${e.status !== "laboral" ? "disabled" : ""}></div><button class="icon-btn" data-delete="${i}" title="Eliminar día">×</button></div><div class="field" style="margin-top:9px"><label>${activityLabel}</label><textarea lang="es" spellcheck="true" data-index="${i}" data-key="activity" maxlength="${ACTIVITY_LIMIT}" placeholder="${escapeHtml(activityPlaceholder)}" ${e.status === "inhabil" ? "disabled" : ""}>${escapeHtml(e.activity)}</textarea><button type="button" class="btn spelling-trigger" data-spellcheck ${e.status === "inhabil" ? "disabled" : ""}>Revisar ortografía</button><div class="counter"><span class="line-budget" data-lines="${i}">Calculando…</span></div></div>`;
        host.appendChild(card);
      });
      host.querySelectorAll("[data-key]").forEach((input) => {
        const handler = () => {
          const i = +input.dataset.index,
            k = input.dataset.key;
          if (k === "status") {
            const snapshot = deepCopy(entries[i]),
              before = buildPageModel(),
              previous = entries[i].status,
              next = input.value;
            entries[i].status = next;
            if (next === "inhabil") entries[i].activity = INHABIL_JUSTIFICATION;
            else if (
              previous === "inhabil" &&
              entries[i].activity === INHABIL_JUSTIFICATION
            )
              entries[i].activity = "";
            const after = buildPageModel();
            if (!after.fits && after.bottom >= before.bottom - 0.01) {
              entries[i] = snapshot;
              renderDays();
              notifySpaceLimit();
              return;
            }
            showStatusNotice(next);
            renderDays();
            markDirty();
            updatePreview();
            refreshLineLimits();
            return;
          }
          const previous = entries[i][k],
            before = buildPageModel();
          entries[i][k] = input.value;
          const after = buildPageModel();
          if (!after.fits && after.bottom >= before.bottom - 0.01) {
            entries[i][k] = previous;
            input.value = previous ?? "";
            if (k === "activity") {
              const c = host.querySelector(`[data-count="${i}"]`);
              if (c) c.textContent = String(previous ?? "").length;
              notifySpaceLimit();
            } else
              showGuardAlert(
                "Límite de espacio alcanzado",
                "Ese cambio haría que el PDF rebasara una hoja. Reduce el contenido de otra jornada antes de ampliar este campo.",
              );
            refreshLineLimits();
            return;
          }
          if (k === "activity") {
            const c = host.querySelector(`[data-count="${i}"]`);
            if (c) c.textContent = input.value.length;
          }
          markDirty();
          updatePreview();
          refreshLineLimits();
        };
        if (input.tagName === "SELECT")
          input.addEventListener("change", handler);
        else input.addEventListener("input", handler);
      });
      host.querySelectorAll("[data-delete]").forEach((b) =>
        b.addEventListener("click", () => {
          entries.splice(+b.dataset.delete, 1);
          renderDays();
          markDirty();
          updatePreview();
          refreshLineLimits();
        }),
      );
      refreshLineLimits();
    }
    async function generateWeek() {
      const setup = weekSetup(
        $("#weekDate").value,
        $("#defaultStart").value,
        $("#defaultEnd").value,
      );
      const error = $("#weekError");
      error.hidden = !setup.error;
      error.textContent = setup.error || "";
      ["weekDate", "defaultStart", "defaultEnd"].forEach((id) =>
        $("#" + id).removeAttribute("aria-invalid"),
      );
      if (setup.error) {
        $("#" + setup.field).setAttribute("aria-invalid", "true");
        $("#" + setup.field).focus();
        return;
      }
      if (
        entries.some((e) => e.activity?.trim()) &&
        !(await openGuardDialog(
          "¿Reemplazar las jornadas?",
          "La semana nueva reemplazará las actividades actuales.",
          { confirm: true, confirmText: "Reemplazar" },
        ))
      )
        return;
      entries = setup.dates.map((date) => blankEntry(date));
      $("#weekHint").textContent =
        `Del ${setup.dates[0].split("-").reverse().join("/")} al ${setup.dates[3].split("-").reverse().join("/")}. Ajusta abajo solo lo que cambie.`;
      renderDays();
      markDirty();
      updatePreview();
    }
    function getIdentity() {
      return {
        student: $("#student").value.trim(),
        company: $("#company").value.trim(),
        school: $("#school").value.trim(),
        specialty: $("#specialty").value,
        semester: $("#semester").value,
        group: $("#group").value,
        authorities: {
          elaboroName: $("#elaboroName").value.trim(),
          elaboroRole: $("#elaboroRole").value.trim(),
          voboName: $("#voboName").value.trim(),
          voboRole: $("#voboRole").value.trim(),
          autorizoName: $("#autorizoName").value.trim(),
          autorizoRole: $("#autorizoRole").value.trim(),
        },
        instructor: {
          enabled: $("#instructorEnabled").checked,
          preset: $("#instructorPreset").value,
          name: $("#instructorName").value.trim(),
          roleMain: $("#instructorRoleMain").value.trim(),
          note: $("#instructorNote").value.trim() || "Instructor Formador",
        },
      };
    }
    function syncCompanyContext(changed = false) {
      const config = companies.find((c) => c.name === $("#company").value);
      populateInstructorSelect();
      if (changed)
        $("#instructorEnabled").checked = !!config?.instructorEnabledByDefault;
      const council = $("#company").value === COUNCIL;
      $("#instructorPresetField").hidden = !instructors().length;
      $("#instructorContext").textContent = council
        ? "Selecciona un instructor precargado del Consejo"
        : "Captura manual para esta empresa";
      if (changed && council) {
        $("#autorizoName").value = COUNCIL_AUTHORITY.name;
        $("#autorizoRole").value = COUNCIL_AUTHORITY.role;
      } else if (
        changed &&
        $("#autorizoName").value.trim() === COUNCIL_AUTHORITY.name
      ) {
        $("#autorizoName").value = "";
        $("#autorizoRole").value = "";
      }
      $("#instructorPreset").value = instructors().some(
        (p) => p.name === $("#instructorName").value,
      )
        ? $("#instructorName").value
        : "__custom__";
      setInstructorEnabledUI();
      if (changed) applyCompanyDefaults();
    }
    function savedOption(id, value) {
      const select = $("#" + id);
      if (
        value &&
        !Array.from(select.options).some((o) => o.value === String(value))
      )
        select.add(new Option(value, value));
    }
    function fillIdentity(r) {
      savedOption("company", LEGACY_COMPANY_ALIASES[r.company] || r.company);
      savedOption("school", r.school);
      $("#student").value = r.student ?? "";
      $("#company").value =
        LEGACY_COMPANY_ALIASES[r.company] || (r.company ?? "");
      $("#school").value = r.school ?? DEFAULTS.school;
      configureSchool(false);
      ["specialty", "semester", "group"].forEach((id) =>
        savedOption(id, r[id]),
      );
      $("#specialty").value = r.specialty ?? DEFAULTS.specialty;
      $("#semester").value = String(r.semester ?? 4);
      const restoredGroup = String(r.group ?? "B")
        .trim()
        .toUpperCase();
      $("#group").value = restoredGroup;
      const a = { ...DEFAULTS.authorities, ...(r.authorities || {}) };
      $("#elaboroName").value = $("#student").value.trim();
      $("#elaboroRole").value =
        a.elaboroRole ||
        "Alumno de Educación Dual\n" +
          (schools.find((s) => s.name === $("#school").value) || schools[0])
            .shortName;
      $("#voboName").value = a.voboName || "";
      $("#voboRole").value = a.voboRole || "";
      $("#autorizoName").value = a.autorizoName || "";
      $("#autorizoRole").value = a.autorizoRole || "";
      const ins = { ...DEFAULTS.instructor, ...(r.instructor || {}) };
      $("#instructorEnabled").checked =
        r.instructor?.enabled ??
        !!companies.find((c) => c.name === $("#company").value)
          ?.instructorEnabledByDefault;
      $("#instructorPreset").value = instructors().some(
        (p) => p.name === ins.preset,
      )
        ? ins.preset
        : "__custom__";
      $("#instructorName").value = ins.name || "";
      $("#instructorRoleMain").value = ins.roleMain || "";
      $("#instructorNote").value = ins.note || "Instructor Formador";
      syncCompanyContext();
    }
    function autoTitle() {
      const dates = entries
        .map((e) => e.date)
        .filter(Boolean)
        .sort();
      if (!dates.length) return "Bitácora semanal";
      const f = (s) => {
          const [y, m, d] = s.split("-").map(Number);
          return new Date(y, m - 1, d);
        },
        a = new Intl.DateTimeFormat("es-MX", {
          day: "numeric",
          month: "long",
        }).format(f(dates[0])),
        b = new Intl.DateTimeFormat("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(f(dates.at(-1)));
      return `Semana · ${a} al ${b}`;
    }
    function collectRecord() {
      return {
        id: currentId || createId(),
        title: autoTitle(),
        ...getIdentity(),
        markdown: $("#markdown").checked,
        entries: deepCopy(entries),
        updatedAt: new Date().toISOString(),
      };
    }
    function newBlank(clear = true) {
      if (clear) clearDraft();
      currentId = null;
      entries = [];
      $("#weekDate").value = "";
      $("#markdown").checked = true;
      fillIdentity({ ...DEFAULTS, student: readProfile() });
      renderDays();
      dirty = false;
      setSaveState("Nueva");
      updatePreview();
    }
    function loadRecord(r) {
      currentId = r.id;
      entries = deepCopy(r.entries || []).slice(0, MAX_DAYS);
      $("#weekDate").value = weekDates(entries[0]?.date)[0] || "";
      $("#markdown").checked = r.markdown !== false;
      fillIdentity(r);
      renderDays();
      dirty = false;
      setSaveState("Guardado");
      updatePreview();
      saveDraftNow();
    }
    function hasMissingJustification() {
      return entries.some(
        (e) =>
          (e.status === "falta" || e.status === "sin_labores") &&
          !String(e.activity || "").trim(),
      );
    }
    function checkIdentity() {
      const required = [
        "student",
        "company",
        "school",
        "specialty",
        "semester",
        "group",
        "voboName",
        "voboRole",
        "autorizoName",
        "autorizoRole",
      ];
      if ($("#instructorEnabled").checked)
        required.push("instructorName", "instructorRoleMain");
      const missing = required.find((id) => !$("#" + id).value.trim());
      if (!missing) return true;
      showGuardAlert(
        "Falta un dato",
        "Completa los datos del alumno, la empresa y quienes firman antes de guardar o descargar.",
      );
      return false;
    }
    async function saveRecord() {
      if (!checkIdentity()) return;
      const check = validateWeekEntries();
      if (!check.ok) {
        showGuardAlert(check.title, check.message);
        return;
      }
      if (!(await confirmShortNames("all"))) return;
      persistRecord(collectRecord());
    }
    function persistRecord(r, quiet = false) {
      const all = readStore(),
        i = all.findIndex((x) => x.id === r.id);
      if (i >= 0) all[i] = r;
      else all.unshift(r);
      if (!writeStore(all)) return false;
      currentId = r.id;
      dirty = false;
      setSaveState("Guardado");
      renderRecords();
      saveDraftNow();
      rememberName(r.student);
      $("#historyDisclosure").open = false;
      $("#backupDisclosure").open = false;
      if (!quiet)
        notify(
          "success",
          "Bitácora guardada",
          "La encontrarás en Registros guardados.",
        );
      return true;
    }
    function renderRecords() {
      const h = $("#records"),
        all = readStore()
          .slice()
          .sort((a, b) =>
            String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
          );
      h.innerHTML = "";
      if (!all.length) {
        h.innerHTML = '<div class="empty">Sin registros guardados.</div>';
        return;
      }
      all.forEach((r) => {
        const n = document.createElement("div");
        n.className = "record";
        n.innerHTML = `<div><strong>${escapeHtml(r.title || "Bitácora")}</strong><small>${(r.entries || []).length} día(s)</small></div><div class="record-actions"><button data-open="${escapeHtml(r.id)}" title="Abrir">↗</button><button data-copy="${escapeHtml(r.id)}" title="Duplicar">⧉</button><button data-remove="${escapeHtml(r.id)}" title="Eliminar">⌫</button></div>`;
        h.appendChild(n);
      });
      h.querySelectorAll("[data-open]").forEach(
        (b) =>
          (b.onclick = () => {
            const r = readStore().find((x) => x.id === b.dataset.open);
            if (r) loadRecord(r);
          }),
      );
      h.querySelectorAll("[data-copy]").forEach(
        (b) =>
          (b.onclick = () => {
            const s = readStore().find((x) => x.id === b.dataset.copy);
            if (!s) return;
            const c = deepCopy(s);
            c.id = createId();
            c.updatedAt = new Date().toISOString();
            const all = readStore();
            all.unshift(c);
            writeStore(all);
            renderRecords();
            loadRecord(c);
          }),
      );
      h.querySelectorAll("[data-remove]").forEach(
        (b) =>
          (b.onclick = () => {
            if (confirm("¿Eliminar este registro?")) {
              writeStore(readStore().filter((x) => x.id !== b.dataset.remove));
              renderRecords();
            }
          }),
      );
    }
    function exportBackup() {
      const blob = new Blob([JSON.stringify(readStore(), null, 2)], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "respaldo_bitacoras_dual.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
    async function importBackup(file) {
      try {
        if (file.size > 5_000_000) throw new Error("El respaldo supera 5 MB.");
        const { records } = parseBackup(await file.text());
        if (
          !(await openGuardDialog(
            "Importar respaldo",
            `Se agregarán ${records.length} registros. Tus registros actuales se conservarán.`,
            { confirm: true, confirmText: "Importar" },
          ))
        )
          return;
        const all = readStore(),
          ids = new Set(all.map((r) => r.id));
        for (const record of records) {
          const copy = deepCopy(record);
          if (ids.has(copy.id)) copy.id = createId();
          ids.add(copy.id);
          all.push(copy);
        }
        if (!writeStore(all)) return;
        renderRecords();
        notifyImported();
      } catch (error) {
        showGuardAlert(
          "No se importó el respaldo",
          error.message || "El archivo JSON no es válido.",
        );
      }
    }

    const measureContext = document.createElement("canvas").getContext("2d"),
      ptToMm = (pt) => (pt * 25.4) / 72;
    function fontCss(s, st = "normal") {
      const px = (s * 96) / 72,
        w = st.includes("bold") ? 700 : 400,
        it = st.includes("italic") ? "italic " : "";
      return `${it}${w} ${px}px "Times New Roman", Times, serif`;
    }
    function measureMm(t, s, st = "normal") {
      measureContext.font = fontCss(s, st);
      return (measureContext.measureText(t).width * 25.4) / 96;
    }
    function parseInline(text, on) {
      if (!on) return [{ text, style: "normal" }];
      const out = [];
      let i = 0;
      while (i < text.length) {
        if (text.startsWith("**", i) || text.startsWith("__", i)) {
          const tok = text.slice(i, i + 2),
            end = text.indexOf(tok, i + 2);
          if (end >= 0) {
            out.push({ text: text.slice(i + 2, end), style: "bold" });
            i = end + 2;
            continue;
          }
        }
        if (text[i] === "*" || text[i] === "_") {
          const tok = text[i],
            end = text.indexOf(tok, i + 1);
          if (end > i + 1) {
            out.push({ text: text.slice(i + 1, end), style: "italic" });
            i = end + 1;
            continue;
          }
        }
        let n = i + 1;
        while (
          n < text.length &&
          !text.startsWith("**", n) &&
          !text.startsWith("__", n) &&
          text[n] !== "*" &&
          text[n] !== "_"
        )
          n++;
        out.push({ text: text.slice(i, n), style: "normal" });
        i = n;
      }
      return out.filter((x) => x.text);
    }
    function wrapStyled(text, max, s, on = true) {
      const lines = [];
      String(text || "")
        .split("\n")
        .forEach((raw) => {
          if (!raw) {
            lines.push([]);
            return;
          }
          let c = raw,
            prefix = "";
          const b = raw.match(/^\s*[-•]\s+(.+)$/),
            num = raw.match(/^\s*(\d+[.)])\s+(.+)$/);
          if (b) {
            prefix = "• ";
            c = b[1];
          } else if (num) {
            prefix = num[1] + " ";
            c = num[2];
          }
          const seg = [
              ...(prefix ? [{ text: prefix, style: "normal" }] : []),
              ...parseInline(c, on),
            ],
            tokens = [];
          seg.forEach((x) =>
            x.text
              .split(/(\s+)/)
              .filter(Boolean)
              .forEach((t) => tokens.push({ text: t, style: x.style })),
          );
          let cur = [],
            w = 0;
          tokens.forEach((t) => {
            const tw = measureMm(t.text, s, t.style);
            if (w + tw <= max || !cur.length) {
              cur.push(t);
              w += tw;
            } else if (/^\s+$/.test(t.text)) {
              lines.push(cur);
              cur = [];
              w = 0;
            } else {
              lines.push(cur);
              cur = [{ ...t, text: t.text.trimStart() }];
              w = measureMm(cur[0].text, s, cur[0].style);
            }
          });
          if (cur.length) lines.push(cur);
        });
      return lines.length ? lines : [[]];
    }
    function wrapPlain(t, m, s, st = "normal") {
      return wrapStyled(t, m, s, false).map((line) =>
        line.map((x) => ({ ...x, style: st })),
      );
    }
    function formatDate(iso) {
      if (!iso) return "";
      const [y, m, d] = iso.split("-").map(Number);
      return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(y, m - 1, d));
    }
    function formatTime(t) {
      if (!t) return "";
      const [h, m] = t.split(":").map(Number);
      return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p.m." : "a.m."}`;
    }
    function companySignatureName(company) {
      return signatureName(
        companies.find((c) => c.name === company) || { name: company },
      );
    }
    function authoritySignatureRoles(role, company) {
      let lines = String(role || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
      if (company === COUNCIL)
        lines = lines.filter(
          (x) => !/^cocy?ti?e?g$/i.test(x.replace(/[^a-z]/gi, "")),
        );
      const companyName = companySignatureName(company);
      if (companyName) lines.push(companyName);
      return lines;
    }
    function buildPageModel() {
      const t = layout.table,
        widths = t.colRatio.map((r) => r * t.w),
        xs = [t.x];
      widths.forEach((w) => xs.push(xs.at(-1) + w));
      const bodyTop = t.y + t.headH,
        maxBottom = layout.signatures.y - 5,
        on = $("#markdown").checked,
        rows = entries.map((e) => {
          const st = e.status || "laboral",
            special = st !== "laboral",
            label =
              st === "sin_labores"
                ? "SIN LABORES"
                : st === "inhabil"
                  ? "DÍA INHÁBIL"
                  : st === "falta"
                    ? "FALTA"
                    : "",
            dateLines = wrapPlain(
              formatDate(e.date),
              widths[0] - 2.6,
              sizes.other,
              "bold",
            ),
            activityLines = special
              ? [
                  ...wrapPlain(label, widths[1] - 3.2, sizes.activity, "bold"),
                  ...wrapStyled(
                    e.activity,
                    widths[1] - 3.2,
                    sizes.activity,
                    on,
                  ),
                ]
              : wrapStyled(e.activity, widths[1] - 3.2, sizes.activity, on),
            timeLines = special
              ? wrapPlain("-", widths[2] - 2.6, sizes.other)
              : wrapPlain(
                  formatTime(e.start) + " - " + formatTime(e.end),
                  widths[2] - 2.6,
                  sizes.other,
                ),
            areaLines = special
              ? wrapPlain("-", widths[3] - 3.2, sizes.other)
              : wrapPlain(e.area, widths[3] - 3.2, sizes.other),
            h = Math.max(
              10.5,
              dateLines.length * 3.65 + 3,
              activityLines.length * 3.38 + 3,
              timeLines.length * 3.65 + 3,
              areaLines.length * 3.65 + 3,
            );
          return {
            e,
            st,
            special,
            label,
            dateLines,
            activityLines,
            timeLines,
            areaLines,
            h,
          };
        }),
        bottom = bodyTop + rows.reduce((s, r) => s + r.h, 0);
      return {
        xs,
        widths,
        rows,
        bodyTop,
        bottom,
        maxBottom,
        fits: bottom <= maxBottom,
      };
    }
    const mm = (v, p) => v * p;
    function setFont(c, s, st, p) {
      const px = ptToMm(s) * p,
        w = st.includes("bold") ? 700 : 400,
        it = st.includes("italic") ? "italic " : "";
      c.font = `${it}${w} ${px}px "Times New Roman", Times, serif`;
    }
    function drawText(c, t, x, y, s, st, a, col, p) {
      setFont(c, s, st, p);
      c.fillStyle = col || "#000";
      c.textAlign = a || "left";
      c.textBaseline = "alphabetic";
      c.fillText(t, mm(x, p), mm(y, p));
    }
    function line(c, x1, y1, x2, y2, w, col, p) {
      c.beginPath();
      c.moveTo(mm(x1, p), mm(y1, p));
      c.lineTo(mm(x2, p), mm(y2, p));
      c.lineWidth = mm(w || 0.22, p);
      c.strokeStyle = col || "#333";
      c.stroke();
    }
    function rect(c, x, y, w, h, fill, stroke, lw, p) {
      if (fill) {
        c.fillStyle = fill;
        c.fillRect(mm(x, p), mm(y, p), mm(w, p), mm(h, p));
      }
      if (stroke) {
        c.lineWidth = mm(lw || 0.22, p);
        c.strokeStyle = stroke;
        c.strokeRect(mm(x, p), mm(y, p), mm(w, p), mm(h, p));
      }
    }
    function styled(c, lines, x, y, s, lh, p) {
      lines.forEach((ln, ri) => {
        let cx = x;
        ln.forEach((seg) => {
          drawText(
            c,
            seg.text,
            cx,
            y + ri * lh,
            s,
            seg.style,
            "left",
            "#000",
            p,
          );
          cx += measureMm(seg.text, s, seg.style);
        });
      });
    }
    function centered(c, lines, cx, top, h, s, lh, p) {
      const total = lines.length * lh,
        first = top + (h - total) / 2 + lh * 0.78;
      lines.forEach((ln, i) => {
        const t = ln.map((x) => x.text).join(""),
          styles = [...new Set(ln.map((x) => x.style))],
          st = styles.length === 1 ? styles[0] : "normal";
        drawText(c, t, cx, first + i * lh, s, st, "center", "#000", p);
      });
    }
    function drawPdfPage(canvas, p) {
      const model = buildPageModel(),
        id = getIdentity();
      canvas.width = Math.round(PAGE.w * p);
      canvas.height = Math.round(PAGE.h * p);
      const c = canvas.getContext("2d");
      c.fillStyle = "#fff";
      c.fillRect(0, 0, canvas.width, canvas.height);
      if (logoImage && logoImage.complete && logoImage.naturalWidth)
        c.drawImage(
          logoImage,
          mm(layout.logo.x + (layout.logo.w * 0.0375) / 2, p),
          mm(
            layout.logo.y +
              (layout.logo.h -
                (layout.logo.w * 0.9625) /
                  (logoImage.naturalWidth / logoImage.naturalHeight)) /
                2,
            p,
          ),
          mm(layout.logo.w * 0.9625, p),
          mm(
            (layout.logo.w * 0.9625) /
              (logoImage.naturalWidth / logoImage.naturalHeight),
            p,
          ),
        );
      rect(
        c,
        layout.strip.x,
        layout.strip.y,
        layout.strip.w,
        layout.strip.h,
        "#808080",
        null,
        0,
        p,
      );
      drawText(
        c,
        (id.school || "INSTITUCIÓN EDUCATIVA").toUpperCase(),
        layout.strip.x + layout.strip.w / 2,
        layout.strip.y + 4.35,
        sizes.strip,
        "bold",
        "center",
        "#fff",
        p,
      );
      const A = "PROGRAMA DE FORMACIÓN ",
        B = "DUAL",
        tw =
          measureMm(A, sizes.title, "bold") + measureMm(B, sizes.title, "bold"),
        sx = (PAGE.w - tw) / 2;
      drawText(
        c,
        A,
        sx,
        layout.programY,
        sizes.title,
        "bold",
        "left",
        "#000",
        p,
      );
      drawText(
        c,
        B,
        sx + measureMm(A, sizes.title, "bold"),
        layout.programY,
        sizes.title,
        "bold",
        "left",
        "#bd8d2d",
        p,
      );
      drawText(
        c,
        "BITÁCORA SEMANAL",
        PAGE.w / 2,
        layout.bitacoraY,
        sizes.title,
        "bold",
        "center",
        "#000",
        p,
      );
      drawText(
        c,
        "Nombre del alumno: " + id.student,
        layout.table.x,
        layout.metaY[0],
        sizes.meta,
        "bold",
        "left",
        "#000",
        p,
      );
      drawText(
        c,
        "Nombre de la empresa: " + id.company,
        layout.table.x,
        layout.metaY[1],
        sizes.meta,
        "bold",
        "left",
        "#000",
        p,
      );
      drawText(
        c,
        `Especialidad: ${id.specialty}    Semestre: ${id.semester}°    Grupo: ${id.group}`,
        layout.table.x,
        layout.metaY[2],
        sizes.meta,
        "bold",
        "left",
        "#000",
        p,
      );
      const t = layout.table,
        { xs, widths, rows } = model;
      rect(c, t.x, t.y, t.w, t.headH, null, "#333", 0.22, p);
      for (let i = 1; i < xs.length - 1; i++)
        line(c, xs[i], t.y, xs[i], model.bottom, 0.22, "#333", p);
      [
        "FECHA",
        "ACTIVIDADES REALIZADAS",
        "HORARIOS",
        "ÁREA DONDE REALIZÓ LA ACTIVIDAD",
      ].forEach((h, i) =>
        drawText(
          c,
          h,
          i === 0 || i === 2 ? xs[i] + widths[i] / 2 : xs[i] + 1.2,
          t.y + 5.25,
          sizes.tableHead,
          "bold",
          i === 0 || i === 2 ? "center" : "left",
          "#000",
          p,
        ),
      );
      let y = t.y + t.headH;
      rows.forEach((r) => {
        rect(
          c,
          t.x,
          y,
          t.w,
          r.h,
          r.special ? "#e7e7e7" : null,
          "#333",
          0.22,
          p,
        );
        centered(
          c,
          r.dateLines,
          xs[0] + widths[0] / 2,
          y,
          r.h,
          sizes.other,
          3.65,
          p,
        );
        r.special
          ? centered(
              c,
              r.activityLines,
              xs[1] + widths[1] / 2,
              y,
              r.h,
              sizes.activity,
              3.65,
              p,
            )
          : styled(
              c,
              r.activityLines,
              xs[1] + 1.5,
              y + 3.7,
              sizes.activity,
              3.38,
              p,
            );
        centered(
          c,
          r.timeLines,
          xs[2] + widths[2] / 2,
          y,
          r.h,
          sizes.other,
          3.65,
          p,
        );
        centered(
          c,
          r.areaLines,
          xs[3] + widths[3] / 2,
          y,
          r.h,
          sizes.other,
          3.65,
          p,
        );
        y += r.h;
      });
      const s = layout.signatures,
        sw = s.colRatio.map((r) => r * s.w),
        sx2 = [s.x];
      sw.forEach((w) => sx2.push(sx2.at(-1) + w));
      const companyName = companySignatureName(id.company),
        cells = [
          {
            h: "Elaboró",
            n: id.authorities.elaboroName,
            r: schoolSignatureRole(
              id.authorities.elaboroRole,
              schools.find((s) => s.name === id.school) || { name: id.school },
            ),
            on: true,
          },
          {
            h: "Vo.Bo",
            n: id.authorities.voboName,
            r: schoolSignatureRole(
              id.authorities.voboRole,
              schools.find((s) => s.name === id.school) || { name: id.school },
            ),
            on: true,
          },
          {
            h: "Autorizó",
            n: id.authorities.autorizoName,
            r: authoritySignatureRoles(id.authorities.autorizoRole, id.company),
            on: true,
          },
          {
            h: "Vo.Bo",
            n: id.instructor.name,
            r: [id.instructor.roleMain, id.instructor.note, companyName].filter(
              Boolean,
            ),
            on: id.instructor.enabled,
          },
        ];
      cells.forEach((cell, i) => {
        if (!cell.on) return;
        const cx = sx2[i] + sw[i] / 2;
        drawText(
          c,
          cell.h,
          cx,
          s.y + 5.4,
          sizes.signatureHead,
          "bold",
          "center",
          "#000",
          p,
        );
        if (i < 3)
          drawText(
            c,
            [
              "FIRMA DEL ALUMNO:",
              "FIRMA DE VINCULACIÓN:",
              "FIRMA DEL ASESOR DE LA EMPRESA:",
            ][i],
            cx,
            s.y + 9.1,
            5.4,
            "normal",
            "center",
            "#555",
            p,
          );
        line(
          c,
          cx - sw[i] * 0.39,
          s.lineY,
          cx + sw[i] * 0.39,
          s.lineY,
          0.22,
          "#222",
          p,
        );
        drawText(
          c,
          cell.n,
          cx,
          s.lineY + 3.55,
          sizes.name,
          "bold",
          "center",
          "#000",
          p,
        );
        cell.r
          .slice(0, 4)
          .forEach((r, j) =>
            drawText(
              c,
              r,
              cx,
              s.lineY + 6.4 + j * 2.75,
              r.toLowerCase() === "instructor formador"
                ? sizes.note
                : sizes.role,
              r.toLowerCase() === "instructor formador" ? "normal" : "italic",
              "center",
              r.toLowerCase() === "instructor formador" ? "#555" : "#000",
              p,
            ),
          );
      });
      return model;
    }
    let previewTimer;
    function updatePreview() {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        const m = buildPageModel(),
          s = $("#fitState");
        s.className = "pill" + (m.fits ? "" : " bad");
        s.textContent = m.fits
          ? "Cabe en una página"
          : "Excede el espacio fijo";
        $("#pdfBtn").disabled = !m.fits || !entries.length;
        $("#mobilePdf").disabled = !m.fits || !entries.length;
        if ($("#preview").getClientRects().length)
          drawPdfPage(
            $("#preview"),
            Math.min(6, Math.max(3, devicePixelRatio * 3)),
          );
      }, 120);
    }
    const previewObserver = new IntersectionObserver((items) => {
      if (items.some((item) => item.isIntersecting)) updatePreview();
    });
    previewObserver.observe($("#preview"));

    function dataUrlToBytes(url) {
      const bin = atob(url.split(",")[1]),
        b = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
      return b;
    }
    function asciiBytes(t) {
      const b = new Uint8Array(t.length);
      for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i) & 255;
      return b;
    }
    function concatBytes(parts) {
      const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
      let o = 0;
      parts.forEach((p) => {
        out.set(p, o);
        o += p.length;
      });
      return out;
    }
    function createPdf(jpeg, w, h) {
      const pw = 841.8898,
        ph = 595.2756,
        content = asciiBytes(
          `q\n${pw.toFixed(4)} 0 0 ${ph.toFixed(4)} 0 0 cm\n/Im0 Do\nQ\n`,
        ),
        obj = [];
      obj[1] = asciiBytes("<< /Type /Catalog /Pages 2 0 R >>");
      obj[2] = asciiBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
      obj[3] = asciiBytes(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(4)} ${ph.toFixed(4)}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
      );
      obj[4] = concatBytes([
        asciiBytes(`<< /Length ${content.length} >>\nstream\n`),
        content,
        asciiBytes("endstream"),
      ]);
      obj[5] = concatBytes([
        asciiBytes(
          `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
        ),
        jpeg,
        asciiBytes("\nendstream"),
      ]);
      const chunks = [asciiBytes("%PDF-1.4\n%PDF\n")],
        off = [0];
      let pos = chunks[0].length;
      for (let i = 1; i <= 5; i++) {
        off[i] = pos;
        const x = concatBytes([
          asciiBytes(i + " 0 obj\n"),
          obj[i],
          asciiBytes("\nendobj\n"),
        ]);
        chunks.push(x);
        pos += x.length;
      }
      let xr = "xref\n0 6\n0000000000 65535 f \n";
      for (let i = 1; i <= 5; i++)
        xr += String(off[i]).padStart(10, "0") + " 00000 n \n";
      xr += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
      chunks.push(asciiBytes(xr));
      return concatBytes(chunks);
    }
    function safeFileName() {
      return (
        (autoTitle()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "") || "Bitacora_semanal") + ".pdf"
      );
    }
    function isMobileLike() {
      return (
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
        matchMedia("(max-width: 720px) and (pointer: coarse)").matches
      );
    }
    async function deliverPdf(blob, name) {
      const file = new File([blob], name, { type: "application/pdf" });
      if (
        isMobileLike() &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Bitácora semanal",
            text: "PDF de la bitácora semanal",
          });
          return "shared";
        } catch (err) {
          if (err && err.name === "AbortError") return "cancelled";
        }
      }
      const url = URL.createObjectURL(blob);
      if (isMobileLike()) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Abrir PDF";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return "opened";
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      return "downloaded";
    }
    function showDeliveryTips() {
      const d = $("#deliveryDialog");
      if (!d) return;
      if (typeof d.showModal === "function") {
        if (!d.open)
          requestAnimationFrame(() => {
            if (!d.open) d.showModal();
          });
      } else {
        alert(
          "PDF listo. Recomendación: imprime 3 copias, reúne las firmas y utiliza preferentemente tinta azul. No se permiten firmas digitales: las firmas deben ser autógrafas. Si aún no tienes una firma definida, puedes escribir tu nombre completo.",
        );
      }
    }
    function canvasToJpegBytes(canvas, quality = 0.96) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error("No se pudo generar la imagen del PDF."));
              return;
            }
            try {
              resolve(new Uint8Array(await blob.arrayBuffer()));
            } catch (err) {
              reject(err);
            }
          },
          "image/jpeg",
          quality,
        );
      });
    }
    async function downloadPdf() {
      if (!checkIdentity()) return;
      const check = validateWeekEntries();
      if (!check.ok) {
        showGuardAlert(check.title, check.message);
        return;
      }
      if (!(await confirmShortNames("all"))) return;
      const m = buildPageModel();
      if (!m.fits) {
        showGuardAlert(
          "La semana no cabe en una hoja",
          "Reduce un poco el texto antes de exportar.",
        );
        return;
      }
      const saved = persistRecord(collectRecord(), true);
      const b = $("#pdfBtn"),
        mb = $("#mobilePdf"),
        old = b.textContent,
        oldm = mb.textContent;
      b.disabled = mb.disabled = true;
      b.textContent = mb.textContent = "Generando…";
      try {
        const canvas = document.createElement("canvas");
        drawPdfPage(canvas, 11.81);
        const jpeg = await canvasToJpegBytes(canvas, 0.96),
          bytes = createPdf(jpeg, canvas.width, canvas.height),
          blob = new Blob([bytes], { type: "application/pdf" });
        canvas.width = 1;
        canvas.height = 1;
        const delivered = await deliverPdf(blob, safeFileName());
        if (delivered !== "cancelled" && saved) showDeliveryTips();
      } catch (err) {
        console.error(err);
        notify(
          "error",
          "No se pudo generar el PDF",
          "Vuelve a intentarlo. Tu bitácora sigue aquí.",
        );
      } finally {
        b.textContent = old;
        mb.textContent = oldm;
        b.disabled = mb.disabled = false;
      }
    }
    function restoreAuthorities() {
      fillIdentity({
        ...DEFAULTS,
        student: $("#student").value,
        company: $("#company").value,
        specialty: $("#specialty").value,
        semester: $("#semester").value,
        group: $("#group").value,
      });
      markDirty();
      updatePreview();
    }
    function configureMobileLabels() {
      if (!isMobileLike()) return;
      $("#pdfBtn").textContent = "Guardar PDF";
      $("#mobilePdf").textContent = "Compartir / guardar PDF";
    }
    function attachEvents() {
      $("#guardConfirm")?.addEventListener("click", () => settleGuard(true));
      $("#guardCancel")?.addEventListener("click", () => settleGuard(false));
      $("#guardDialog")?.addEventListener("cancel", (e) => {
        e.preventDefault();
        settleGuard(false);
      });
      $("#statusClose")?.addEventListener("click", () =>
        $("#statusDialog")?.close(),
      );
      $("#statusDialog")?.addEventListener("cancel", () =>
        $("#statusDialog")?.close(),
      );
      $("#newBtn").onclick = newBlank;
      $("#saveBtn").onclick = saveRecord;
      $("#pdfBtn").onclick = downloadPdf;
      $("#mobilePdf").onclick = downloadPdf;
      $("#mobileSave").onclick = saveRecord;
      $("#weekBtn").onclick = generateWeek;
      $("#addDayBtn").onclick = () => {
        if (entries.length >= MAX_DAYS) {
          showGuardAlert(
            "Máximo de 4 días",
            "La bitácora debe contener exactamente cuatro jornadas. No puedes agregar una quinta.",
          );
          return;
        }
        entries.push(blankEntry());
        renderDays();
        markDirty();
        updatePreview();
      };
      $("#markdown").onchange = () => {
        markDirty();
        updatePreview();
      };
      $("#instructorPreset").onchange = applyInstructorPreset;
      $("#instructorEnabled").onchange = () => {
        setInstructorEnabledUI();
        markDirty();
        updatePreview();
      };
      [
        "student",
        "company",
        "school",
        "specialty",
        "semester",
        "group",
        "weekDate",
        "defaultStart",
        "defaultEnd",
        "voboName",
        "voboRole",
        "autorizoName",
        "autorizoRole",
        "instructorName",
        "instructorRoleMain",
        "instructorNote",
      ].forEach((id) => {
        const el = $("#" + id);
        el.addEventListener("input", () => {
          markDirty();
          updatePreview();
        });
        el.addEventListener("change", () => {
          markDirty();
          updatePreview();
        });
      });
      let profileTimer;
      $("#student").addEventListener("input", () => {
        clearTimeout(profileTimer);
        profileTimer = setTimeout(() => rememberName($("#student").value), 400);
        $("#elaboroName").value = $("#student").value.trim();
      });
      $("#company").addEventListener("change", () => {
        syncCompanyContext(true);
        const company = companies.find((c) => c.name === $("#company").value);
        if (company?.representatives?.length === 1) {
          $("#autorizoName").value = company.representatives[0].name;
          $("#autorizoRole").value = company.representatives[0].role;
        }
        markDirty();
        updatePreview();
      });
      $("#restoreBtn").onclick = restoreAuthorities;
      $("#backupBtn").onclick = exportBackup;
      $("#importFile").onchange = (e) => {
        const f = e.target.files?.[0];
        if (f) importBackup(f);
        e.target.value = "";
      };
      $("#resetBtn").onclick = () => {
        if (
          confirm(
            "Esto dejará únicamente el registro de la Semana 1. ¿Continuar?",
          )
        ) {
          writeStore([SEED]);
          localStorage.setItem(SEEDED_KEY, "1");
          renderRecords();
          newBlank();
        }
      };
      $("#deliveryClose").onclick = () => $("#deliveryDialog").close();
      window.addEventListener("pagehide", saveDraftNow);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") saveDraftNow();
      });
    }
    function setOptions(id, values) {
      const el = $("#" + id),
        previous = el.value;
      el.replaceChildren(...values.map((value) => new Option(value, value)));
      if (values.includes(previous)) el.value = previous;
    }
    function configureSchool(reset) {
      const school =
        schools.find((s) => s.name === $("#school").value) || schools[0];
      setOptions("specialty", school.specialties);
      setOptions("semester", school.semesters);
      setOptions("group", school.groups);
      if (reset) {
        $("#voboName").value = school.voboName;
        $("#voboRole").value = school.voboRole;
        $("#elaboroRole").value =
          "Alumno de Educación Dual\n" + signatureName(school);
      }
    }
    function configureCatalogs() {
      setOptions(
        "school",
        schools.map((s) => s.name),
      );
      setOptions("company", ["", ...companies.map((c) => c.name)]);
      $("#company").options[0].textContent = "Selecciona una empresa";
      $("#school").addEventListener("change", () => {
        configureSchool(true);
        markDirty();
        updatePreview();
      });
    }
    function init() {
      configureCatalogs();
      populateInstructorSelect();
      ensureSeed();
      renderRecords();
      attachEvents();
      configureMobileLabels();
      logoImage = new Image();
      logoImage.onload = updatePreview;
      logoImage.src = "Assets/Edu.png";
      if (!restoreDraft()) newBlank(false);
      initializeProfile($("#student").value);
    }
    init();
  })();
}
