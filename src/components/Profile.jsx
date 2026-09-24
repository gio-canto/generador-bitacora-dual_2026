import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Blobatar } from "blobatar/react";
import schools from "../data/schools.json";
import companies from "../data/companies.json";
import {
  readProfileData,
  rememberProfile,
  forgetProfile,
} from "../services/profile.js";
import { isSecretName } from "../domain/presentation.js";
import { notify } from "../services/rare-notification.jsx";

const valueFromEditor = (id, fallback = "") =>
  typeof document === "undefined"
    ? fallback
    : document.getElementById(id)?.value || fallback;

const checkedFromEditor = (id, fallback = false) =>
  typeof document === "undefined"
    ? fallback
    : document.getElementById(id)?.checked ?? fallback;

function editableDefaults(profile) {
  const firstSchool = schools[0] || {};
  const schoolName =
    profile.school || valueFromEditor("school", firstSchool.name || "");
  const school = schools.find((item) => item.name === schoolName) || firstSchool;
  const companyName = profile.company || valueFromEditor("company", "");
  const company = companies.find((item) => item.name === companyName) || {};

  return {
    ...profile,
    school: schoolName,
    specialty:
      profile.specialty ||
      valueFromEditor("specialty", school.specialties?.[0] || ""),
    semester:
      profile.semester ||
      valueFromEditor("semester", school.semesters?.[0] || ""),
    group:
      profile.group || valueFromEditor("group", school.groups?.[0] || ""),
    company: companyName,
    defaultStart:
      profile.defaultStart ||
      valueFromEditor("defaultStart", company.start || "10:00"),
    defaultEnd:
      profile.defaultEnd ||
      valueFromEditor("defaultEnd", company.end || "14:00"),
    area: profile.area || company.area || "",
    markdown: profile.markdown ?? checkedFromEditor("markdown", true),
    studentGenericSignature:
      profile.studentGenericSignature ??
      checkedFromEditor("studentGenericSignature", false),
    authorities: {
      voboName:
        profile.authorities?.voboName ||
        valueFromEditor("voboName", school.voboName || ""),
      voboRole:
        profile.authorities?.voboRole ||
        valueFromEditor("voboRole", school.voboRole || ""),
      autorizoName:
        profile.authorities?.autorizoName ||
        valueFromEditor("autorizoName", ""),
      autorizoRole:
        profile.authorities?.autorizoRole ||
        valueFromEditor("autorizoRole", ""),
    },
    instructor: {
      enabled:
        profile.instructor?.enabled ??
        checkedFromEditor(
          "instructorEnabled",
          company.instructorEnabledByDefault === true,
        ),
      preset:
        profile.instructor?.preset ||
        valueFromEditor("instructorPreset", "__custom__"),
      name:
        profile.instructor?.name || valueFromEditor("instructorName", ""),
      roleMain:
        profile.instructor?.roleMain ||
        valueFromEditor("instructorRoleMain", ""),
      note:
        profile.instructor?.note ||
        valueFromEditor("instructorNote", "Instructor Formador"),
    },
  };
}

const shown = (value) => String(value || "").trim() || "Sin definir";

const shortCompany = (name) =>
  companies.find((item) => item.name === name)?.shortName || name;

const shortSchool = (name) =>
  schools.find((item) => item.name === name)?.shortName || name;

export function Profile() {
  const [profile, setProfile] = useState(readProfileData);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(readProfileData);

  useEffect(() => {
    const sync = () => setProfile(readProfileData());
    window.addEventListener("bitacora-profile", sync);
    return () => window.removeEventListener("bitacora-profile", sync);
  }, []);

  if (!profile.name) return null;

  const selectedSchool =
    schools.find((item) => item.name === form.school) || schools[0] || {};
  const selectedCompany =
    companies.find((item) => item.name === form.company) || null;
  const representatives = selectedCompany?.representatives || [];
  const instructors = selectedCompany?.instructors || [];
  const representativeMatches = representatives.some(
    (item) => item.name === form.authorities?.autorizoName,
  );
  const instructorMatches = instructors.some(
    (item) => item.name === form.instructor?.name,
  );

  const schedule =
    profile.defaultStart && profile.defaultEnd
      ? `${profile.defaultStart}–${profile.defaultEnd}`
      : "Sin definir";

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const updateAuthority = (key) => (event) =>
    setForm((current) => ({
      ...current,
      authorities: {
        ...current.authorities,
        [key]: event.target.value,
      },
    }));

  const updateInstructor = (key) => (event) =>
    setForm((current) => ({
      ...current,
      instructor: {
        ...current.instructor,
        [key]: event.target.value,
      },
    }));

  const edit = () => {
    setForm(editableDefaults(profile));
    setEditing(true);
  };

  const changeSchool = (event) => {
    const schoolName = event.target.value;
    const school =
      schools.find((item) => item.name === schoolName) || schools[0] || {};
    setForm((current) => ({
      ...current,
      school: schoolName,
      specialty: school.specialties?.includes(current.specialty)
        ? current.specialty
        : school.specialties?.[0] || "",
      semester: school.semesters?.includes(current.semester)
        ? current.semester
        : school.semesters?.[0] || "",
      group: school.groups?.includes(current.group)
        ? current.group
        : school.groups?.[0] || "",
      authorities: {
        ...current.authorities,
        voboName: school.voboName || "",
        voboRole: school.voboRole || "",
      },
    }));
  };

  const changeCompany = (event) => {
    const companyName = event.target.value;
    const company = companies.find((item) => item.name === companyName);
    const representative =
      company?.representatives?.length === 1
        ? company.representatives[0]
        : null;

    setForm((current) => ({
      ...current,
      company: companyName,
      defaultStart: company?.start || current.defaultStart || "10:00",
      defaultEnd: company?.end || current.defaultEnd || "14:00",
      area: company?.area || current.area,
      authorities: {
        ...current.authorities,
        autorizoName: representative?.name || "",
        autorizoRole: representative?.role || "",
      },
      instructor: {
        enabled: company?.instructorEnabledByDefault === true,
        preset: "__custom__",
        name: "",
        roleMain: "",
        note: "Instructor Formador",
      },
    }));
  };

  const changeRepresentative = (event) => {
    const person = representatives.find(
      (item) => item.name === event.target.value,
    );
    setForm((current) => ({
      ...current,
      authorities: {
        ...current.authorities,
        autorizoName: person?.name || "",
        autorizoRole: person?.role || "",
      },
    }));
  };

  const changeInstructor = (event) => {
    const person = instructors.find((item) => item.name === event.target.value);
    setForm((current) => ({
      ...current,
      instructor: {
        ...current.instructor,
        preset: person?.name || "__custom__",
        name: person?.name || "",
        roleMain: person?.roleMain || "",
        note: "Instructor Formador",
      },
    }));
  };

  const save = () => {
    const name = String(form.name || "").trim();
    if (!name) {
      notify("error", "Falta tu nombre", "Escribe el nombre que usará el perfil.");
      return;
    }
    if (isSecretName(name)) {
      notify(
        "error",
        "Ese texto no se guarda como nombre",
        "Es un disparador especial del generador.",
      );
      return;
    }
    if (
      !form.defaultStart ||
      !form.defaultEnd ||
      form.defaultEnd <= form.defaultStart
    ) {
      notify(
        "error",
        "Revisa el horario",
        "La hora de salida debe ser posterior a la de entrada.",
      );
      return;
    }
    if (
      form.instructor?.enabled &&
      (!String(form.instructor.name || "").trim() ||
        !String(form.instructor.roleMain || "").trim())
    ) {
      notify(
        "error",
        "Falta el instructor",
        "Selecciona o escribe el instructor formador y su cargo.",
      );
      return;
    }
    if (!rememberProfile(form)) {
      notify(
        "error",
        "No se pudo guardar",
        "Revisa el almacenamiento del navegador.",
      );
      return;
    }

    const updated = readProfileData();
    setProfile(updated);
    setEditing(false);
    window.dispatchEvent(
      new CustomEvent("bitacora-apply-profile", { detail: updated }),
    );
    notify(
      "success",
      "Predeterminados actualizados",
      "Se aplicarán a las nuevas bitácoras.",
    );
  };

  return (
    <details className="profile-menu">
      <summary title={profile.name} aria-label={`Perfil de ${profile.name}`}>
        <Blobatar name={profile.name} size={38} alt="" />
        <span>
          <strong>{profile.name}</strong>
        </span>
      </summary>

      <div className="profile-actions">
        {!editing ? (
          <>
            <header className="profile-popover-head">
              <div>
                <strong>Tu información</strong>
                <span>Predeterminados para nuevas bitácoras</span>
              </div>
              <button className="profile-text-button" type="button" onClick={edit}>
                Editar
              </button>
            </header>

            <section className="profile-section">
              <h3>Escuela</h3>
              <dl className="profile-lines">
                <div>
                  <dt>Plantel</dt>
                  <dd>{shown(shortSchool(profile.school))}</dd>
                </div>
                <div>
                  <dt>Especialidad</dt>
                  <dd>{shown(profile.specialty)}</dd>
                </div>
                <div>
                  <dt>Semestre y grupo</dt>
                  <dd>
                    {shown(
                      [profile.semester, profile.group].filter(Boolean).join(" · "),
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="profile-section">
              <h3>Dual</h3>
              <dl className="profile-lines">
                <div>
                  <dt>Empresa</dt>
                  <dd>{shown(shortCompany(profile.company))}</dd>
                </div>
                <div>
                  <dt>Horario</dt>
                  <dd>{schedule}</dd>
                </div>
                <div>
                  <dt>Área</dt>
                  <dd>{shown(profile.area)}</dd>
                </div>
                <div>
                  <dt>Autoriza</dt>
                  <dd>{shown(profile.authorities?.autorizoName)}</dd>
                </div>
                <div>
                  <dt>Instructor</dt>
                  <dd>
                    {profile.instructor?.enabled
                      ? shown(profile.instructor?.name)
                      : "No usar"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="profile-section">
              <h3>Preferencias</h3>
              <dl className="profile-lines">
                <div>
                  <dt>Markdown</dt>
                  <dd>{profile.markdown ? "Activado" : "Desactivado"}</dd>
                </div>
                <div>
                  <dt>Firma del alumno</dt>
                  <dd>
                    {profile.studentGenericSignature
                      ? "Firma genérica"
                      : "Sin firma genérica"}
                  </dd>
                </div>
              </dl>
            </section>

            <button
              className="profile-forget"
              type="button"
              onClick={() => {
                if (forgetProfile())
                  notify(
                    "info",
                    "Información olvidada",
                    "Tus bitácoras guardadas siguen aquí.",
                  );
                else
                  notify(
                    "error",
                    "No se pudo olvidar la información",
                    "Revisa el almacenamiento del navegador.",
                  );
              }}
            >
              Olvidar predeterminados
            </button>
          </>
        ) : (
          <div className="profile-editor" aria-label="Información predeterminada">
            <header className="profile-editor-head">
              <div>
                <strong>Editar predeterminados</strong>
                <span>No cambia las bitácoras ya guardadas.</span>
              </div>
            </header>

            <section className="profile-form-section">
              <h3>Alumno y escuela</h3>
              <label>
                Nombre
                <input
                  id="profileName"
                  value={form.name}
                  onChange={update("name")}
                  maxLength={160}
                  autoComplete="name"
                />
              </label>
              <label>
                Institución / plantel
                <select
                  id="profileSchool"
                  value={form.school}
                  onChange={changeSchool}
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.name}>
                      {school.shortName || school.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Especialidad
                <select
                  id="profileSpecialty"
                  value={form.specialty}
                  onChange={update("specialty")}
                >
                  {(selectedSchool.specialties || []).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <div className="profile-form-grid">
                <label>
                  Semestre / grado
                  <select
                    id="profileSemester"
                    value={form.semester}
                    onChange={update("semester")}
                  >
                    {(selectedSchool.semesters || []).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Grupo
                  <select
                    id="profileGroup"
                    value={form.group}
                    onChange={update("group")}
                  >
                    {(selectedSchool.groups || []).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="profile-form-section">
              <h3>Formación dual</h3>
              <label>
                Empresa
                <select
                  id="profileCompany"
                  value={form.company}
                  onChange={changeCompany}
                >
                  <option value="">Selecciona una empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.name}>
                      {company.shortName || company.name}
                    </option>
                  ))}
                </select>
              </label>

              {representatives.length > 0 ? (
                <label>
                  Responsable que autoriza
                  <select
                    id="profileAutorizoPreset"
                    value={
                      representativeMatches
                        ? form.authorities.autorizoName
                        : "__custom__"
                    }
                    onChange={changeRepresentative}
                  >
                    <option value="__custom__">Personalizar / otra persona</option>
                    {representatives.map((person) => (
                      <option key={person.name} value={person.name}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {!representativeMatches ? (
                <div className="profile-form-grid profile-form-grid-wide">
                  <label>
                    Nombre de quien autoriza
                    <input
                      id="profileAutorizoName"
                      value={form.authorities?.autorizoName || ""}
                      onChange={updateAuthority("autorizoName")}
                      maxLength={160}
                    />
                  </label>
                  <label>
                    Cargo
                    <input
                      id="profileAutorizoRole"
                      value={form.authorities?.autorizoRole || ""}
                      onChange={updateAuthority("autorizoRole")}
                      maxLength={300}
                    />
                  </label>
                </div>
              ) : null}

              <div className="profile-form-grid">
                <label>
                  Entrada
                  <input
                    id="profileDefaultStart"
                    type="time"
                    value={form.defaultStart}
                    onChange={update("defaultStart")}
                  />
                </label>
                <label>
                  Salida
                  <input
                    id="profileDefaultEnd"
                    type="time"
                    value={form.defaultEnd}
                    onChange={update("defaultEnd")}
                  />
                </label>
              </div>

              <label>
                Área común
                <input
                  id="profileArea"
                  value={form.area}
                  onChange={update("area")}
                  maxLength={150}
                  placeholder="Área de Informática"
                />
              </label>

              <label className="profile-check">
                <input
                  id="profileInstructorEnabled"
                  type="checkbox"
                  checked={form.instructor?.enabled === true}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      instructor: {
                        ...current.instructor,
                        enabled: event.target.checked,
                      },
                    }))
                  }
                />
                <span>Usar instructor formador</span>
              </label>

              {form.instructor?.enabled ? (
                <>
                  {instructors.length > 0 ? (
                    <label>
                      Instructor formador
                      <select
                        id="profileInstructorPreset"
                        value={
                          instructorMatches
                            ? form.instructor.name
                            : "__custom__"
                        }
                        onChange={changeInstructor}
                      >
                        <option value="__custom__">
                          Personalizar / otra persona
                        </option>
                        {instructors.map((person) => (
                          <option key={person.name} value={person.name}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {!instructorMatches ? (
                    <div className="profile-form-grid profile-form-grid-wide">
                      <label>
                        Nombre del instructor
                        <input
                          id="profileInstructorName"
                          value={form.instructor?.name || ""}
                          onChange={updateInstructor("name")}
                          maxLength={160}
                        />
                      </label>
                      <label>
                        Cargo
                        <input
                          id="profileInstructorRole"
                          value={form.instructor?.roleMain || ""}
                          onChange={updateInstructor("roleMain")}
                          maxLength={180}
                        />
                      </label>
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>

            <section className="profile-form-section">
              <h3>Preferencias</h3>
              <label className="profile-check">
                <input
                  id="profileMarkdown"
                  type="checkbox"
                  checked={form.markdown !== false}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      markdown: event.target.checked,
                    }))
                  }
                />
                <span>Markdown en actividades</span>
              </label>
              <label className="profile-check">
                <input
                  id="profileStudentSignature"
                  type="checkbox"
                  checked={form.studentGenericSignature === true}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      studentGenericSignature: event.target.checked,
                    }))
                  }
                />
                <span>Firma genérica del alumno</span>
              </label>
            </section>

            <footer className="profile-editor-actions">
              <button
                className="btn"
                type="button"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
              <button
                className="btn primary"
                id="profileSave"
                type="button"
                onClick={save}
              >
                Guardar
              </button>
            </footer>
          </div>
        )}
      </div>
    </details>
  );
}

export function startProfile() {
  const host = document.getElementById("profileSlot");
  if (host) createRoot(host).render(<Profile />);
}
