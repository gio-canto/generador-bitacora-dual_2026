import { useId, useState, createContext, useContext } from "react";
const ValidationContext = createContext(false);
export const ValidationDisplay = ValidationContext.Provider;
export default function Field({
  label,
  value,
  onChange,
  error,
  hint,
  options,
  multiline = false,
  id: given,
  ...props
}) {
  const generated = useId(),
    id = given || generated;
  const [touched, setTouched] = useState(false);
  const force = useContext(ValidationContext);
  error = touched || force ? error : undefined;
  const Component = options ? "select" : multiline ? "textarea" : "input";
  return (
    <div className={`field ${props.className || ""}`}>
      <label htmlFor={id}>{label}</label>
      <Component
        {...props}
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
      >
        {options?.map((o) => (
          <option
            key={typeof o === "string" ? o : o.value}
            value={typeof o === "string" ? o : o.value}
          >
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </Component>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small
          className="error"
          id={`${id}-error`}
          role={touched ? "alert" : undefined}
        >
          {error}
        </small>
      )}
    </div>
  );
}
