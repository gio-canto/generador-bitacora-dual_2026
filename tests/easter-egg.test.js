import { it, expect, vi } from "vitest";
import { startEasterEgg } from "../src/legacy/easter-egg.js";
it("ejecuta Virtual Insanity desde el nombre y devuelve la página a los créditos", () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "Audio",
    class {
      play() {
        return Promise.resolve();
      }
      pause() {}
      load() {}
      removeAttribute() {}
      addEventListener() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  window.scrollTo = vi.fn();
  document.body.innerHTML =
    '<div class="shell"><input id="student"></div><div id="virtualEaster" hidden></div><dialog id="creditsDialog"></dialog><button id="virtualStop" hidden></button>';
  startEasterEgg();
  const student = document.getElementById("student");
  student.value = "jamiroquai";
  student.dispatchEvent(new Event("input", { bubbles: true }));
  expect(document.body.classList.contains("virtual-insanity-running")).toBe(
    true,
  );
  expect(document.getElementById("virtualStop").hidden).toBe(false);
  document.getElementById("virtualStop").click();
  vi.advanceTimersByTime(3000);
  expect(document.body.classList.contains("virtual-insanity-running")).toBe(
    false,
  );
  expect(document.querySelector(".shell").style.transform).toBe("");
  expect(document.getElementById("creditsDialog").open).toBe(true);
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
