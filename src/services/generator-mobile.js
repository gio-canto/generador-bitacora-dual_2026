/**
 * v0.58 — Adaptive Glass presentation for the existing generator.
 * IMPORTANT: never clone a form field, step panel, profile or saved record.
 * Both presentations own exactly the same editor DOM and storage.
 */
import { getGeneratorGreeting } from "./generator-greeting.js";
import { startGeneratorMobileAvatar } from "../components/GeneratorMobileAvatar.jsx";

export const GENERATOR_LAYOUT_KEY = "bitacora_dual_generator_layout_v1";
export const GENERATOR_LAYOUTS = ["auto", "mobile", "desktop"];
const VIEW_NAMES = ["home", "capture", "history", "profile", "more"];

function preferredLayout() {
  try {
    const value = localStorage.getItem(GENERATOR_LAYOUT_KEY);
    return GENERATOR_LAYOUTS.includes(value) ? value : "auto";
  } catch {
    return "auto";
  }
}
function currentBreakpoint() {
  return typeof matchMedia === "function"
    ? matchMedia("(max-width: 760px)")
    : { matches: typeof innerWidth === "number" && innerWidth <= 760 };
}
function safeWriteLayout(layout) {
  try { localStorage.setItem(GENERATOR_LAYOUT_KEY, layout); } catch {}
}
function displayDate(value, index) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return `Día ${index + 1}`;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric" }).format(date);
}

export function startGeneratorMobile() {
  const shell = document.querySelector(".shell");
  const mobile = document.getElementById("generatorMobileUi");
  if (!shell || !mobile) return () => {};

  const history = document.getElementById("homeHistoryDisclosure");
  const profile = document.getElementById("profileSlot");
  const historyTarget = document.getElementById("gmHistoryTarget");
  const profileTarget = document.getElementById("gmProfileTarget");
  // Moving these *same nodes* keeps React's profile root, legacy event handlers,
  // and the saved-record renderer attached. Never use innerHTML to copy them.
  const slots = [history, profile].filter(Boolean).map((element) => {
    const anchor = document.createComment("generator mobile original position");
    element.parentNode.insertBefore(anchor, element);
    return { element, anchor };
  });
  let layout = preferredLayout();
  const breakpoint = currentBreakpoint();
  let active = false;
  let view = "home";
  let chosenDay = 0;
  const stopAvatar = startGeneratorMobileAvatar();

  // The welcome is local to this device and refreshes at midnight, on focus
  // and after returning from a suspended PWA. Never persist the time/message.
  function updateGreeting() {
    const greeting = getGeneratorGreeting();
    const heading = document.getElementById("gmHomeTitle");
    const description = document.getElementById("gmGreetingDescription");
    const home = mobile.querySelector(".gm-home");
    if (heading) heading.textContent = greeting.title;
    if (description) description.textContent = greeting.subtitle;
    if (home) home.dataset.greeting = greeting.kind;
  }
  updateGreeting();
  const greetingTimer = window.setInterval(updateGreeting, 60000);
  const onVisible = () => { if (!document.hidden) updateGreeting(); };
  window.addEventListener("focus", updateGreeting);
  document.addEventListener("visibilitychange", onVisible);

  const query = (selector) => document.querySelector(selector);
  const dayHost = document.getElementById("days");
  const dayTabs = document.getElementById("generatorMobileDayTabs");
  const updateProgress = () => {
    const percent = document.getElementById("wizardPct")?.textContent || "20%";
    const number = Number.parseInt(percent, 10) || 20;
    const step = Math.max(1, Math.min(5, Math.round(number / 20)));
    const pct = mobile.querySelector("#gmProgressPercentage");
    const label = mobile.querySelector("#gmProgressStep");
    const bar = mobile.querySelector("#gmProgressBar");
    if (pct) pct.textContent = percent;
    if (label) label.textContent = `Paso ${step} de 5 · ${["Datos escolares", "Alumno y empresa", "Semana", "Responsables", "Revisión y PDF"][step - 1]}`;
    if (bar) bar.style.width = `${number}%`;
    const title = mobile.querySelector("#gmDraftStatus");
    const saved = document.getElementById("saveState")?.textContent?.trim();
    if (title) title.textContent = saved || "Borrador de bitácora";
  };
  const progressObserver = new MutationObserver(updateProgress);
  const stepPercent = document.getElementById("wizardPct");
  if (stepPercent) progressObserver.observe(stepPercent, { childList: true, characterData: true, subtree: true });
  const saveState = document.getElementById("saveState");
  if (saveState) progressObserver.observe(saveState, { childList: true, characterData: true, subtree: true });

  function updateDayTabs() {
    if (!dayHost || !dayTabs) return;
    const days = [...dayHost.querySelectorAll(":scope > .day-card")];
    dayTabs.replaceChildren();
    if (!days.length) {
      dayTabs.hidden = true;
      return;
    }
    dayTabs.hidden = !active;
    chosenDay = Math.max(0, Math.min(chosenDay, days.length - 1));
    days.forEach((card, index) => {
      card.classList.toggle("gm-selected-day", index === chosenDay);
      const date = card.querySelector('input[data-key="date"]')?.value;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gm-day-button" + (index === chosenDay ? " active" : "");
      button.textContent = displayDate(date, index);
      button.setAttribute("aria-pressed", String(index === chosenDay));
      button.addEventListener("click", () => {
        chosenDay = index;
        updateDayTabs();
        const heading = dayTabs.getBoundingClientRect();
        if (heading.top < 72 || heading.top > innerHeight - 120)
          dayTabs.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      dayTabs.append(button);
    });
  }
  const daysObserver = new MutationObserver(updateDayTabs);
  if (dayHost) daysObserver.observe(dayHost, { childList: true });
  const onDayDateChange = (event) => {
    if (event.target?.matches?.('input[data-key="date"]')) updateDayTabs();
  };
  dayHost?.addEventListener("change", onDayDateChange);

  function moveSharedNodes(isMobile) {
    slots.forEach(({ element, anchor }) => {
      const target = element === history ? historyTarget : profileTarget;
      if (isMobile && target && element.parentNode !== target) target.append(element);
      else if (!isMobile && element.parentNode !== anchor.parentNode)
        anchor.parentNode.insertBefore(element, anchor.nextSibling);
    });
  }
  function changeView(next) {
    if (!VIEW_NAMES.includes(next)) return;
    view = next;
    shell.dataset.mobileView = next;
    mobile.querySelectorAll("[data-gm-page]").forEach((page) => {
      page.hidden = page.dataset.gmPage !== next;
    });
    mobile.querySelectorAll("[data-gm-nav]").forEach((button) => {
      const selected = button.dataset.gmNav === next;
      button.classList.toggle("active", selected);
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (next === "history" && history) history.open = true;
    if (next !== "history" && history) history.open = false;
    if (active) window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
  }
  function syncLayout() {
    const next = layout === "mobile" || (layout === "auto" && breakpoint.matches);
    if (next !== active) {
      active = next;
      // Preserve the same editor DOM; only switch its surrounding presentation.
      moveSharedNodes(active);
      document.body.classList.toggle("generator-mobile-active", active);
      window.dispatchEvent(new Event("bitacora-generator-layout"));
      if (!active && history) history.open = false;
    }
    mobile.querySelectorAll("[data-gm-mode]").forEach((button) => {
      const selected = button.dataset.gmMode === layout;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    mobile.setAttribute("aria-hidden", String(!active));
    if (active) changeView(view);
    updateDayTabs();
  }
  function setLayout(next) {
    if (!GENERATOR_LAYOUTS.includes(next)) return;
    layout = next;
    safeWriteLayout(next);
    syncLayout();
  }
  function handleNavigation(event) {
    const button = event.target.closest?.("[data-gm-nav],[data-gm-action],[data-gm-mode]");
    if (!button || !mobile.contains(button)) return;
    if (button.dataset.gmMode) {
      setLayout(button.dataset.gmMode);
      return;
    }
    const target = button.dataset.gmNav;
    if (target) {
      changeView(target);
      return;
    }
    const action = button.dataset.gmAction;
    if (action === "new") {
      changeView("capture");
      document.getElementById("newBtn")?.click();
      chosenDay = 0;
      updateDayTabs();
    } else if (action === "save") document.getElementById("saveBtn")?.click();
    else if (action === "pdf") document.getElementById("pdfBtn")?.click();
    else if (action === "backup") document.getElementById("backupBtn")?.click();
    else if (action === "import") document.getElementById("importFile")?.click();
    else if (action === "tour") document.getElementById("tourBtn")?.click();
    else if (action === "open-profile") {
      changeView("profile");
      profile?.querySelector("details > summary")?.click();
    }
  }
  mobile.addEventListener("click", handleNavigation);
  const desktopModeButton = document.getElementById("generatorModeBtn");
  const onDesktopModeClick = () => { setLayout("mobile"); changeView("home"); };
  desktopModeButton?.addEventListener("click", onDesktopModeClick);
  const onExternalReview = () => { if (active) changeView("capture"); };
  window.addEventListener("bitacora-open-pdf-review", onExternalReview);
  window.addEventListener("bitacora-edit-name", onExternalReview);
  const onStepChange = () => { updateProgress(); if (active) changeView("capture"); };
  window.addEventListener("bitacora-step-change", onStepChange);
  const onBreakpoint = () => { if (layout === "auto") syncLayout(); };
  if (breakpoint.addEventListener) breakpoint.addEventListener("change", onBreakpoint);
  else if (breakpoint.addListener) breakpoint.addListener(onBreakpoint);
  syncLayout();
  changeView("home");
  window.__generatorBoot?.ready?.();
  return () => {
    window.clearInterval(greetingTimer);
    window.removeEventListener("focus", updateGreeting);
    document.removeEventListener("visibilitychange", onVisible);
    stopAvatar?.();
    progressObserver.disconnect();
    daysObserver.disconnect();
    dayHost?.removeEventListener("change", onDayDateChange);
    mobile.removeEventListener("click", handleNavigation);
    desktopModeButton?.removeEventListener("click", onDesktopModeClick);
    window.removeEventListener("bitacora-open-pdf-review", onExternalReview);
    window.removeEventListener("bitacora-edit-name", onExternalReview);
    window.removeEventListener("bitacora-step-change", onStepChange);
    if (breakpoint.removeEventListener) breakpoint.removeEventListener("change", onBreakpoint);
    else if (breakpoint.removeListener) breakpoint.removeListener(onBreakpoint);
    moveSharedNodes(false);
    document.body.classList.remove("generator-mobile-active");
    window.dispatchEvent(new Event("bitacora-generator-layout"));
    delete shell.dataset.mobileView;
  };
}
