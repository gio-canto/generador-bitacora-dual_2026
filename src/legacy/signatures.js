export function startSignatureFixes() {
  (() => {
    "use strict";
    const TEC_COMPANY = "Instituto Tecnológico de Chilpancingo (ITCH)";
    const company = document.getElementById("company");
    const select = document.getElementById("tecnmAutorizoPreset");
    const role = document.getElementById("autorizoRole");
    const name = document.getElementById("autorizoName");
    const fireInput = (element) =>
      element.dispatchEvent(new Event("input", { bubbles: true }));
    function ensureTecImmediateBoss() {
      if (
        !company ||
        !select ||
        !role ||
        !name ||
        company.value !== TEC_COMPANY ||
        select.value === "__custom__"
      )
        return;
      const base = role.value.replace(/\s*\n?Jefe inmediato\s*$/i, "").trim();
      const next = (base ? base + "\n" : "") + "Jefe inmediato";
      if (role.value !== next) {
        role.value = next;
        fireInput(role);
      }
    }
    select?.addEventListener("change", () =>
      setTimeout(ensureTecImmediateBoss, 0),
    );
    company?.addEventListener("change", () =>
      setTimeout(ensureTecImmediateBoss, 0),
    );
    name?.addEventListener("input", () =>
      setTimeout(ensureTecImmediateBoss, 0),
    );
    document.addEventListener("click", (event) => {
      if (
        event.target.closest(
          "[data-open],[data-copy],#newBtn,#resetBtn,#restoreBtn",
        )
      )
        setTimeout(ensureTecImmediateBoss, 20);
    });
    setTimeout(ensureTecImmediateBoss, 0);
  })();
}
