import { it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import App from "../src/App.jsx";
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    disconnect() {}
  },
);
vi.stubGlobal("devicePixelRatio", 1);
it("recupera la interfaz original, genera cuatro días y conserva sus herramientas", async () => {
  localStorage.clear();
  render(<App />);
  const $ = (id) => document.getElementById(id);
  expect(document.body.textContent).toContain("Crea tu bitácora");
  expect(document.body.textContent).not.toContain("Guardar catálogos");
  for (const id of [
    "tourBtn",
    "welcomeDialog",
    "guardDialog",
    "statusDialog",
    "deliveryDialog",
    "addDayBtn",
    "records",
    "backupBtn",
    "importFile",
    "restoreBtn",
    "tecnmAutorizoPreset",
  ])
    expect($(id), id).toBeTruthy();
  fireEvent.input($("student"), { target: { value: "Alumno de Prueba" } });
  fireEvent.change($("company"), {
    target: { value: "Instituto Tecnológico de Chilpancingo (ITCH)" },
  });
  expect($("defaultStart").value).toBe("08:00");
  expect($("tecnmAutorizoPreset").options.length).toBeGreaterThan(20);
  fireEvent.change($("weekDate"), { target: { value: "2026-09-17" } });
  fireEvent.click($("weekBtn"));
  expect(document.querySelectorAll("#days .day-card").length).toBe(4);
  fireEvent.click($("addDayBtn"));
  expect($("guardTitle").textContent).toBe("Máximo de 4 días");
  fireEvent.click($("guardConfirm"));
  window.dispatchEvent(new Event("pagehide"));
  const draft = JSON.parse(localStorage.getItem("bitacora_dual_draft_v1"));
  expect(draft.entries.map((e) => e.date)).toEqual([
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
  ]);
  expect(draft.identity.student).toBe("Alumno de Prueba");
  expect(draft.entries[0].start).toBe("08:00");
});
