import {useMemo,useState} from "react";
import {GeneratorMessageCard} from "./GeneratorMessageHost.jsx";
import {getDefaultMessageConfig,validateMessageConfig,eligibleMessages,markMessageSeen,hasSeenMessage} from "../services/generator-message-rules.js";
import schools from "../data/schools.json";
import "./event-editor-debug.css";

const clone=x=>JSON.parse(JSON.stringify(x));
const newMessage=()=>({
  id:"nuevo-evento-"+Date.now().toString(36),revision:1,enabled:false,
  presentation:"tab",trigger:{type:"date",date:"2026-12-01"},
  audience:{schools:"all",specialties:"all"},
  content:{title:"Nuevo mensaje",body:"Escribe aquí el contenido.",youtubeId:null,action:null},
  priority:0,frequency:"once",dismissible:true
});
const memory=()=>{const map=new Map();return {
  getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),
  removeItem:key=>map.delete(key)
}};
const selection=x=>x==="all"?"all":x.length?x:"all";
const textList=x=>x==="all"?"":(x||[]).join(", ");
export default function EventEditorDebug(){
  const [config,setConfig]=useState(getDefaultMessageConfig);
  const [selected,setSelected]=useState(0);
  const [source,setSource]=useState("");
  const [result,setResult]=useState("");
  const [preview,setPreview]=useState(null);
  const [date,setDate]=useState("2026-12-01");
  const [school,setSchool]=useState(schools[0]?.id||"");
  const [specialty,setSpecialty]=useState(schools[0]?.specialties?.[0]||"");
  const [testStorage,setTestStorage]=useState(memory);
  const [refresh,setRefresh]=useState(0);
  const errors=useMemo(()=>validateMessageConfig(config),[config]);
  const current=config.events[selected];
  const profile={school,specialty},profileId="debug-student";
  const update=patch=>setConfig(previous=>({...previous,events:previous.events.map((x,i)=>i===selected?{...x,...patch}:x)}));
  const detail=(key,patch)=>update({[key]:{...current[key],...patch}});
  const importText=raw=>{
    try{
      const parsed=JSON.parse(raw);
      const issues=validateMessageConfig(parsed);
      if(issues.length)throw Error(issues.join("\n"));
      setConfig(parsed);setSelected(0);setSource(raw);setResult("Configuración importada.");
    }catch(e){setResult("Error: "+e.message);}
  };
  const download=()=>{
    if(errors.length){setResult("Corrige los errores antes de exportar.");return;}
    const body=JSON.stringify(config,null,2)+"\n";
    const object=URL.createObjectURL(new Blob([body],{type:"application/json"}));
    const a=document.createElement("a");a.href=object;a.download="generator-messages.json";
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),1000);
    setResult("Archivo listo para subir a src/data/generator-messages.json.");
  };
  const test=()=>eligibleMessages(config,{trigger:current?.trigger?.type,profile,profileId,date,
    storage:testStorage,sessionStorage:testStorage,ignoreSeen:false});
  const matching= current?test().some(x=>x.id===current.id):false;
  return <section className="debug-event-editor" aria-label="Editor visual de eventos">
    <div className="debug-row">
      <button className="debug-button" onClick={()=>{const item=newMessage();setConfig(c=>({...c,events:[...c.events,item]}));setSelected(config.events.length);}}>Nuevo evento</button>
      <button className="debug-button" disabled={!current} onClick={()=>{const copy=clone(current);copy.id+="-" + Date.now().toString(36);copy.enabled=false;setConfig(c=>({...c,events:[...c.events,copy]}));setSelected(config.events.length);}}>Duplicar</button>
      <button className="debug-button" disabled={!current} onClick={()=>{if(!window.confirm("¿Eliminar este evento de la configuración local?"))return;setConfig(c=>({...c,events:c.events.filter((_,i)=>i!==selected)}));setSelected(0);}}>Eliminar</button>
    </div>
    <div className="debug-event-list">{config.events.map((e,i)=><button type="button" key={e.id+"-"+i}
      className={i===selected?"active":""} onClick={()=>setSelected(i)}>
      {e.content?.title||e.id}<small>{e.enabled?"Activo":"Desactivado"} · {e.presentation}</small>
    </button>)}</div>
    {current&&<div className="debug-event-fields">
      <label>ID <input value={current.id} onChange={e=>update({id:e.target.value})}/></label>
      <label>Revisión <input type="number" min="1" value={current.revision} onChange={e=>update({revision:Number(e.target.value)})}/></label>
      <label>Formato <select value={current.presentation} onChange={e=>update({presentation:e.target.value})}>
        <option value="tab">Pestaña</option><option value="medium">Mediano</option><option value="fullscreen">Pantalla completa</option></select></label>
      <label>Activación <select value={current.trigger.type} onChange={e=>update({trigger:{type:e.target.value,...(e.target.value==="date"?{date:date}:{})}})}>
        <option value="on-open">Al abrir</option><option value="date">Fecha</option><option value="final-bitacora">Última bitácora</option></select></label>
      {current.trigger.type==="date"&&<label>Fecha exacta <input type="date" value={current.trigger.date||""} onChange={e=>detail("trigger",{date:e.target.value,annualDate:undefined})}/></label>}
      {current.trigger.type==="date"&&<label>Fecha anual (MM-DD) <input placeholder="11-02" value={current.trigger.annualDate||""} onChange={e=>detail("trigger",{annualDate:e.target.value,date:undefined})}/></label>}
      <label>Desde <input type="date" value={current.trigger.startDate||""} onChange={e=>detail("trigger",{startDate:e.target.value||null})}/></label>
      <label>Hasta <input type="date" value={current.trigger.endDate||""} onChange={e=>detail("trigger",{endDate:e.target.value||null})}/></label>
      <label>Escuelas (IDs, separados por coma o vacío para todas)
        <input value={textList(current.audience.schools)} onChange={e=>detail("audience",{schools:selection(e.target.value.split(",").map(x=>x.trim()).filter(Boolean))})}/></label>
      <label>Especialidades (separadas por coma o vacío para todas)
        <input value={textList(current.audience.specialties)} onChange={e=>detail("audience",{specialties:selection(e.target.value.split(",").map(x=>x.trim()).filter(Boolean))})}/></label>
      <label>Título <input value={current.content.title} onChange={e=>detail("content",{title:e.target.value})}/></label>
      <label className="span-all">Mensaje <textarea rows="3" value={current.content.body} onChange={e=>detail("content",{body:e.target.value})}/></label>
      <label>ID YouTube (opcional) <input placeholder="11 caracteres" value={current.content.youtubeId||""} onChange={e=>detail("content",{youtubeId:e.target.value||null})}/></label>
      <label>Texto del botón <input placeholder="Responder encuesta" value={current.content.action?.label||""} onChange={e=>detail("content",{action:{label:e.target.value,url:current.content.action?.url||null}})}/></label>
      <label>URL del botón <input type="url" placeholder="https://..." value={current.content.action?.url||""} onChange={e=>detail("content",{action:{label:current.content.action?.label||"Abrir",url:e.target.value||null}})}/></label>
      <label>Frecuencia <select value={current.frequency} onChange={e=>update({frequency:e.target.value})}>
        <option value="once">Una vez por perfil</option><option value="once-per-device">Una vez por dispositivo</option>
        <option value="once-per-year">Una vez al año</option><option value="once-per-session">Una vez por sesión</option>
        <option value="always">Cada activación</option></select></label>
      <label>Prioridad <input type="number" value={current.priority||0} onChange={e=>update({priority:Number(e.target.value)})}/></label>
      <label className="debug-event-check"><input type="checkbox" checked={current.enabled} onChange={e=>update({enabled:e.target.checked})}/> Activado</label>
    </div>}
    <div className="debug-event-test">
      <strong>Simulador de destinatario y fecha</strong>
      <div className="debug-event-fields">
        <label>Fecha <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label>Plantel <select value={school} onChange={e=>setSchool(e.target.value)}>
          {schools.map(s=><option value={s.id} key={s.id}>{s.shortName}</option>)}</select></label>
        <label>Especialidad <select value={specialty} onChange={e=>setSpecialty(e.target.value)}>
          {Array.from(new Set(schools.flatMap(s=>s.specialties||[]))).map(s=><option key={s}>{s}</option>)}</select></label>
      </div>
      <p>Condiciones del evento seleccionado: <strong>{matching?"Coincide":"No coincide"}</strong>. {current&&hasSeenMessage(current,{storage:testStorage,sessionStorage:testStorage,profileId,date})?"Ya visto en simulación.":""}</p>
      <div className="debug-row">
        <button className="debug-button primary" disabled={!current} onClick={()=>setPreview(current)}>Vista previa real</button>
        <button className="debug-button" onClick={()=>{const all=test();if(all.length){all.forEach(e=>markMessageSeen(e,{storage:testStorage,sessionStorage:testStorage,profileId,date}));setResult(all.length+" evento(s) marcados como vistos.");}else setResult("Sin eventos activos que coincidan.");setRefresh(x=>x+1);}}>Simular lectura</button>
        <button className="debug-button" onClick={()=>{setTestStorage(memory());setRefresh(x=>x+1);setResult("Memoria de simulación reiniciada.");}}>Reiniciar lectura</button>
      </div>
    </div>
    <div className="debug-event-transfer">
      <label>Importar JSON desde texto<textarea rows="4" value={source} onChange={e=>setSource(e.target.value)} placeholder="Pega un JSON de eventos"/></label>
      <div className="debug-row">
        <input type="file" accept=".json,application/json" aria-label="Subir JSON de eventos" onChange={async e=>{const file=e.target.files?.[0];if(file)importText(await file.text());}}/>
        <button className="debug-button" onClick={()=>importText(source)}>Importar texto</button>
        <button className="debug-button" disabled={!!errors.length} onClick={()=>setSource(JSON.stringify(config,null,2))}>Generar texto</button>
        <button className="debug-button primary" disabled={!!errors.length} onClick={download}>Descargar JSON</button>
        <button className="debug-button" disabled={!!errors.length} onClick={()=>navigator.clipboard?.writeText(JSON.stringify(config,null,2)).then(()=>setResult("JSON copiado."),()=>setResult("No fue posible copiar."))}>Copiar</button>
      </div>
      {errors.length>0&&<pre className="debug-event-errors" role="alert">{errors.join("\n")}</pre>}
      {result&&<p role="status">{result}</p>}
    </div>
    {preview&&<GeneratorMessageCard event={preview} onClose={()=>setPreview(null)}/>}
  </section>;
}
