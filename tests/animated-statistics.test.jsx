import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AnimatedValue, { numberAtProgress, numberParts } from "../src/components/AnimatedValue.jsx";

describe("movimiento de Estadísticas", () => {
  it("conserva separadores, decimales y unidades durante el conteo", () => {
    expect(numberParts("1,234.5 h")).toEqual({
      numeric: 1234.5, decimals:1, suffix:" h",
    });
    expect(numberAtProgress("1,234.5 h", 0)).toBe("0.0 h");
    expect(numberAtProgress("1,234.5 h", 1)).toBe("1,234.5 h");
    expect(numberAtProgress("67%",1)).toBe("67%");
    expect(numberAtProgress("—",0.5)).toBe("—");
  });
  it("nunca genera valores por encima de la cifra real", () => {
    const middle = numberParts(numberAtProgress("120 h",.55));
    expect(middle.numeric).toBeGreaterThan(0);
    expect(middle.numeric).toBeLessThan(120);
    expect(numberAtProgress("120 h",2)).toBe("120 h");
  });
  it("mantiene el valor disponible si el navegador no permite observar la entrada", () => {
    const { rerender, container } = render(<AnimatedValue value="48 h"/>);
    expect(container.querySelector(".ds-animated-number")?.textContent).toBe("48 h");
    rerender(<AnimatedValue value="67%"/>);
    expect(screen.getByLabelText("67%").textContent).toBe("67%");
  });
});
