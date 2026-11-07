import { afterEach, expect, fireEvent, it, vi, waitFor } from "vitest";
import { cleanup, render } from "@testing-library/react";
import App from "../src/App.jsx";
import { Profile } from "../src/components/Profile.jsx";
import companies from "../src/data/companies.json";
import { readProfileData, rememberProfile } from "../src/services/profile.js";

vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  disconnect() {}
});
vi.stubGlobal("devicePixelRatio", 1);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const council = companies.find((item) => item.shortName === "COCYTIEG");
const $ = (id) => document.getElementById(id);

it("0.61.1 · despliega el catálogo como selección, permite otra área y aplica la semana", async () => {
  localStorage.clear();
  render(<App />);
  await waitFor(() => expect($("weekBtn")).toBeTruthy());
  if ($("welcomeDialog")?.open) {
    fireEvent.click($("firstTimeYes"));
    if ($("tourSkip")) fireEvent.click($("tourSkip"));
  }

  fireEvent.change($("company"), { target: { value: council.name } });
  fireEvent.change($("weekDate"), { target: { value: "2026-09-15" } });
  fireEvent.click($("weekBtn"));
  await waitFor(() => expect(document.querySelectorAll("#days .day-card")).toHaveLength(4));

  const select = () => document.querySelector('[data-area-preset="0"]');
  expect(select()?.tagName).toBe("SELECT");
  expect(document.querySelector("#days datalist")).toBeNull();
  expect(document.querySelector("#days [data-area-all]")).toBeNull();
  expect([...select().options].map((option) => option.textContent)).toContain("Departamento de Archivo");
  expect([...select().options].map((option) => option.textContent)).toContain("Aplicar esta área a toda la semana");

  fireEvent.change(select(), { target: { value: "__custom_area__" } });
  const customInput = () => document.querySelector('input[data-index="0"][data-key="area"]');
  expect(customInput()).toBeTruthy();
  expect(document.querySelector('[data-area-preset="0"]')).toBeNull();
  expect(customInput().closest(".area-picker-control")).toBeTruthy();

  fireEvent.input(customInput(), { target: { value: "Archivo técnico" } });
  expect(customInput().value).toBe("Archivo técnico");
  fireEvent.click(document.querySelector('[data-area-options="0"]'));
  expect(select().value).toBe("__saved_custom_area__");

  fireEvent.change(select(), { target: { value: "Departamento de Archivo" } });
  expect(select().value).toBe("Departamento de Archivo");
  fireEvent.change(select(), { target: { value: "__apply_area_to_week__" } });
  await waitFor(() => expect($("guardDialog").open).toBe(true));
  fireEvent.click($("guardConfirm"));
  await waitFor(() => {
    expect([...document.querySelectorAll('[data-area-preset]')].map((item) => item.value))
      .toEqual(Array(4).fill("Departamento de Archivo"));
  });
});

it("0.61.1 · en perfil conserva un área personalizada al volver a las opciones", async () => {
  localStorage.clear();
  rememberProfile({
    name: "Alumno de Prueba",
    company: council.name,
    area: "Departamento de Archivo",
    defaultStart: "10:00",
    defaultEnd: "14:00",
    instructor: { enabled: false },
  });

  render(<Profile />);
  fireEvent.click(document.querySelector(".profile-text-button"));
  await waitFor(() => expect($("profileArea")).toBeTruthy());
  expect($("profileArea").tagName).toBe("SELECT");
  fireEvent.change($("profileArea"), { target: { value: "__custom_area__" } });
  expect($("profileAreaCustom")).toBeTruthy();
  fireEvent.input($("profileAreaCustom"), { target: { value: "Archivo técnico" } });
  fireEvent.click(document.querySelector(".profile-area-field .area-picker-back"));
  expect($("profileArea").value).toBe("__saved_custom_area__");
  fireEvent.change($("profileArea"), { target: { value: "__custom_area__" } });
  expect($("profileAreaCustom").value).toBe("Archivo técnico");

  fireEvent.click($("profileSave"));
  expect(readProfileData().area).toBe("Archivo técnico");
});
