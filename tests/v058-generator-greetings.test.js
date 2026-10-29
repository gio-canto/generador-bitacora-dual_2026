import { describe, expect, it } from "vitest";
import { getGeneratorGreeting } from "../src/services/generator-greeting.js";

const hour = (hh, mm = 0) => new Date(2026, 9, 29, hh, mm);

describe("v0.58 · Saludo según hora local", () => {
  it("muestra el saludo especial exclusivamente de 01:00 a 04:59", () => {
    expect(getGeneratorGreeting(hour(0, 59)).title).toBe("Buenas noches");
    expect(getGeneratorGreeting(hour(1, 0)).title).toBe("¿Qué haces aquí? ¡Duérmete!");
    expect(getGeneratorGreeting(hour(4, 59)).kind).toBe("sleep");
    expect(getGeneratorGreeting(hour(5, 0)).title).toBe("Buenos días");
  });
  it("distingue mañana, tarde y noche en las horas límite", () => {
    expect(getGeneratorGreeting(hour(11, 59)).title).toBe("Buenos días");
    expect(getGeneratorGreeting(hour(12, 0)).title).toBe("Buenas tardes");
    expect(getGeneratorGreeting(hour(18, 59)).title).toBe("Buenas tardes");
    expect(getGeneratorGreeting(hour(19, 0)).title).toBe("Buenas noches");
    expect(getGeneratorGreeting(hour(23, 59)).title).toBe("Buenas noches");
  });
  it("regresa títulos y textos accesibles incluso a altas horas", () => {
    for (let h = 0; h < 24; h++) {
      const greeting = getGeneratorGreeting(hour(h));
      expect(greeting.title.length).toBeGreaterThan(4);
      expect(greeting.subtitle.length).toBeGreaterThan(10);
    }
  });
});
