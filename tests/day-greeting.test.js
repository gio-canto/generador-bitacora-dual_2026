import {describe,it,expect,vi,afterEach} from "vitest";
import {greetingForHour,currentGreeting} from "../src/services/day-greeting.js";

afterEach(()=>vi.useRealTimers());

describe("Saludo dinámico del Inicio móvil",()=>{
  it("usa la mañana entre 05:00 y 11:59",()=>{
    expect(greetingForHour(4)).toBe("Buenas noches");
    expect(greetingForHour(5)).toBe("Buenos días");
    expect(greetingForHour(11)).toBe("Buenos días");
  });
  it("cambia a tarde a las 12:00 y a noche a las 19:00",()=>{
    expect(greetingForHour(12)).toBe("Buenas tardes");
    expect(greetingForHour(18)).toBe("Buenas tardes");
    expect(greetingForHour(19)).toBe("Buenas noches");
    expect(greetingForHour(23)).toBe("Buenas noches");
    expect(greetingForHour(0)).toBe("Buenas noches");
  });
  it("obtiene el saludo desde la hora local del dispositivo",()=>{
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026,9,24,8,15));
    expect(currentGreeting()).toBe("Buenos días");
    vi.setSystemTime(new Date(2026,9,24,15,30));
    expect(currentGreeting()).toBe("Buenas tardes");
    vi.setSystemTime(new Date(2026,9,24,21,10));
    expect(currentGreeting()).toBe("Buenas noches");
  });
});
