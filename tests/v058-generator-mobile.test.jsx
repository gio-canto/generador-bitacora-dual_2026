import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import App from "../src/App.jsx";
import { GENERATOR_LAYOUT_KEY } from "../src/services/generator-mobile.js";

vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  disconnect() {}
});

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  localStorage.removeItem(GENERATOR_LAYOUT_KEY);
  document.body.classList.remove("generator-mobile-active");
});

describe("v0.58 — generador móvil sin duplicar el escritorio", () => {
  it("comparte el mismo formulario, historial y perfil en las dos vistas", () => {
    localStorage.clear();
    window.matchMedia = vi.fn((query) => ({
      matches: query.includes("max-width: 760px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(<App />);
    const byId = (id) => document.getElementById(id);
    expect(document.body.classList.contains("generator-mobile-active")).toBe(true);
    expect(document.querySelector(".gm-logo")?.getAttribute("src")).toBe("Assets/Asset_logo.png");
    expect(byId("homeHistoryDisclosure")?.parentElement?.id).toBe("gmHistoryTarget");
    expect(byId("profileSlot")?.parentElement?.id).toBe("gmProfileTarget");
    expect(document.querySelectorAll("#student")).toHaveLength(1);
    expect(document.querySelectorAll("#preview")).toHaveLength(1);
    expect(byId("creditsDialog")).toBeTruthy();
    expect(byId("virtualEaster")).toBeTruthy();
    expect(byId("statusDialog")).toBeTruthy();

    fireEvent.click(document.querySelector('.gm-bottom-nav [data-gm-nav="capture"]'));
    expect(document.querySelector(".shell")?.dataset.mobileView).toBe("capture");
    const student = byId("student");
    fireEvent.input(student, { target: { value: "Estudiante de prueba" } });
    fireEvent.click(document.querySelector('.gm-bottom-nav [data-gm-nav="history"]'));
    expect(byId("homeHistoryDisclosure")?.open).toBe(true);
    fireEvent.click(document.querySelector('.gm-bottom-nav [data-gm-nav="more"]'));
    fireEvent.click(document.querySelector('[data-gm-mode="desktop"]'));
    expect(document.body.classList.contains("generator-mobile-active")).toBe(false);
    expect(byId("homeHistoryDisclosure")?.closest(".topbar")).toBeTruthy();
    expect(byId("profileSlot")?.closest(".topbar")).toBeTruthy();
    expect(byId("student")).toBe(student);
    expect(byId("student").value).toBe("Estudiante de prueba");
    expect(localStorage.getItem(GENERATOR_LAYOUT_KEY)).toBe("desktop");
  });

  it("recupera la vista móvil sin reiniciar los datos", () => {
    localStorage.clear();
    render(<App />);
    expect(document.body.classList.contains("generator-mobile-active")).toBe(false);
    const student = document.getElementById("student");
    fireEvent.input(student, { target: { value: "Otro estudiante" } });
    fireEvent.click(document.getElementById("generatorModeBtn"));
    expect(document.body.classList.contains("generator-mobile-active")).toBe(true);
    expect(document.getElementById("student")).toBe(student);
    expect(student.value).toBe("Otro estudiante");
    expect(document.querySelector(".gm-home")?.hidden).toBe(false);
    fireEvent.click(document.querySelector('.gm-bottom-nav [data-gm-nav="profile"]'));
    expect(document.querySelector(".gm-profile")?.hidden).toBe(false);
  });
});
