import schools from "../data/schools.json";

const normalized=value=>String(value||"").trim().toLocaleLowerCase("es-MX")
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"");

/** Lista únicamente generaciones de eventos publicados para el plantel elegido. */
export function graduationCohorts(config,schoolName=""){
  const school=schools.find(item=>[item.id,item.name,item.shortName]
    .some(value=>normalized(value)===normalized(schoolName)));
  const names=new Set([schoolName,school?.id,school?.name,school?.shortName]
    .filter(Boolean).map(normalized));
  const found=new Map();
  for(const event of config?.events||[]){
    if(!event?.enabled||event.trigger?.type!=="graduation")continue;
    const targets=event.audience?.schools||"all";
    if(targets!=="all" &&
      (!names.size||!targets.some(value=>names.has(normalized(value)))))continue;
    const generations=event.audience?.generations;
    if(!Array.isArray(generations))continue;
    for(const id of generations){
      if(typeof id==="string"&&id.trim()&&!found.has(id)){
        found.set(id,{id,label:event.graduation?.label||event.content?.title||id});
      }
    }
  }
  return [...found.values()];
}
