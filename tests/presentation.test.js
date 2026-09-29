import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("landing de presentación", () => {
  it("monta la landing con React, iconos y contenido institucional", async () => {
    const html = await readFile("presentacion/index.html", "utf8");
    const jsx = await readFile("src/presentation.jsx", "utf8");

    expect(html).toContain('id="presentation-root"');
    expect(html).toContain("../src/presentation.jsx");
    expect(jsx).toContain("function SvgIcon");
    expect(jsx).toContain('const GitPullRequest = iconComponent("gitPullRequest")');
    expect(jsx).toContain("createRoot(root).render(<Presentation />)");

    expect(jsx).toContain("Nunca fue tan fácil hacer una bitácora.");
    expect(jsx).toContain("../Assets/asset_landing.png");
    expect(jsx).toContain("../Assets/Asset_cont_matrix.png");
    expect(jsx).toContain("Generador de Bitácora Dual");
    expect(jsx).toContain("Registro de entregas");
    expect(jsx).toContain("Sistema de gestión y emisión");
    expect(jsx).toContain("¿Quieres que tu institución pueda usar este sistema?");
    expect(jsx).toContain("pull request");
    expect(jsx).toContain("Pedir apoyo al creador");
    expect(jsx).toContain("Privacidad.");
    expect(jsx).toContain("Open source.");
    expect(jsx).toContain("10–20 min");
    expect(jsx).toContain("≈ 5 min");
    expect(jsx).toContain("1–1.5 h");
    expect(jsx).toContain("&lt; 10 min");
    expect(jsx).toContain("Tiempos aproximados");
    expect(jsx).toContain("Lo que dicen quienes lo usan");
    expect(jsx).toContain("Wuendy G.");
    expect(jsx).toContain("Alumna del Sistema Dual");
    expect(jsx).toContain("CBTis 134");
    expect(jsx).toContain("corregir mis faltas ortográficas");
    expect(jsx).toContain("<TestimonialsSection />");
    expect(jsx).toContain("Tu escuela puede agregarse al proyecto.");
    expect(jsx).toContain("aportaciones útiles son bienvenidas.");
    expect(jsx).toContain("Colaborar en GitHub");
    expect(jsx).toContain("Dar estrella");
    expect(jsx).toContain("<GitPullRequest");
    expect(jsx).toContain("<QrCode");
    expect(jsx).toContain("<ShieldCheck");
    expect(jsx).toContain("<DeviceMobile");
    expect(jsx).toContain('registration.waiting?.postMessage({ type: "SKIP_WAITING" })');
    expect(jsx).toContain('"controllerchange"');
    expect(jsx).toContain('"../registro-entrega/"');
  });

  it("mantiene la presentación como entrada Vite y recurso offline", async () => {
    const vite = await readFile("vite.config.js", "utf8");
    const sw = await readFile("scripts/build-sw.mjs", "utf8");

    expect(vite).toContain('presentation: "presentacion/index.html"');
    expect(sw).toContain('"presentacion"');
    expect(sw).toContain('"./Assets/asset_landing.png"');
    expect(sw).toContain('"./Assets/Asset_cont_matrix.png"');
  });

  it("incluye animaciones accesibles y movimiento progresivo", async () => {
    const css = await readFile("src/presentation.css", "utf8");
    const jsx = await readFile("src/presentation.jsx", "utf8");

    expect(css).toContain("@keyframes clock-spin");
    expect(css).toContain("@keyframes arrow-breathe");
    expect(css).toContain("@media(prefers-reduced-motion:reduce)");
    expect(css).toContain("--scroll-progress");
    expect(css).toContain("--hero-shift");
    expect(jsx).toContain("IntersectionObserver");
    expect(jsx).toContain("requestAnimationFrame");
    expect(jsx).toContain("prefers-reduced-motion: reduce");
  });
});
