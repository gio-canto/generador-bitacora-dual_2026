const MEXICO_TIME_ZONE = "America/Mexico_City";

export const CALENDAR_FLAGS = Object.freeze({
  germany:
    "https://upload.wikimedia.org/wikipedia/commons/b/ba/Flag_of_Germany.svg?utm_source=es.wikipedia.org&utm_campaign=index&utm_content=original",
  mexico:
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg?utm_source=es.wikipedia.org&utm_campaign=index&utm_content=original",
});

export const CALENDAR_IMAGES = Object.freeze({
  halloween:
    "https://upload.wikimedia.org/wikipedia/commons/1/16/Balle-%C3%A0-leunettes_11.jpg",
});

const EVENTS = Object.freeze({
  "01-01": {
    id: "new-year",
    kind: "newyear",
    eyebrow: "1 de enero",
    title: "Nuevo año, nueva bitácora",
    description: ({ year }) =>
      `${year - 1} → ${year}. Comienza un nuevo ciclo de formación dual.`,
  },
  "01-23": {
    id: "mexico-germany-relations",
    kind: "bilateral",
    eyebrow: "México × Alemania",
    title: "23 de enero de 1879",
    anniversaryFrom: 1879,
    description: () =>
      "Fecha histórica de las relaciones México-Alemania.",
  },
  "05-15": {
    id: "teachers-day",
    kind: "teacher",
    eyebrow: "15 de mayo",
    title: "Día del Maestro",
    description: () =>
      "Un reconocimiento a quienes enseñan, orientan y acompañan la formación.",
  },
  "09-01": {
    id: "bbig",
    kind: "germany",
    eyebrow: "Formación profesional alemana",
    title: "BBiG · 1 de septiembre de 1969",
    anniversaryFrom: 1969,
    description: () =>
      "Aniversario de la entrada en vigor de la Ley de Formación Profesional alemana.",
  },
  "09-16": {
    id: "mexican-independence",
    kind: "mexico",
    eyebrow: "16 de septiembre",
    title: "Independencia de México",
    anniversaryFrom: 1810,
    description: () => "Una fecha nacional dentro de la bitácora dual.",
  },
  "10-31": {
    id: "halloween",
    kind: "halloween",
    eyebrow: "31 de octubre",
    title: "Halloween",
    description: () => "Hoy la bitácora se ve un poco distinta.",
  },
  "11-01": {
    id: "day-of-the-dead-1",
    kind: "day-of-the-dead",
    eyebrow: "1 de noviembre",
    title: "Día de Muertos",
    description: () =>
      "Entre cempasúchil y luz, recordamos a quienes siguen presentes en nuestra memoria.",
  },
  "11-02": {
    id: "day-of-the-dead-2",
    kind: "day-of-the-dead",
    eyebrow: "2 de noviembre",
    title: "Día de Muertos",
    description: () =>
      "Una tradición mexicana de memoria, encuentro y homenaje.",
  },
  "11-20": {
    id: "mexican-revolution",
    kind: "revolution",
    eyebrow: "20 de noviembre",
    title: "Revolución Mexicana",
    anniversaryFrom: 1910,
    description: () => "Una pequeña pausa histórica antes de continuar la semana.",
  },
  "12-24": {
    id: "christmas-eve",
    kind: "christmas-eve",
    eyebrow: "24 de diciembre",
    title: "Nochebuena",
    description: () => "La temporada de diciembre también llegó a tu bitácora.",
  },
  "12-25": {
    id: "christmas",
    kind: "christmas",
    eyebrow: "25 de diciembre",
    title: "Navidad",
    description: () => "Un detalle de temporada antes de volver a la bitácora.",
  },
});

function mexicoDateParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function anniversaryFor(year, originYear) {
  if (!Number.isInteger(originYear) || year < originYear) return null;
  const years = year - originYear;
  return {
    years,
    label: `${years}.º aniversario`,
  };
}

function eventFor(parts) {
  const key = `${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const definition = EVENTS[key];
  if (!definition) return null;
  const anniversary = anniversaryFor(parts.year, definition.anniversaryFrom);
  return {
    ...definition,
    anniversary,
    description:
      typeof definition.description === "function"
        ? definition.description({ ...parts, anniversary })
        : definition.description,
  };
}

export function getCalendarState(date = new Date()) {
  const parts = mexicoDateParts(date);
  const monthTheme =
    parts.month === 12 ? "december" : parts.month === 1 ? "january" : null;
  return {
    ...parts,
    isoDate: `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    monthTheme,
    monthDetail:
      parts.month === 1
        ? `${parts.year} · Nuevo año, nueva bitácora`
        : null,
    event: eventFor(parts),
  };
}

function createMonthDetail(state) {
  if (!state.monthDetail) return null;
  const anchor = document.querySelector(".hero-kicker");
  if (!anchor || document.getElementById("calendarMonthDetail")) return null;
  const detail = document.createElement("span");
  detail.id = "calendarMonthDetail";
  detail.className = "calendar-month-detail";
  detail.textContent = state.monthDetail;
  detail.setAttribute("aria-label", state.monthDetail);
  anchor.insertAdjacentElement("afterend", detail);
  return detail;
}

function createJanuaryConfetti() {
  if (document.getElementById("calendarConfetti")) return null;
  const layer = document.createElement("div");
  layer.id = "calendarConfetti";
  layer.className = "calendar-confetti";
  layer.setAttribute("aria-hidden", "true");
  const positions = Array.from({ length: 28 }, (_, index) => ((index * 37) % 97) + 1);
  positions.forEach((left, index) => {
    const piece = document.createElement("span");
    piece.style.setProperty("--confetti-left", `${left}%`);
    piece.style.setProperty("--confetti-delay", `${-(index * 0.41)}s`);
    piece.style.setProperty("--confetti-duration", `${9 + (index % 6) * 1.2}s`);
    piece.style.setProperty("--confetti-size", `${4 + (index % 4) * 2}px`);
    piece.style.setProperty("--confetti-tilt", `${(index * 29) % 180}deg`);
    layer.append(piece);
  });
  document.body.append(layer);
  return layer;
}

function createDecemberSnow() {
  if (document.getElementById("calendarSnow")) return null;
  const layer = document.createElement("div");
  layer.id = "calendarSnow";
  layer.className = "calendar-snow";
  layer.setAttribute("aria-hidden", "true");
  const positions = Array.from({ length: 30 }, (_, index) => ((index * 37) % 97) + 1);
  positions.forEach((left, index) => {
    const flake = document.createElement("span");
    flake.textContent = index % 4 === 0 ? "❄" : index % 3 === 0 ? "✦" : "·";
    flake.style.setProperty("--snow-left", `${left}%`);
    flake.style.setProperty("--snow-delay", `${-(index * 0.47)}s`);
    flake.style.setProperty("--snow-duration", `${8 + (index % 6) * 1.15}s`);
    flake.style.setProperty("--snow-size", `${12 + (index % 4) * 3}px`);
    layer.append(flake);
  });
  document.body.append(layer);
  return layer;
}

function flagsMarkup(includeMexico = true) {
  const mexico = includeMexico
    ? `<img src="${CALENDAR_FLAGS.mexico}" alt="Bandera de México" referrerpolicy="no-referrer">`
    : "";
  return `<div class="calendar-flags">${mexico}<img src="${CALENDAR_FLAGS.germany}" alt="Bandera de Alemania" referrerpolicy="no-referrer"></div>`;
}

function visualMarkup(event, state) {
  switch (event.kind) {
    case "newyear":
      return `<div class="calendar-visual calendar-visual--newyear" aria-hidden="true"><span class="calendar-year-old">${state.year - 1}</span><span class="calendar-year-arrow">→</span><strong>${state.year}</strong></div>`;
    case "bilateral":
      return `<div class="calendar-visual calendar-visual--bilateral">${flagsMarkup(true)}<div class="calendar-bridge" aria-hidden="true"><span>MX</span><i></i><span>DE</span></div></div>`;
    case "teacher":
      return '<div class="calendar-visual calendar-visual--teacher" aria-hidden="true"><div class="teacher-sheet"><i></i><i></i><i></i><span>Gracias, docentes</span></div></div>';
    case "germany":
      return `<div class="calendar-visual calendar-visual--germany">${flagsMarkup(false)}<div class="dual-nodes" aria-hidden="true"><span>Betrieb</span><i></i><span>Berufsschule</span></div></div>`;
    case "mexico":
      return `<div class="calendar-visual calendar-visual--mexico"><img class="calendar-mexico-flag" src="${CALENDAR_FLAGS.mexico}" alt="Bandera de México" referrerpolicy="no-referrer"><strong>16 · 09</strong></div>`;
    case "dual":
      return `<div class="calendar-visual calendar-visual--dual">${flagsMarkup(true)}<div class="dual-nodes" aria-hidden="true"><span>Escuela</span><i></i><span>Empresa</span></div></div>`;
    case "halloween":
      return `<div class="calendar-visual calendar-visual--halloween" aria-hidden="true"><img class="calendar-halloween-photo" src="${CALENDAR_IMAGES.halloween}" alt="" referrerpolicy="no-referrer"><strong>31 / 10</strong></div>`;
    case "day-of-the-dead":
      return '<div class="calendar-visual calendar-visual--day-of-the-dead" aria-hidden="true"><div class="cempasuchil"><i></i><i></i><i></i><i></i><i></i></div><div class="memorial-candle"><span></span></div><strong>1 · 2 XI</strong></div>';
    case "revolution":
      return '<div class="calendar-visual calendar-visual--revolution" aria-hidden="true"><small>ARCHIVO</small><strong>20 · XI</strong><span>1910</span></div>';
    case "christmas-eve":
      return '<div class="calendar-visual calendar-visual--christmas-eve" aria-hidden="true"><i></i><i></i><i></i><strong>24</strong></div>';
    case "christmas":
      return '<div class="calendar-visual calendar-visual--christmas" aria-hidden="true"><div class="gift-box"><i></i><span></span></div><strong>25</strong></div>';
    default:
      return "";
  }
}

function createEventCard(event, state, onDismiss) {
  const host = document.createElement("div");
  host.className = `calendar-easter calendar-easter--${event.kind}`;
  host.setAttribute("role", "status");
  host.setAttribute("aria-live", "polite");

  const card = document.createElement("section");
  card.className = "calendar-easter-card";

  const close = document.createElement("button");
  close.type = "button";
  close.className = "calendar-easter-close";
  close.setAttribute("aria-label", "Cerrar efeméride");
  close.textContent = "×";
  close.addEventListener("click", onDismiss);

  const visual = document.createElement("div");
  visual.innerHTML = visualMarkup(event, state);

  const copy = document.createElement("div");
  copy.className = "calendar-easter-copy";
  const eyebrow = document.createElement("span");
  eyebrow.className = "calendar-easter-eyebrow";
  eyebrow.textContent = event.eyebrow;
  const anniversary = event.anniversary
    ? document.createElement("span")
    : null;
  if (anniversary) {
    anniversary.className = "calendar-easter-anniversary";
    anniversary.textContent = event.anniversary.label;
  }
  const title = document.createElement("h2");
  title.textContent = event.title;
  const description = document.createElement("p");
  description.textContent = event.description;
  copy.append(eyebrow);
  if (anniversary) copy.append(anniversary);
  copy.append(title, description);

  card.append(close, visual, copy);
  host.append(card);
  document.body.append(host);
  return host;
}

function readSeen(storage, key) {
  if (!storage) return false;
  try {
    return storage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSeen(storage, key) {
  if (!storage) return;
  try {
    storage.setItem(key, "1");
  } catch {
    // The effect still works when storage is unavailable.
  }
}

export function startCalendarEasterEggs(options = {}) {
  if (typeof document === "undefined") return () => {};
  const state = getCalendarState(options.now ?? new Date());
  let storage = options.storage;
  if (storage === undefined) {
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
  }

  const created = [];
  if (state.monthTheme) {
    document.body.classList.add(`calendar-season-${state.monthTheme}`);
    if (state.monthTheme === "january") {
      const confetti = createJanuaryConfetti();
      if (confetti) created.push(confetti);
    }
    if (state.monthTheme === "december") {
      const snow = createDecemberSnow();
      if (snow) created.push(snow);
    }
    const detail = createMonthDetail(state);
    if (detail) created.push(detail);
  }

  let timer = 0;
  let eventHost = null;
  const eventClass = state.event ? `calendar-event-${state.event.kind}` : "";
  const dismiss = () => {
    clearTimeout(timer);
    if (!eventHost) return;
    eventHost.classList.remove("show");
    document.body.classList.remove(eventClass);
    const host = eventHost;
    eventHost = null;
    setTimeout(() => host.remove(), 260);
  };

  if (state.event) {
    const seenKey = `bitacora.calendar-easter.v1:${state.isoDate}:${state.event.id}`;
    if (!readSeen(storage, seenKey)) {
      writeSeen(storage, seenKey);
      document.body.classList.add(eventClass);
      eventHost = createEventCard(state.event, state, dismiss);
      const show = () => eventHost?.classList.add("show");
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(show);
      else setTimeout(show, 0);
      timer = setTimeout(dismiss, 10000);
    }
  }

  return () => {
    clearTimeout(timer);
    if (eventHost) eventHost.remove();
    created.forEach((node) => node.remove());
    if (state.monthTheme)
      document.body.classList.remove(`calendar-season-${state.monthTheme}`);
    if (eventClass) document.body.classList.remove(eventClass);
  };
}
