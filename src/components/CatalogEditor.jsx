import { useState } from "react";
import Field from "./Field.jsx";
import { validateCatalogs } from "../domain/catalogs.js";
import { uid } from "../domain/records.js";
export default function CatalogEditor({ catalogs, onSave }) {
  const [data, setData] = useState(() => structuredClone(catalogs));
  const [type, setType] = useState("schools");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const row = data[type][index];
  const patch = (key, value) =>
    setData((d) => ({
      ...d,
      [type]: d[type].map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));
  function add() {
    const r =
      type === "schools"
        ? {
            id: uid(),
            name: "",
            shortName: "",
            voboName: "",
            voboRole: "",
            specialties: ["Programación"],
            semesters: ["4", "5", "6"],
            groups: ["A", "B", "C", "D"],
          }
        : {
            id: uid(),
            name: "",
            start: "09:00",
            end: "14:00",
            area: "Área de Informática",
            representatives: [],
            instructors: [],
          };
    setIndex(data[type].length);
    setData({ ...data, [type]: [...data[type], r] });
  }
  return (
    <>
      <p>
        Estos cambios se guardan en este navegador. Exporta un respaldo para
        llevarlos a otro dispositivo. Las bitácoras existentes conservan sus
        datos.
      </p>
      <div className="segmented">
        <button
          aria-pressed={type === "schools"}
          onClick={() => {
            setType("schools");
            setIndex(0);
          }}
        >
          Escuelas
        </button>
        <button
          aria-pressed={type === "companies"}
          onClick={() => {
            setType("companies");
            setIndex(0);
          }}
        >
          Empresas
        </button>
      </div>
      <Field
        label="Editar elemento"
        value={String(index)}
        onChange={(v) => setIndex(+v)}
        options={data[type].map((x, i) => ({
          value: String(i),
          label: x.name || "Nuevo elemento",
        }))}
      />
      <button onClick={add}>
        Agregar {type === "schools" ? "escuela" : "empresa"}
      </button>
      <div className="fields">
        <Field
          label="Nombre completo"
          value={row.name}
          onChange={(v) => patch("name", v)}
          maxLength={180}
        />
        {type === "schools" ? (
          <>
            <Field
              label="Nombre corto del plantel"
              value={row.shortName}
              onChange={(v) => patch("shortName", v)}
              maxLength={80}
            />
            <Field
              label="Responsable de Vinculación"
              value={row.voboName}
              onChange={(v) => patch("voboName", v)}
              maxLength={100}
            />
            <Field
              label="Cargo de Vinculación"
              multiline
              value={row.voboRole}
              onChange={(v) => patch("voboRole", v)}
              maxLength={180}
            />
            {[
              ["specialties", "Especialidades"],
              ["semesters", "Semestres"],
              ["groups", "Grupos"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={label}
                hint="Un elemento por línea."
                multiline
                value={row[key].join("\n")}
                onChange={(v) => patch(key, v.split("\n"))}
              />
            ))}
          </>
        ) : (
          <>
            <Field
              label="Entrada predeterminada"
              type="time"
              value={row.start}
              onChange={(v) => patch("start", v)}
            />
            <Field
              label="Salida predeterminada"
              type="time"
              value={row.end}
              onChange={(v) => patch("end", v)}
            />
            <Field
              label="Área predeterminada"
              value={row.area}
              onChange={(v) => patch("area", v)}
              maxLength={150}
            />
            {[
              ["representatives", "Representantes", "role"],
              ["instructors", "Instructores", "roleMain"],
            ].map(([key, label, roleKey]) => (
              <section className="full" key={key}>
                <h3>{label}</h3>
                {row[key].map((p, i) => (
                  <div className="person-editor" key={i}>
                    <Field
                      label={`Nombre ${i + 1}`}
                      value={p.name}
                      onChange={(v) =>
                        patch(
                          key,
                          row[key].map((x, j) =>
                            i === j ? { ...x, name: v } : x,
                          ),
                        )
                      }
                      maxLength={100}
                    />
                    <Field
                      label="Cargo"
                      multiline
                      value={p[roleKey]}
                      onChange={(v) =>
                        patch(
                          key,
                          row[key].map((x, j) =>
                            i === j ? { ...x, [roleKey]: v } : x,
                          ),
                        )
                      }
                      maxLength={180}
                    />
                    <button
                      onClick={() =>
                        patch(
                          key,
                          row[key].filter((_, j) => i !== j),
                        )
                      }
                    >
                      Quitar persona
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    patch(key, [...row[key], { name: "", [roleKey]: "" }])
                  }
                >
                  Agregar persona
                </button>
              </section>
            ))}
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button
          className="primary"
          onClick={() => {
            try {
              const cleaned = structuredClone(data);
              cleaned.schools.forEach((s) =>
                ["specialties", "semesters", "groups"].forEach(
                  (k) => (s[k] = s[k].map((v) => v.trim()).filter(Boolean)),
                ),
              );
              onSave(validateCatalogs(cleaned));
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Guardar catálogos
        </button>
      </div>
    </>
  );
}
