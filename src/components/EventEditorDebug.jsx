import {useMemo,useState} from "react";
import {GeneratorMessageCard} from "./GeneratorMessageHost.jsx";
import {
  getDefaultMessageConfig,validateMessageConfig,eligibleMessages,
  markMessageSeen,hasSeenMessage
} from "../services/generator-message-rules.js";
import schools from "../data/schools.json";
import "./event-editor-debug.css";

const clone=x=>JSON.parse(JSON.stringify(x));
const uniqueSpecialties=[...new Set(schools.flatMap(s=>s.specialties||[]))];
const memory=()=>{const map=new Map();return {
  getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)
};};
const newMessage=()=>({
  id:"nuevo-evento-"+Date.now().toString(36),revision:1,enabled:false,
  presentation:"tab",trigger:{type:"date",date:"2026-12-01"},
  audience:{schools:"all",specialties:"all"},
  content:{title:"Nuevo mensaje",body:"Escribe aquí el contenido.",youtubeId:null,action:null},
  priority:0,frequency:"once",dismissible:true
});
const steps=["Eventos","Destinatarios","Cuándo","Mensaje","Revisar"];
const audienceMode=({schools:target="all",specialties="all"}={})=>
  target==="all"&&specialties==="all"?"all":
  target==="all"?"specialty":specialties==="all"?"school":"school-specialty";
const checkArray=(items,value)=>{
  const arr=items==="all"?[]:items||[];
  const next=arr.includes(value)?arr.filter(x=>x!==value):[...arr,value];
  return next.length?next:"all";
};
export default function EventEditorDebug(){
  const [config,setConfig]=useState(getDefaultMessageConfig);
  const [selected,setSelected]=useState(0);
  const [step,setStep]=useState(0);
  const [source,setSource]=useState("");
  const [result,setResult]=useState("");
  const [preview,setPreview]=useState(null);
  const [date,setDate]=useState("2026-12-01");
  const [school,setSchool]=useState(schools[0]?.id||"");
  const [specialty,setSpecialty]=useState(uniqueSpecialties[0]||"");
  const [testStorage,setTestStorage]=useState(memory);
  const [refresh,setRefresh]=useState(0);
  const [showAdvanced,setShowAdvanced]=useState(false);
  const [multi,setMulti]=useState(false);
  const errors=useMemo(()=>validateMessageConfig(config),[config]);
  const current=config.events[selected];
  const profile={school,specialty},profileId="debug-student";
  const update=patch=>setConfig(previous=>({
    ...previous,events:previous.events.map((entry,i)=>i===selected?{...entry,...patch}:entry)
  }));
  const detail=(key,patch)=>update({[key]:{...current[key],...patch}});
  const chooseAudience=mode=>{
    setMulti(false);
    if(mode==="all")detail("audience",{schools:"all",specialties:"all"});
    else if(mode==="specialty")detail("audience",{schools:"all",specialties:[specialty]});
    else if(mode==="school")detail("audience",{schools:[school],specialties:"all"});
    else detail("audience",{schools:[school],specialties:[specialty]});
  };
  const importText=raw=>{
    try{
      const parsed=JSON.parse(raw),issues=validateMessageConfig(parsed);
      if(issues.length)throw Error(issues.join("\n"));
      setConfig(parsed);setSelected(0);setStep(0);setSource(raw);setResult("JSON importado.");
    }catch(e){setResult("No se pudo importar: "+e.message);}
  };
  const download=()=>{
    if(errors.length){setResult("Corrige los errores antes de exportar.");return;}
    const content=JSON.stringify(config,null,2)+"\n";
    const url=URL.createObjectURL(new Blob([content],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="generator-messages.json";
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setResult("JSON generado. Reemplaza src/data/generator-messages.json en GitHub.");
  };
  const matches=()=>eligibleMessages(config,{
    trigger:current?.trigger?.type,profile,profileId,date,
    storage:testStorage,sessionStorage:testStorage
  });
  const matching=current?matches().some(x=>x.id===current.id):false;
  const seen=current?hasSeenMessage(current,{storage:testStorage,sessionStorage:testStorage,profileId,date}):false;
  const startNew=()=>{
    const item=newMessage();
    setConfig(prev=>({...prev,events:[...prev.events,item]}));
    setSelected(config.events.length);setStep(1);setShowAdvanced(false);setResult("");
  };
  const onClone=()=>{
    if(!current)return;
    const copy=clone(current);copy.id+="-copia-"+Date.now().toString(36);copy.enabled=false;
    setConfig(prev=>({...prev,events:[...prev.events,copy]}));
    setSelected(config.events.length);setStep(1);
  };
  return <section className="debug-event-editor debug-event-wizard" aria-label="Editor de eventos por pasos">
    <nav className="debug-wizard-steps" aria-label="Pasos del editor de eventos">
      {steps.map((label,index)=><button key={label} type="button" disabled={index>0&&!current}
        aria-current={step===index?"step":undefined} className={step===index?"active":""}
        onClick={()=>setStep(index)}><span>{index+1}</span>{label}</button>)}
    </nav>
    <div className="debug-wizard-head">
      <span>Paso {step+1} de {steps.length}</span>
      <h3>{[
        "Elige un evento","¿Quién recibirá el mensaje?","¿Cuándo aparecerá?",
        "Diseña el comunicado","Comprueba y exporta"
      ][step]}</h3>
    </div>
    {step===0&&<div className="debug-wizard-panel">
      <div className="debug-row">
        <button className="debug-button primary" onClick={startNew}>Crear evento</button>
        <button className="debug-button" disabled={!current} onClick={onClone}>Duplicar</button>
        <button className="debug-button danger" disabled={!current} onClick={()=>{
          if(!window.confirm("¿Eliminar este evento de la configuración?"))return;
          setConfig(prev=>({...prev,events:prev.events.filter((_,i)=>i!==selected)}));setSelected(0);
        }}>Eliminar</button>
      </div>
      <div className="debug-event-list" role="list">
        {config.events.map((event,index)=><button key={event.id+"-"+index} type="button"
          className={selected===index?"active":""} onClick={()=>{setSelected(index);setStep(1);setMulti(false);}}>
          <strong>{event.content?.title||event.id}</strong>
          <small>{event.enabled?"Activo":"Desactivado"} · {event.presentation}</small>
        </button>)}
      </div>
      <div className="debug-event-transfer">
        <strong>Importar configuración existente</strong>
        <label>Cargar archivo JSON
          <input type="file" accept=".json,application/json" onChange={async e=>{
            const file=e.target.files?.[0];if(file)importText(await file.text());
          }}/>
        </label>
        <details><summary>Pegar JSON</summary>
          <label>Contenido JSON<textarea rows="5" value={source} onChange={e=>setSource(e.target.value)}/></label>
          <button className="debug-button" type="button" onClick={()=>importText(source)}>Importar texto</button>
        </details>
      </div>
    </div>}
    {current&&step===1&&<div className="debug-wizard-panel">
      <p>Selecciona el alcance. Los mensajes generales llegan a todos los alumnos que utilizan el generador.</p>
      <div className="debug-audience-grid" role="group" aria-label="Alcance del mensaje">
        {[
          ["all","Todos los alumnos Dual","Sin filtros de plantel o especialidad"],
          ["specialty","Una especialidad","En todos los planteles"],
          ["school","Un plantel","Todas sus especialidades"],
          ["school-specialty","Plantel y especialidad","Sólo la combinación elegida"]
        ].map(([mode,label,caption])=><button type="button" key={mode} onClick={()=>chooseAudience(mode)}
          aria-pressed={!multi&&audienceMode(current.audience)===mode}
          className={!multi&&audienceMode(current.audience)===mode?"active":""}>
          <strong>{label}</strong><small>{caption}</small>
        </button>)}
      </div>
      {current.audience.schools!=="all"&&!multi&&<label>Plantel
        <select value={current.audience.schools?.[0]||school} onChange={e=>detail("audience",{schools:[e.target.value]})}>
          {schools.map(s=><option key={s.id} value={s.id}>{s.shortName||s.name}</option>)}
        </select>
      </label>}
      {current.audience.specialties!=="all"&&!multi&&<label>Especialidad
        <select value={current.audience.specialties?.[0]||specialty} onChange={e=>detail("audience",{specialties:[e.target.value]})}>
          {uniqueSpecialties.map(s=><option key={s}>{s}</option>)}
        </select>
      </label>}
      <details open={multi} onToggle={e=>setMulti(e.currentTarget.open)}>
        <summary>Selección múltiple</summary>
        <p>Escoge varios planteles o especialidades. Sin selección significa todos.</p>
        <div className="debug-audience-checks">
          <fieldset><legend>Planteles</legend>
            <label><input type="checkbox" checked={current.audience.schools==="all"}
              onChange={()=>detail("audience",{schools:"all"})}/> Todos los planteles</label>
            {schools.map(s=><label key={s.id}>
              <input type="checkbox" checked={current.audience.schools!=="all"&&current.audience.schools.includes(s.id)}
                onChange={()=>detail("audience",{schools:checkArray(current.audience.schools,s.id)})}/>
              {s.shortName||s.name}</label>)}
          </fieldset>
          <fieldset><legend>Especialidades</legend>
            <label><input type="checkbox" checked={current.audience.specialties==="all"}
              onChange={()=>detail("audience",{specialties:"all"})}/> Todas las especialidades</label>
            {uniqueSpecialties.map(s=><label key={s}>
              <input type="checkbox" checked={current.audience.specialties!=="all"&&current.audience.specialties.includes(s)}
                onChange={()=>detail("audience",{specialties:checkArray(current.audience.specialties,s)})}/>{s}</label>)}
          </fieldset>
        </div>
      </details>
    </div>}
    {current&&step===2&&<div className="debug-wizard-panel">
      <div className="debug-audience-grid" role="group" aria-label="Activación">
        {[
          ["on-open","Al abrir el generador"],
          ["date","Por fecha"],
          ["final-bitacora","Al generar la última bitácora"]
        ].map(([type,label])=><button type="button" key={type}
          aria-pressed={current.trigger.type===type} className={current.trigger.type===type?"active":""}
          onClick={()=>update({trigger:type==="date"?{type,date:date}:{type}})}>
          <strong>{label}</strong></button>)}
      </div>
      {current.trigger.type==="date"&&<div className="debug-event-fields">
        <label>Tipo de fecha <select value={current.trigger.annualDate?"annual":"exact"}
          onChange={e=>update({trigger:e.target.value==="annual"?{type:"date",annualDate:"11-02"}:{type:"date",date}})}>
          <option value="exact">Fecha exacta</option><option value="annual">Cada año</option></select></label>
        {current.trigger.annualDate?<label>Mes y día (MM-DD)
          <input placeholder="11-02" value={current.trigger.annualDate}
            onChange={e=>detail("trigger",{annualDate:e.target.value})}/></label>:
          <label>Fecha <input type="date" value={current.trigger.date||""}
            onChange={e=>detail("trigger",{date:e.target.value})}/></label>}
      </div>}
      <div className="debug-event-fields">
        <label>Inicio opcional <input type="date" value={current.trigger.startDate||""}
          onChange={e=>detail("trigger",{startDate:e.target.value||null})}/></label>
        <label>Fin opcional <input type="date" value={current.trigger.endDate||""}
          onChange={e=>detail("trigger",{endDate:e.target.value||null})}/></label>
      </div>
      <label>¿Cuántas veces? <select value={current.frequency} onChange={e=>update({frequency:e.target.value})}>
        <option value="once">Una vez por perfil</option>
        <option value="once-per-device">Una vez por dispositivo</option>
        <option value="once-per-year">Una vez cada año</option>
        <option value="once-per-session">Una vez por sesión</option>
        <option value="always">Cada vez que se active</option>
      </select></label>
    </div>}
    {current&&step===3&&<div className="debug-wizard-panel">
      <label>Título <input value={current.content.title}
        onChange={e=>detail("content",{title:e.target.value})}/></label>
      <label>Texto <textarea rows="5" value={current.content.body}
        onChange={e=>detail("content",{body:e.target.value})}/></label>
      <div className="debug-audience-grid" role="group" aria-label="Formato del aviso">
        {[
          ["tab","Pestaña","Flotante"],
          ["medium","Mediano","Ventana"],
          ["fullscreen","Pantalla completa","Destacado"]
        ].map(([mode,label,hint])=><button type="button" key={mode}
          className={current.presentation===mode?"active":""} aria-pressed={current.presentation===mode}
          onClick={()=>update({presentation:mode})}><strong>{label}</strong><small>{hint}</small></button>)}
      </div>
      {current.presentation!=="tab"&&<label>ID de YouTube (opcional)
        <input placeholder="11 caracteres del video" value={current.content.youtubeId||""}
          onChange={e=>detail("content",{youtubeId:e.target.value||null})}/></label>}
      <details>
        <summary>Agregar enlace o encuesta</summary>
        <div className="debug-event-fields">
          <label>Texto del botón
            <input placeholder="Responder encuesta" value={current.content.action?.label||""}
              onChange={e=>detail("content",{action:{label:e.target.value,url:current.content.action?.url||null}})}/></label>
          <label>Enlace HTTPS
            <input type="url" placeholder="https://..." value={current.content.action?.url||""}
              onChange={e=>detail("content",{action:{label:current.content.action?.label||"Abrir",url:e.target.value||null}})}/></label>
        </div>
      </details>
      <button type="button" className="debug-button" onClick={()=>setPreview(current)}>Vista previa del mensaje</button>
    </div>}
    {step===4&&<div className="debug-wizard-panel">
      <div className="debug-wizard-summary">
        <strong>{current?.content.title}</strong>
        <span>{audienceMode(current?.audience)==="all"?"Todos los alumnos Dual":"Público específico"} · {current?.presentation} · {current?.trigger.type}</span>
      </div>
      <label className="debug-event-check"><input type="checkbox" checked={!!current?.enabled}
        onChange={e=>update({enabled:e.target.checked})}/> Activar evento al publicar</label>
      <details open={showAdvanced} onToggle={e=>setShowAdvanced(e.currentTarget.open)}>
        <summary>Opciones avanzadas</summary>
        <div className="debug-event-fields">
          <label>ID <input value={current?.id||""} onChange={e=>update({id:e.target.value})}/></label>
          <label>Revisión <input type="number" min="1" value={current?.revision||1}
            onChange={e=>update({revision:Number(e.target.value)})}/></label>
          <label>Prioridad <input type="number" value={current?.priority||0}
            onChange={e=>update({priority:Number(e.target.value)})}/></label>
        </div>
      </details>
      <div className="debug-event-test">
        <strong>Probar destinatario y fecha</strong>
        <div className="debug-event-fields">
          <label>Fecha <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          <label>Plantel <select value={school} onChange={e=>setSchool(e.target.value)}>
            {schools.map(s=><option value={s.id} key={s.id}>{s.shortName||s.name}</option>)}</select></label>
          <label>Especialidad <select value={specialty} onChange={e=>setSpecialty(e.target.value)}>
            {uniqueSpecialties.map(s=><option key={s}>{s}</option>)}</select></label>
        </div>
        <p role="status">Evento seleccionado: <strong>{matching?"Coincide":"No coincide"}</strong>{seen?" · Ya visto en esta prueba":""}</p>
        <div className="debug-row">
          <button className="debug-button" onClick={()=>setPreview(current)}>Vista previa</button>
          <button className="debug-button" onClick={()=>{
            const found=matches();
            found.forEach(event=>markMessageSeen(event,{storage:testStorage,sessionStorage:testStorage,profileId,date}));
            setRefresh(x=>x+1);setResult(found.length+" mensaje(s) marcados como vistos en la simulación.");
          }}>Simular lectura</button>
          <button className="debug-button" onClick={()=>{setTestStorage(memory());setRefresh(x=>x+1);setResult("Memoria de prueba reiniciada.");}}>Reiniciar lectura</button>
        </div>
      </div>
      {errors.length>0&&<pre className="debug-event-errors" role="alert">{errors.join("\n")}</pre>}
      <div className="debug-event-transfer">
        <strong>Publicar configuración</strong>
        <div className="debug-row">
          <button className="debug-button primary" disabled={!!errors.length} onClick={download}>Descargar JSON</button>
          <button className="debug-button" disabled={!!errors.length} onClick={()=>setSource(JSON.stringify(config,null,2)+"\n")}>Generar texto</button>
          <button className="debug-button" disabled={!!errors.length}
            onClick={()=>navigator.clipboard?.writeText(JSON.stringify(config,null,2)+"\n")
              .then(()=>setResult("JSON copiado."),()=>setResult("No se pudo copiar."))}>Copiar JSON</button>
        </div>
        {source&&<label>JSON generado <textarea rows="7" value={source} onChange={e=>setSource(e.target.value)}/></label>}
        <p>Descarga el archivo y reemplaza <code>src/data/generator-messages.json</code> en el repositorio.</p>
      </div>
    </div>}
    <div className="debug-wizard-footer">
      <button className="debug-button" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}>Atrás</button>
      {step<steps.length-1&&<button className="debug-button primary" disabled={!current}
        onClick={()=>setStep(s=>Math.min(steps.length-1,s+1))}>Continuar</button>}
      {step===4&&<button className="debug-button" onClick={()=>setStep(0)}>Volver a eventos</button>}
    </div>
    {result&&<p role="status" className="debug-wizard-result">{result}</p>}
    {preview&&<GeneratorMessageCard event={preview} onClose={()=>setPreview(null)}/>}
  </section>;
}
