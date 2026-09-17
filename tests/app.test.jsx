import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  within,
} from "@testing-library/react";
import App from "../src/App.jsx";
vi.mock("sileo", () => ({
  Toaster: () => null,
  sileo: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    action: vi.fn(),
  },
}));
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it("completa el flujo, detecta errores y guarda una bitácora", () => {
  render(<App />);
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar", exact: true }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar", exact: true }),
  );
  expect(screen.getByText("Escribe tu nombre completo.")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Nombre completo del alumno"), {
    target: { value: "Alumno de Prueba" },
  });
  fireEvent.change(screen.getByLabelText("Empresa receptora"), {
    target: {
      value:
        "Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)",
    },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("Fecha de referencia"), {
    target: { value: "2026-09-17" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generar semana" }));
  for (const field of screen.getAllByLabelText("Actividades realizadas"))
    fireEvent.change(field, {
      target: { value: "Realicé las pruebas del sistema de constancias." },
    });
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar", exact: true }),
  );
  expect(screen.getByLabelText("Nombre de quien autoriza").value).toContain(
    "Karen",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar", exact: true }),
  );
  expect(screen.getByText("Datos completos")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Guardar bitácora" }));
  fireEvent.click(screen.getByRole("button", { name: "Historial" }));
  expect(
    within(screen.getByRole("dialog")).getByText("Alumno de Prueba"),
  ).toBeTruthy();
});
it("conserva el easter egg uwu", () => {
  render(<App />);
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("Nombre completo del alumno"), {
    target: { value: "uwu" },
  });
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByText("Made by furries :3")).toBeTruthy();
});
it("permite editar un catálogo sin modificar la bitácora existente", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Catálogos" }));
  const field = await screen.findByLabelText("Nombre corto del plantel");
  fireEvent.change(field, { target: { value: "CBTis 134 actualizado" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar catálogos" }));
  expect(
    screen.getByRole("option", { name: "CBTis 134 actualizado" }),
  ).toBeTruthy();
});
