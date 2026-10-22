import { normalizeGroup } from "./delivery-registry.js";
// Importación tolerante a formatos escolares con portadas, celdas combinadas y encabezados desplazados.
const clean = v => String(v ?? "").replace(/\s+/g, " ").trim();
const normalized = v => clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g,"");
const column = (header, aliases) => header.findIndex(v => aliases.some(a => normalized(v) === normalized(a)));
const PERSON = ["nombre del alumno","nombre del estudiante","nombre completo","alumno","estudiante","nombre"];
const SPECIALTY = ["especialidad","carrera"];
const COMPANY = ["dependencia","empresa","empresa u organismo","organismo"];
const GROUP = ["semestre y grupo","semestre grupo","grupo","semestre/grupo"];
const GENDER = ["genero","sexo"];
export const parseImportedGender = v => {
  const x=normalized(v);
  return ["h","hombre","masculino","male"].includes(x) ? "male"
    : ["m","mujer","femenino","female"].includes(x) ? "female"
    : ["nb","nobinario","nonbinary"].includes(x) ? "nonbinary"
    : ["otro","other"].includes(x) ? "other"
    : ["prefieronodecir","noresponde","undisclosed"].includes(x) ? "undisclosed" : "";
};
export function normalizeSpecialty(value) {
  const x = normalized(value);
  const aliases = {
    programacion: "Programación", prgramacion:"Programación",
    contabilidad: "Contabilidad", ofimatica:"Ofimática",
    arh:"Administración de Recursos Humanos", administracionderecursoshumanos:"Administración de Recursos Humanos",
  };
  return aliases[x] || clean(value);
}
export function parseStudentSpreadsheet(rows) {
  if (!Array.isArray(rows) || !rows.length)
    throw new Error("El archivo no contiene una tabla de alumnos.");
  const grid = rows.map(r=>Array.isArray(r) ? r : Object.values(r || {}));
  let head=-1, indices=null;
  for (let row=0;row<Math.min(100,grid.length);row++){
    const values=grid[row];
    const n=column(values,PERSON), s=column(values,SPECIALTY),c=column(values,COMPANY);
    if(n>=0&&s>=0&&c>=0){
      head=row;
      indices={name:n,specialty:s,company:c,group:column(values,GROUP),gender:column(values,GENDER)};
      break;
    }
  }
  if (head < 0)
    throw new Error("No se encontraron las columnas Nombre del alumno, Especialidad y Dependencia/Empresa.");
  const students=[],warnings=[],seen=new Set();
  for(let row=head+1;row<grid.length;row++){
    const data=grid[row], name=clean(data[indices.name]);
    if(!name)continue;
    const specialty=normalizeSpecialty(data[indices.specialty]);
    const company=clean(data[indices.company]);
    if(!specialty||!company){
      warnings.push({row:row+1,message:"Falta especialidad o dependencia"});
      continue;
    }
    if(name.length>180||specialty.length>120||company.length>220){
      warnings.push({row:row+1,message:"Uno de los campos excede el tamaño permitido"});
      continue;
    }
    const key=normalized(name);
    if(seen.has(key)){
      warnings.push({row:row+1,message:"Alumno repetido en el archivo"});
      continue;
    }
    seen.add(key);
    students.push({
      name,
      specialty,
      company,
      group: indices.group>=0?normalizeGroup(data[indices.group]):"",
      gender:indices.gender>=0?parseImportedGender(data[indices.gender]):"",
    });
  }
  if(!students.length) throw new Error("La tabla no contiene alumnos válidos.");
  return {students,warnings,headerRow:head+1};
}
