import { it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
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
  await waitFor(()=>expect($("welcomeDialog").open).toBe(true));
  expect($("welcomeDialog").textContent).toContain("¿Ya le sabes?");
  fireEvent.click($("firstTimeYes"));
  expect($("tourLayer").hidden).toBe(false);
  fireEvent.click($("tourSkip"));
  expect(localStorage.getItem("bitacora_dual_onboarding_v3")).toBe("skipped");
  expect($("profileSlot").closest(".topbar")).toBeTruthy();
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
  expect($("weekError").textContent).toContain("El primer día debe ser martes");
  expect(document.querySelectorAll("#days .day-card")).toHaveLength(0);
  fireEvent.change($("weekDate"), { target: { value: "2026-09-15" } });
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
  expect($("markdown").checked).toBe(true);
  expect($("markdown").closest("details").open).toBe(false);
  expect($("historyDisclosure").open).toBe(false);
  expect($("backupDisclosure").open).toBe(false);
  fireEvent.change($("company"), {
    target: {
      value:
        "Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)",
    },
  });
  expect($("instructorEnabled").checked).toBe(true);
  expect($("autorizoName").value).toContain("Karen Paulina");
  fireEvent.click($("instructorEnabled"));
  window.dispatchEvent(new Event("pagehide"));
  expect(
    JSON.parse(localStorage.getItem("bitacora_dual_draft_v1")).identity
      .instructor.enabled,
  ).toBe(false);
  fireEvent.input($("student"), { target: { value: "uwu" } });
  expect($("creditsDialog").open).toBe(true);
  fireEvent.click($("creditsClose"));
  expect($("creditsDialog").open).toBe(false);
  fireEvent.input($("student"),{target:{value:"Alumno de Prueba"}});
  for(const field of document.querySelectorAll('#days textarea[data-key="activity"]'))fireEvent.input(field,{target:{value:"Revisé los datos del sistema y corregí errores."}});
  vi.spyOn(HTMLCanvasElement.prototype,"toBlob").mockImplementation(callback=>callback({arrayBuffer:async()=>new ArrayBuffer(4)}));
  URL.createObjectURL=vi.fn(()=>"blob:test");URL.revokeObjectURL=vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
  const before=JSON.parse(localStorage.getItem("bitacora_dual_clean_v3")).length;
  fireEvent.click($("pdfBtn"));
  await waitFor(()=>expect(JSON.parse(localStorage.getItem("bitacora_dual_clean_v3"))).toHaveLength(before+1));
  await waitFor(()=>expect($("pdfBtn").disabled).toBe(false));
  fireEvent.click($("pdfBtn"));
  await waitFor(()=>expect($("pdfBtn").disabled).toBe(false));
  expect(JSON.parse(localStorage.getItem("bitacora_dual_clean_v3"))).toHaveLength(before+1);
  expect($("saveState").textContent).toBe("Guardado");
});
