// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import App from "../src/App.jsx";
import { LIMBO_COMPANY, createMatrixPayload, isLimboMatrixPayload, parseMatrixPayload } from "../src/services/delivery-registry.js";
import { readProfileData, rememberProfile } from "../src/services/profile.js";

vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  disconnect() {}
});
vi.stubGlobal("devicePixelRatio", 1);
Element.prototype.scrollIntoView ||= () => {};

const REAL_COMPANY = "Instituto Tecnológico de Chilpancingo (ITCH)";

afterEach(async () => {
  cleanup();
  localStorage.clear();
  await new Promise((resolve) => setTimeout(resolve, 0));
});

describe("La espera de reubicación es temporal y optativa", () => {
  it("nunca guarda la empresa ficticia en el perfil, incluso si venía de una versión anterior", () => {
    localStorage.clear();
    rememberProfile({ name:"Alumna de Prueba",company:REAL_COMPANY });
    rememberProfile({ company:LIMBO_COMPANY });
    expect(readProfileData().company).toBe(REAL_COMPANY);
    const state = JSON.parse(localStorage.getItem("bitacora_profiles_v2"));
    expect(state.profiles[state.activeId].company).toBe(REAL_COMPANY);
    state.profiles[state.activeId].company = LIMBO_COMPANY;
    localStorage.setItem("bitacora_profiles_v2", JSON.stringify(state));
    expect(readProfileData().company).toBe("");
  });

  it("pregunta por información adicional: No va a firmas; Sí permite escribir sin cambiar el perfil", async () => {
    localStorage.clear();
    localStorage.setItem("bitacora_dual_onboarding_v3","skipped");
    rememberProfile({ name:"Alumna de Prueba",company:REAL_COMPANY });
    render(<App />);
    const $ = (id) => document.getElementById(id);
    const panel = (step) => document.querySelector(`.step-panel[data-step="${step}"]`);
    await waitFor(() => expect($("company")?.value).toBe(REAL_COMPANY));
    fireEvent.click(panel(0).querySelector(".wizard-next"));
    await waitFor(() => expect(panel(1).classList.contains("active")).toBe(true));
    fireEvent.change($("company"),{target:{value:LIMBO_COMPANY}});
    await waitFor(() => expect(panel(2).classList.contains("active")).toBe(true));
    expect(readProfileData().company).toBe(REAL_COMPANY);
    expect($("waitingNotes").hidden).toBe(true);

    fireEvent.change($("weekDate"),{target:{value:"2026-11-10"}});
    await waitFor(() => expect($("guardTitle")?.textContent).toContain("registrar algo"));
    expect($("guardCancel").textContent).toContain("No, ir a firmas");
    fireEvent.click($("guardCancel"));
    await waitFor(() => expect(panel(3).classList.contains("active")).toBe(true));
    expect($("waitingNotes").hidden).toBe(true);
    expect(document.querySelectorAll('#days [data-key="activity"]')).toHaveLength(4);

    // Regresa a elegir otra semana: ahora responde que sí.
    fireEvent.click(panel(3).querySelector(".wizard-prev"));
    await waitFor(() => expect(panel(2).classList.contains("active")).toBe(true));
    fireEvent.change($("weekDate"),{target:{value:"2026-11-17"}});
    await waitFor(() => expect($("guardTitle")?.textContent).toContain("registrar algo"));
    fireEvent.click($("guardConfirm"));
    await waitFor(() => expect($("waitingNotes").hidden).toBe(false));
    const notes = document.querySelectorAll("#waitingNotesFields textarea");
    expect(notes).toHaveLength(4);
    fireEvent.input(notes[0],{
      target:{value:"Acudí al plantel para solicitar información sobre mi nueva asignación."},
    });
    expect(notes[0].value).toContain("Acudí al plantel");
    fireEvent.click(panel(2).querySelector(".wizard-next"));
    await waitFor(() => expect(panel(3).classList.contains("active")).toBe(true));
    expect(readProfileData().company).toBe(REAL_COMPANY);

    const code = createMatrixPayload({
      student:"Alumna de Prueba",specialty:"Programación",
      company:LIMBO_COMPANY,
      startDate:"2026-11-17",endDate:"2026-11-20",
    });
    expect(isLimboMatrixPayload(parseMatrixPayload(code))).toBe(true);

    fireEvent.click($("newBtn"));
    expect($("company").value).toBe(REAL_COMPANY);
    expect($("waitingNotes").hidden).toBe(true);
  });
});
