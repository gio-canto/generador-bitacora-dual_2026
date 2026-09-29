import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("landing de presentación", () => {
  it("incluye hero, sistemas, Data Matrix e integración institucional", async () => {
    const html = await readFile("presentacion/index.html", "utf8");

    expect(html).toContain("Nunca fue tan fácil hacer una bitácora.");
    expect(html).toContain("../Assets/asset_landing.png");
    expect(html).toContain("../Assets/Asset_cont_matrix.png");
    expect(html).toContain("Generador de Bitácora Dual");
    expect(html).toContain("Registro de entregas");
    expect(html).toContain("Sistema de gestión y emisión");
    expect(html).toContain("¿Quieres que tu institución pueda usar este sistema?");
    expect(html).toContain("pull request");
    expect(html).toContain("Contactar al creador");
    expect(html).toContain("Privacidad.");
    expect(html).toContain("Open source.");
    expect(html).toContain("10–20 min");
    expect(html).toContain("≈ 5 min");
    expect(html).toContain("1–1.5 h");
    expect(html).toContain("&lt; 10 min");
    expect(html).toContain("Tiempos aproximados");
    expect(html).toContain("Tu escuela puede agregarse al proyecto.");
    expect(html).toContain("Las aportaciones útiles son bienvenidas.");
    expect(html).toContain("Colaborar en GitHub");
    expect(html).toContain("Dar estrella");
    expect(html).not.toContain('class="brand-mark"');
    expect(html).toContain('href="../registro-entrega/"');
  });

  it("mantiene la presentación como entrada Vite y recurso offline", async () => {
    const vite = await readFile("vite.config.js", "utf8");
    const sw = await readFile("scripts/build-sw.mjs", "utf8");

    expect(vite).toContain('presentation: "presentacion/index.html"');
    expect(sw).toContain('"presentacion"');
    expect(sw).toContain('"./Assets/asset_landing.png"');
    expect(sw).toContain('"./Assets/Asset_cont_matrix.png"');
  });
});
