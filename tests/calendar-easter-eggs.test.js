import { describe, expect, it } from "vitest";
import {
  CALENDAR_FLAGS,
  getCalendarState,
  startCalendarEasterEggs,
} from "../src/services/calendar-easter-eggs.js";

const midday = (iso) => new Date(`${iso}T18:00:00Z`);

describe("efemérides del calendario", () => {
  it("mantiene Nuevo año, nueva bitácora durante todo enero con el año actual", () => {
    const state2027 = getCalendarState(midday("2027-01-15"));
    const state2028 = getCalendarState(midday("2028-01-15"));
    expect(state2027.monthTheme).toBe("january");
    expect(state2027.monthDetail).toBe("2027 · Nuevo año, nueva bitácora");
    expect(state2028.monthDetail).toBe("2028 · Nuevo año, nueva bitácora");
    expect(state2027.event).toBeNull();
  });

  it("activa el cambio de año el 1 de enero", () => {
    const state = getCalendarState(midday("2027-01-01"));
    expect(state.event?.id).toBe("new-year");
    expect(state.event?.description).toContain("2026 → 2027");
  });

  it("mantiene la ambientación de diciembre todo el mes", () => {
    expect(getCalendarState(midday("2027-12-03")).monthTheme).toBe("december");
    expect(getCalendarState(midday("2027-12-24")).event?.id).toBe(
      "christmas-eve",
    );
    expect(getCalendarState(midday("2027-12-25")).event?.id).toBe("christmas");
  });

  it.each([
    ["2027-01-23", "mexico-germany-relations"],
    ["2027-05-15", "teachers-day"],
    ["2027-09-01", "bbig"],
    ["2027-09-16", "mexican-independence"],
    ["2027-10-31", "halloween"],
    ["2027-11-01", "day-of-the-dead-1"],
    ["2027-11-02", "day-of-the-dead-2"],
    ["2027-11-20", "mexican-revolution"],
  ])("activa %s correctamente", (iso, id) => {
    expect(getCalendarState(midday(iso)).event?.id).toBe(id);
  });

  it("calcula automáticamente los aniversarios según el año actual", () => {
    expect(
      getCalendarState(midday("2027-01-23")).event?.anniversary,
    ).toEqual({ years: 148, label: "148.º aniversario" });
    expect(
      getCalendarState(midday("2027-09-01")).event?.anniversary,
    ).toEqual({ years: 58, label: "58.º aniversario" });
    expect(
      getCalendarState(midday("2028-09-01")).event?.anniversary,
    ).toEqual({ years: 59, label: "59.º aniversario" });
    expect(
      getCalendarState(midday("2027-09-16")).event?.anniversary,
    ).toEqual({ years: 217, label: "217.º aniversario" });
    expect(
      getCalendarState(midday("2027-11-01")).event?.anniversary,
    ).toBeNull();
    expect(
      getCalendarState(midday("2027-11-02")).event?.anniversary,
    ).toBeNull();
    expect(
      getCalendarState(midday("2027-11-20")).event?.anniversary,
    ).toEqual({ years: 117, label: "117.º aniversario" });
  });

  it("no asigna efemérides falsas al 1 y 2 de octubre", () => {
    expect(getCalendarState(midday("2027-10-01")).event).toBeNull();
    expect(getCalendarState(midday("2027-10-02")).event).toBeNull();
  });

  it("calcula las fechas usando la zona de Ciudad de México", () => {
    const beforeMidnight = getCalendarState(new Date("2027-01-01T05:30:00Z"));
    const afterMidnight = getCalendarState(new Date("2027-01-01T06:30:00Z"));
    expect(beforeMidnight.isoDate).toBe("2026-12-31");
    expect(afterMidnight.isoDate).toBe("2027-01-01");
  });

  it("usa exactamente las banderas indicadas para México y Alemania", () => {
    expect(CALENDAR_FLAGS.germany).toContain(
      "upload.wikimedia.org/wikipedia/commons/b/ba/Flag_of_Germany.svg",
    );
    expect(CALENDAR_FLAGS.mexico).toContain(
      "upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg",
    );
  });

  it("inserta el detalle discreto de enero sin modificar el contenido de la bitácora", () => {
    document.body.innerHTML =
      '<div class="shell"><header class="topbar"></header><section class="hero"><div class="hero-kicker">Bitácora semanal</div><h1>Crea tu bitácora dual.</h1></section></div>';
    const cleanup = startCalendarEasterEggs({
      now: midday("2027-01-15"),
      storage: null,
    });
    expect(document.getElementById("calendarMonthDetail")?.textContent).toBe(
      "2027 · Nuevo año, nueva bitácora",
    );
    expect(document.querySelector(".hero h1")?.textContent).toBe(
      "Crea tu bitácora dual.",
    );
    cleanup();
    expect(document.getElementById("calendarMonthDetail")).toBeNull();
  });
});
