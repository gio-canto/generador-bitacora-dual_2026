import companies from "../data/companies.json";
export function startPeople() {
  (() => {
    "use strict";
    const TEC_COMPANY = "Instituto Tecnológico de Chilpancingo (ITCH)";
    let PEOPLE = [];
    const company = document.getElementById("company");
    const name = document.getElementById("autorizoName");
    const role = document.getElementById("autorizoRole");
    if (!company || !name || !role) return;
    const authBox = name.closest(".auth-box");
    if (!authBox) return;
    const field = document.createElement("div");
    field.id = "tecnmAutorizoPresetField";
    field.className = "field full";
    field.hidden = true;
    field.innerHTML =
      '<label>Responsable que autoriza · TecNM Campus Chilpancingo</label><select id="tecnmAutorizoPreset"><option value="__custom__">Personalizar / otra persona…</option></select><div class="muted">Selecciona únicamente a la persona que realmente autoriza tu bitácora. Si no aparece, usa la opción personalizada.</div>';
    authBox.parentNode.insertBefore(field, authBox);
    const select = document.getElementById("tecnmAutorizoPreset");
    let lastCompany = company.value;
    const fireInput = (element) =>
      element.dispatchEvent(new Event("input", { bubbles: true }));
    function clearAuthority() {
      name.value = "";
      role.value = "";
      fireInput(name);
      fireInput(role);
    }
    function matchCurrent() {
      return PEOPLE.find((person) => person.name === name.value.trim()) || null;
    }
    function syncTecUI(fromCompanyChange = false) {
      PEOPLE =
        companies.find((c) => c.name === company.value)?.representatives || [];
      select.replaceChildren(
        new Option("Personalizar / otra persona…", "__custom__"),
        ...PEOPLE.map((p) => new Option(p.name + " · " + p.role, p.name)),
      );
      field.querySelector("label").htmlFor = select.id;
      field.querySelector("label").textContent =
        company.value === TEC_COMPANY
          ? "Responsable que autoriza · TecNM Campus Chilpancingo"
          : "Responsable que autoriza";
      const isTec = PEOPLE.length > 1;
      field.hidden = !isTec;
      const matched = matchCurrent();
      if (isTec) {
        if (
          fromCompanyChange &&
          lastCompany !== TEC_COMPANY &&
          !matched &&
          (name.value.trim() || role.value.trim())
        )
          clearAuthority();
        const current = matchCurrent();
        select.value = current ? current.name : "__custom__";
      } else {
        if (fromCompanyChange && lastCompany === TEC_COMPANY && matched)
          clearAuthority();
        select.value = "__custom__";
      }
      lastCompany = company.value;
    }
    select.addEventListener("change", () => {
      if (select.value === "__custom__") {
        if (matchCurrent()) clearAuthority();
        name.focus();
        return;
      }
      const person = PEOPLE.find((item) => item.name === select.value);
      if (!person) return;
      name.value = person.name;
      role.value = person.role;
      fireInput(name);
      fireInput(role);
    });
    company.addEventListener("change", () => syncTecUI(true));
    name.addEventListener("input", () => {
      const matched = matchCurrent();
      select.value = matched ? matched.name : "__custom__";
    });
    document.addEventListener("click", (event) => {
      if (
        event.target.closest(
          "[data-open],[data-copy],#newBtn,#resetBtn,#restoreBtn",
        )
      )
        setTimeout(() => syncTecUI(false), 0);
    });
    syncTecUI(false);
  })();
}
