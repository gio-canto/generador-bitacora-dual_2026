export function startEasterEgg() {
  (() => {
    "use strict";
    const AUDIO_SRC = "Assets/Asset_vt_in_nocy.mp3";
    const shell = document.querySelector(".shell"),
      overlay = document.getElementById("virtualEaster"),
      student = document.getElementById("student"),
      credits = document.getElementById("creditsDialog");
    if (!shell || !overlay || !student) return;
    const normalize = (value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    const easeInOut = (t) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    let active = false,
      finishing = false,
      raf = 0,
      audio = null,
      safetyTimer = 0,
      finaleTimer = 0,
      saved = null,
      studentArmed = true,
      weekArmed = true,
      motionStart = 0,
      motionDuration = 12000;

    function restorePosition() {
      if (!saved) return;
      window.scrollTo({
        left: saved.scrollX,
        top: saved.scrollY,
        behavior: "auto",
      });
    }
    function restoreFocus() {
      if (!saved) return;
      const el = saved.focus;
      if (el && el.isConnected) {
        try {
          el.focus({ preventScroll: true });
        } catch {
          try {
            el.focus();
          } catch {}
        }
        if (
          typeof saved.selectionStart === "number" &&
          typeof el.setSelectionRange === "function"
        ) {
          try {
            el.setSelectionRange(saved.selectionStart, saved.selectionEnd);
          } catch {}
        }
      }
    }
    function finishEverything() {
      restorePosition();
      restoreFocus();
      saved = null;
    }
    function showClassicCredits() {
      active = false;
      finishing = false;
      if (credits && !credits.open) {
        credits.addEventListener("close", finishEverything, { once: true });
        credits.showModal();
      } else finishEverything();
    }
    function restoreVisualAndContinue() {
      overlay.classList.remove("show");
      setTimeout(() => {
        overlay.hidden = true;
        shell.style.transform = saved?.transform || "";
        shell.style.transition = saved?.transition || "";
        shell.style.willChange = saved?.willChange || "";
        document.documentElement.style.overflowX = saved?.htmlOverflowX || "";
        document.body.classList.remove("virtual-insanity-running");
        restorePosition();
        showClassicCredits();
      }, 430);
    }
    function finale() {
      if (!active || finishing) return;
      finishing = true;
      clearTimeout(safetyTimer);
      cancelAnimationFrame(raf);
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        try {
          audio.load();
        } catch {}
        audio = null;
      }
      shell.style.transition = "transform 1.15s cubic-bezier(.22,1,.36,1)";
      shell.style.transform = "translate3d(0,0,0)";
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add("show"));
      finaleTimer = setTimeout(restoreVisualAndContinue, 2500);
    }
    function animate(now) {
      if (!active || finishing) return;
      const elapsed = now - motionStart;
      const p = Math.min(1, elapsed / motionDuration);
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const exitX = -(saved.shellRight + Math.max(96, innerWidth * 0.08));
      let x = 0;
      if (reduced) {
        x = 0;
      } else if (p < 0.58) {
        x = exitX * easeInOut(p / 0.58);
      } else if (p < 0.72) {
        x = exitX;
      } else {
        x = exitX * (1 - easeInOut((p - 0.72) / 0.28));
      }
      shell.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      if (p < 1) raf = requestAnimationFrame(animate);
      else finale();
    }
    function trigger() {
      if (active) return;
      active = true;
      finishing = false;
      clearTimeout(finaleTimer);
      const focus = document.activeElement,
        rect = shell.getBoundingClientRect();
      saved = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        focus,
        selectionStart:
          typeof focus?.selectionStart === "number"
            ? focus.selectionStart
            : null,
        selectionEnd:
          typeof focus?.selectionEnd === "number" ? focus.selectionEnd : null,
        transform: shell.style.transform,
        transition: shell.style.transition,
        willChange: shell.style.willChange,
        htmlOverflowX: document.documentElement.style.overflowX,
        shellRight: rect.right,
      };
      document.documentElement.style.overflowX = "hidden";
      document.body.classList.add("virtual-insanity-running");
      shell.style.transition = "none";
      shell.style.willChange = "transform";
      motionDuration = 12000;
      motionStart = performance.now();
      audio = new Audio(AUDIO_SRC);
      audio.preload = "auto";
      audio.volume = 0.88;
      audio.addEventListener(
        "loadedmetadata",
        () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            motionDuration = Math.max(
              8000,
              Math.min(18000, audio.duration * 900),
            );
          }
        },
        { once: true },
      );
      audio.play().catch(() => {});
      raf = requestAnimationFrame(animate);
      safetyTimer = setTimeout(finale, 22000);
    }
    student.addEventListener("input", () => {
      const hit = normalize(student.value) === "jamiroquai";
      if (hit && studentArmed) trigger();
      studentArmed = !hit;
    });
    document.addEventListener("input", (event) => {
      if (!event.target.matches?.('#days textarea[data-key="activity"]'))
        return;
      const hit = [
        ...document.querySelectorAll('#days textarea[data-key="activity"]'),
      ].some((el) => normalize(el.value).includes("virtual insanity"));
      if (hit && weekArmed) trigger();
      weekArmed = !hit;
    });
    document.addEventListener("keydown", (event) => {
      if (active && event.key === "Escape") finale();
    });
  })();
}
