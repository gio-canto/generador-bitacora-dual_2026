import Field from "./Field.jsx";
export default function Authorities({
  record,
  company,
  visible,
  auth,
  instructor,
  setRecord,
}) {
  return (
    <>
      <div className="note">
        Elaboró:{" "}
        <strong>{record.student || "Completa el nombre del alumno"}</strong>
      </div>
      <h3>Visto bueno del plantel</h3>
      <div className="fields">
        <Field
          label="Nombre de Vinculación"
          value={record.authorities.voboName}
          onChange={(v) => auth("voboName", v)}
          error={visible["authorities.voboName"]}
          maxLength={100}
        />
        <Field
          label="Cargo de Vinculación"
          multiline
          value={record.authorities.voboRole}
          onChange={(v) => auth("voboRole", v)}
          error={visible["authorities.voboRole"]}
          maxLength={180}
        />
      </div>
      <h3>Autorización de la empresa</h3>
      {!!company?.representatives.length && (
        <Field
          label="Responsable precargado"
          value={
            company.representatives.find(
              (p) => p.name === record.authorities.autorizoName,
            )?.name || ""
          }
          options={[
            { value: "", label: "Captura manual" },
            ...company.representatives.map((p) => ({
              value: p.name,
              label: p.name,
            })),
          ]}
          onChange={(v) => {
            const p = company.representatives.find((x) => x.name === v);
            setRecord((r) => ({
              ...r,
              authorities: {
                ...r.authorities,
                autorizoName: p?.name || "",
                autorizoRole: p?.role || "",
              },
            }));
          }}
        />
      )}
      <div className="fields">
        <Field
          label="Nombre de quien autoriza"
          value={record.authorities.autorizoName}
          onChange={(v) => auth("autorizoName", v)}
          error={visible["authorities.autorizoName"]}
          maxLength={100}
        />
        <Field
          label="Cargo de quien autoriza"
          multiline
          value={record.authorities.autorizoRole}
          onChange={(v) => auth("autorizoRole", v)}
          error={visible["authorities.autorizoRole"]}
          maxLength={180}
        />
        <Field
          className="full"
          label="Cargo del alumno"
          multiline
          value={record.authorities.elaboroRole}
          onChange={(v) => auth("elaboroRole", v)}
          maxLength={150}
        />
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={record.instructor.enabled}
          onChange={(e) => instructor("enabled", e.target.checked)}
        />{" "}
        Incluir instructor formador
      </label>
      {record.instructor.enabled && (
        <>
          <Field
            label="Instructor precargado"
            value={
              company?.instructors.find(
                (p) => p.name === record.instructor.name,
              )?.name || ""
            }
            options={[
              { value: "", label: "Captura manual" },
              ...(company?.instructors || []).map((p) => ({
                value: p.name,
                label: p.name,
              })),
            ]}
            onChange={(v) => {
              const p = company?.instructors.find((x) => x.name === v);
              setRecord((r) => ({
                ...r,
                instructor: {
                  ...r.instructor,
                  name: p?.name || "",
                  roleMain: p?.roleMain || "",
                },
              }));
            }}
          />
          <div className="fields">
            <Field
              label="Nombre del instructor"
              value={record.instructor.name}
              onChange={(v) => instructor("name", v)}
              error={visible["instructor.name"]}
              maxLength={100}
            />
            <Field
              label="Cargo del instructor"
              value={record.instructor.roleMain}
              onChange={(v) => instructor("roleMain", v)}
              error={visible["instructor.roleMain"]}
              maxLength={140}
            />
            <Field
              label="Nota del instructor"
              value={record.instructor.note}
              onChange={(v) => instructor("note", v)}
              maxLength={80}
            />
          </div>
        </>
      )}
    </>
  );
}
