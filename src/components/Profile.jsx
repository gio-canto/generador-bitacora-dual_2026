import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Blobatar } from "blobatar/react";
import schools from "../data/schools.json";
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

function editableDefaults(profile) {
  const firstSchool = schools[0] || {};
  const schoolName =
    profile.school || valueFromEditor("school", firstSchool.name || "");
  const school = schools.find((item) => item.name === schoolName) || firstSchool;
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
    defaultStart:
      profile.defaultStart || valueFromEditor("defaultStart", "10:00"),
    defaultEnd: profile.defaultEnd || valueFromEditor("defaultEnd", "14:00"),
  };
}

const shown = (value) => String(value || "").trim() || "Sin definir";

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
  const shortSchool =
    schools.find((item) => item.name === profile.school)?.shortName ||
    profile.school;
  const schedule =
    profile.defaultStart && profile.defaultEnd
      ? `${profile.defaultStart}–${profile.defaultEnd}`
      : "Sin horario guardado";

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

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
      "Información predeterminada guardada",
      "Se usará al crear tus próximas bitácoras.",
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
            <div className="profile-heading">
              <strong>Información predeterminada</strong>
              <p>Se completa automáticamente en tus próximas bitácoras.</p>
            </div>
            <dl className="profile-defaults">
              <div>
                <dt>Institución</dt>
                <dd>{shown(shortSchool)}</dd>
              </div>
              <div>
                <dt>Especialidad</dt>
                <dd>{shown(profile.specialty)}</dd>
              </div>
              <div>
                <dt>Semestre / grado</dt>
                <dd>{shown(profile.semester)}</dd>
              </div>
              <div>
                <dt>Grupo</dt>
                <dd>{shown(profile.group)}</dd>
              </div>
              <div>
                <dt>Horario</dt>
                <dd>{schedule}</dd>
              </div>
              <div>
                <dt>Área común</dt>
                <dd>{shown(profile.area)}</dd>
              </div>
            </dl>
            <div className="profile-buttons">
              <button className="btn primary" type="button" onClick={edit}>
                Editar información
              </button>
              <button
                className="btn"
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
                Olvidar información
              </button>
            </div>
          </>
        ) : (
          <div className="profile-form" aria-label="Información predeterminada">
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
                placeholder="Ej. Área de Informática"
              />
            </label>
            <div className="profile-buttons">
              <button
                className="btn primary"
                id="profileSave"
                type="button"
                onClick={save}
              >
                Guardar
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </button>
            </div>
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
