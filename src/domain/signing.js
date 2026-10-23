/** Firma por ausencia: el suplente firma sin borrar la identidad del titular. */
export function actingSigner({name="",role="",enabled=false,paName="",paRole=""}={}) {
  const principal=String(name||"").trim();
  const acting=enabled===true && String(paName||"").trim();
  return {
    name:acting ? String(paName).trim() : principal,
    role:acting ? String(paRole||"").trim() : String(role||"").trim(),
    principal,
    byAbsence:Boolean(acting),
    absenceLine:acting ? "P. A. de "+principal : "",
  };
}

export function paIsComplete(enabled,name,role) {
  return enabled!==true || Boolean(String(name||"").trim() && String(role||"").trim());
}

export function isDifferentSigner(name,paName) {
  const clean=value=>String(value||"").trim().toLocaleLowerCase("es-MX");
  return clean(name)!==clean(paName);
}
