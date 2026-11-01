
import {useMemo,useRef,useState} from "react";
import {CalendarBlank,ClipboardText,FileArrowDown,FileArrowUp,FloppyDisk,
  GraduationCap,Plus,PlayCircle,Trash,ArrowClockwise,Copy,CheckCircle,
  ArrowRight,ArrowLeft,Warning,Buildings,Users,Eye,Code,Confetti} from "@phosphor-icons/react";
import {GeneratorMessageCard} from "./GeneratorMessageHost.jsx";
import {getDefaultMessageConfig,validateMessageConfig,eligibleMessages,
  hasSeenMessage,markMessageSeen,activeGraduation} from "../services/generator-message-rules.js";
import {StudioField,StudioSwitch,StudioChoices,StudioSelect,StudioPills,
  StudioCalendar,StudioConfirmation} from "./EventStudioControls.jsx";
import schools from "../data/schools.json";
import "./event-studio.css";

const copy=value=>JSON.parse(JSON.stringify(value));
const specialties=[...new Set(schools.flatMap(s=>s.specialties||[]))];
const schoolOptions=schools.map(s=>({id:s.id,title:s.shortName||s.name}));
const specialtyOptions=specialties.map(s=>({id:s,title:s}));
const fakeStorage=()=>{const data=new Map();return {
  getItem:key=>data.get(key)||null,setItem:(key,v)=>data.set(key,v),removeItem:key=>data.delete(key)
};};
const frequencyItems=[
  {id:"once",title:"Una vez por perfil"},{id:"once-per-device",title:"Una vez por navegador"},
  {id:"once-per-year",title:"Una vez al año"},{id:"once-per-day",title:"Una vez por día"},
  {id:"once-per-session",title:"Una vez por sesión"},{id:"always",title:"Cada activación"}
];
const steps=[
  ["Eventos","Elige el mensaje que vas a modificar",ClipboardText],
  ["Destinatarios","Define quién lo verá",Users],
  ["Cuándo","Elige el momento de activación",PlayCircle],
  ["Calendario","Programa las fechas",CalendarBlank],
  ["Mensaje","Redacta y presenta el aviso",FloppyDisk],
  ["Pruebas","Comprueba el resultado",Eye],
  ["Publicar","Revisa y descarga el JSON",FileArrowDown]
];
const initialDate=event=>event?.trigger?.videoDates?.[0]||
  event?.trigger?.date||event?.trigger?.startDate||"2027-07-22";
const newEvent=(graduation=false)=>graduation?({
  id:"graduacion-"+Date.now().toString(36),revision:1,enabled:false,
  presentation:"fullscreen",trigger:{type:"graduation",startDate:"2027-07-19",endDate:"2027-07-23",
    videoDates:["2027-07-22","2027-07-23"]},
  audience:{schools:["cbtis-134"],specialties:"all"},
  content:{title:"¡Felicidades por concluir Educación Dual!",body:"Gracias por formar parte de esta generación.",
    youtubeId:null,action:null},
  graduation:{label:"Generación de Educación Dual",theme:"celebration"},
  priority:110,frequency:"once-per-day",dismissible:true
}):({
  id:"evento-"+Date.now().toString(36),revision:1,enabled:false,presentation:"tab",
  trigger:{type:"date",date:"2026-12-01"},audience:{schools:"all",specialties:"all"},
  content:{title:"Nuevo comunicado",body:"Escribe el mensaje para los alumnos.",youtubeId:null,action:null},
  priority:10,frequency:"once",dismissible:true
});
const audienceMode=audience=>audience?.schools==="all"?
  audience?.specialties==="all"?"all":"specialty":
  audience?.specialties==="all"?"school":"combined";
const typeLabel={graduation:"Graduación",date:"Por fecha","final-bitacora":"Última bitácora","on-open":"Al abrir"};
const formatLabel={tab:"Pestaña",medium:"Mediano",fullscreen:"Pantalla completa"};
function GraduationStage({event}){
  return <div className="es-graduation-stage generator-graduation-active" aria-label="Prueba del modo graduación">
    <div className="shell">
      <div className="topbar"><strong>Generador de Bitácora Dual</strong><span>Inicio</span></div>
      <div className="gm-home">
        <p className="es-stage-title">{event.graduation?.label||event.content.title}</p>
        <p className="es-stage-copy">Tema especial de graduación · Vista de prueba con la misma apariencia del generador.</p>
        <div className="es-stage-cards"><div>Mis bitácoras</div><div>Capturar semana</div></div>
      </div>
    </div>
  </div>;
}
export default function EventEditorDebug(){
  // El punto de partida es SIEMPRE el JSON incluido en la versión publicada.
  const [published]=useState(getDefaultMessageConfig);
  const [config,setConfig]=useState(getDefaultMessageConfig);
  const [selected,setSelected]=useState(0);
  const [step,setStep]=useState(0);
  const [notice,setNotice]=useState("");
  const [preview,setPreview]=useState(null);
  const [theme,setTheme]=useState(false);
  const [confirm,setConfirm]=useState(null);
  const [importText,setImportText]=useState("");
  const [textVisible,setTextVisible]=useState(false);
  const [advanced,setAdvanced]=useState(false);
  const [simDate,setSimDate]=useState(initialDate(getDefaultMessageConfig().events[0]));
  const [simSchool,setSimSchool]=useState(schools[0]?.id||"");
  const [simSpecialty,setSimSpecialty]=useState(specialties[0]||"");
  const [simMemory,setSimMemory]=useState(fakeStorage);
  const [memoryRevision,setMemoryRevision]=useState(0);
  const fileRef=useRef(null);
  const errors=useMemo(()=>validateMessageConfig(config),[config]);
  const current=config.events[selected];
  const changed=JSON.stringify(config)!==JSON.stringify(published);
  const profile={school:simSchool,specialty:simSpecialty};
  const ctx={profile,profileId:"debug-perfil",date:simDate,storage:simMemory,sessionStorage:simMemory};
  const simulatedConfig=useMemo(()=>({...config,events:config.events.map((event,index)=>
    index===selected?{...event,enabled:true}:event)}),[config,selected]);
  const eligible=current?eligibleMessages(simulatedConfig,{
    ...ctx,trigger:current.trigger.type,ignoreSeen:true
  }).some(e=>e.id===current.id):false;
  const seen=current&&hasSeenMessage(current,ctx);
  const themeActive=Boolean(current?.trigger.type==="graduation"&&activeGraduation(simulatedConfig,ctx)?.id===current.id);
  const update=patch=>setConfig(previous=>({...previous,events:previous.events.map((event,i)=>
    i===selected?{...event,...patch}:event)}));
  const detail=(key,patch)=>update({[key]:{...current[key],...patch}});
  const choose=(index,targetStep=1)=>{
    setSelected(index);setStep(targetStep);setTheme(false);setNotice("");
    setSimDate(initialDate(config.events[index]));setSimMemory(fakeStorage());
  };
  const add=(graduation=false)=>{
    const event=newEvent(graduation);
    setConfig(prev=>({...prev,events:[...prev.events,event]}));
    setSelected(config.events.length);setSimDate(initialDate(event));
    setStep(1);setNotice("Evento nuevo. Completa sus pasos antes de exportar.");
  };
  const duplicate=()=>{
    if(!current)return;
    const cloned=copy(current);cloned.id+="-copia-"+Date.now().toString(36);cloned.enabled=false;
    setConfig(prev=>({...prev,events:[...prev.events,cloned]}));
    setSelected(config.events.length);setStep(1);setNotice("Copia desactivada para revisar antes de publicarla.");
  };
  const importJSON=text=>{
    try{
      const parsed=JSON.parse(text),problems=validateMessageConfig(parsed);
      if(problems.length)throw Error(problems.join(" · "));
      setConfig(parsed);setSelected(0);setStep(0);setNotice("JSON importado. Puedes modificar sus eventos.");
      setImportText("");setTextVisible(false);
    }catch(e){setNotice("No se pudo importar: "+e.message);}
  };
  const exportJSON=()=>JSON.stringify(config,null,2)+"\n";
  const download=()=>{
    if(errors.length){setNotice("Corrige los errores antes de exportar.");return;}
    const file=URL.createObjectURL(new Blob([exportJSON()],{type:"application/json"}));
    const link=document.createElement("a");link.href=file;link.download="generator-messages.json";
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(file),1500);
    setNotice("Archivo descargado. Sustitúyelo en GitHub y crea el commit manualmente.");
  };
  const testEvent=(index)=>{
    const e=config.events[index];choose(index,5);setSimDate(initialDate(e));setPreview(e);
    // La vista previa es forzada: permite probar incluso avisos desactivados.
  };
  const audience=audienceMode(current?.audience);
  return <section className="es-studio" aria-label="Editor de eventos por pasos">
    <div className="es-source">
      <div><span className="es-source-mark"><Code size={19}/></span><div>
        <strong>Configuración publicada</strong>
        <small>src/data/generator-messages.json · {published.events.length} eventos cargados automáticamente</small>
      </div></div>
      <span className={"es-source-state"+(changed?" is-dirty":"")}>
        {changed?"Cambios sin exportar":"JSON original"}
      </span>
    </div>
    <nav className="es-steps" aria-label="Pasos del editor de eventos">
      {steps.map(([title,,Icon],index)=><button key={title} type="button"
        disabled={!current&&index!==0} aria-current={index===step?"step":undefined}
        className={index===step?"is-active":""} onClick={()=>setStep(index)}>
        <span><Icon size={17}/></span><strong>{title}</strong>
      </button>)}
    </nav>
    <div className="es-stage-head">
      <small>PASO {step+1} DE {steps.length}</small>
      <h3>{["Elige un evento","¿Quién recibirá el mensaje?","¿Cuándo aparecerá?",
        "Selecciona las fechas","Diseña el mensaje","Prueba tus eventos","Revisa y publica"][step]}</h3>
      <p>{steps[step][1]}</p>
    </div>
    {step===0&&<div className="es-stage-content">
      <div className="es-actions es-actions-leading">
        <button className="es-button es-primary" type="button" onClick={()=>add(false)}><Plus size={17}/>Nuevo mensaje</button>
        <button className="es-button" type="button" onClick={()=>add(true)}><GraduationCap size={18}/>Nueva graduación</button>
      </div>
      <div className="es-events">
        {config.events.map((event,index)=><article key={event.id+"-"+index} className="es-event">
          <div className="es-event-marker">{event.trigger.type==="graduation"?<GraduationCap size={22}/>:<ClipboardText size={21}/>}</div>
          <div className="es-event-copy">
            <strong>{event.content.title}</strong>
            <span>{typeLabel[event.trigger.type]||event.trigger.type} · {formatLabel[event.presentation]}</span>
            <small>{event.enabled?"Activo":"Desactivado"} · {event.id}</small>
          </div>
          <div className="es-event-actions">
            <button type="button" className="es-button es-primary" onClick={()=>choose(index)}>Modificar</button>
            <button type="button" className="es-button" onClick={()=>testEvent(index)}><PlayCircle size={16}/>Probar</button>
          </div>
        </article>)}
      </div>
      <div className="es-inline-options">
        <button type="button" onClick={duplicate} disabled={!current}><Copy size={17}/>Duplicar seleccionado</button>
        <button type="button" onClick={()=>setConfirm("delete")} disabled={!current}><Trash size={17}/>Eliminar seleccionado</button>
        <button type="button" onClick={()=>setConfirm("reset")} disabled={!changed}><ArrowClockwise size={17}/>Restaurar JSON publicado</button>
        <button type="button" onClick={()=>fileRef.current?.click()}><FileArrowUp size={17}/>Importar otro JSON</button>
        <input ref={fileRef} className="es-visually-hidden" type="file" accept=".json,application/json"
          aria-label="Archivo JSON de eventos" onChange={async e=>{
            const file=e.target.files?.[0];if(file)importJSON(await file.text());e.target.value="";
          }}/>
      </div>
      <div className="es-import-panel">
        <button type="button" className="es-expand" aria-expanded={textVisible}
          onClick={()=>setTextVisible(x=>!x)}><Code size={17}/>Importar JSON desde texto
          <span>{textVisible?"Ocultar":"Mostrar"}</span></button>
        {textVisible&&<><StudioField label="Contenido del JSON" value={importText}
          onChange={setImportText} multiline rows={6} help="Importa solamente si quieres reemplazar la copia de trabajo."/>
          <button className="es-button es-primary" type="button" onClick={()=>importJSON(importText)}>Cargar texto</button></>}
      </div>
    </div>}
    {current&&step===1&&<div className="es-stage-content">
      <StudioChoices label="Alcance del mensaje" value={audience} onChange={mode=>{
        if(mode==="all")update({audience:{schools:"all",specialties:"all"}});
        else if(mode==="specialty")update({audience:{schools:"all",specialties:[simSpecialty]}});
        else if(mode==="school")update({audience:{schools:[simSchool],specialties:"all"}});
        else update({audience:{schools:[simSchool],specialties:[simSpecialty]}});
      }} items={[
        {id:"all",title:"Todos los alumnos Dual",description:"Sin filtros",icon:Users},
        {id:"specialty",title:"Una especialidad",description:"En todos los planteles",icon:Users},
        {id:"school",title:"Un plantel",description:"Todas las especialidades",icon:Buildings},
        {id:"combined",title:"Plantel y especialidad",description:"Sólo alumnos coincidentes",icon:GraduationCap}
      ]}/>
      {current.audience.schools!=="all"&&
        <StudioPills label="Planteles" selection={current.audience.schools} items={schoolOptions}
          onChange={value=>detail("audience",{schools:value})} help="Puedes marcar varios."/>}
      {current.audience.specialties!=="all"&&
        <StudioPills label="Especialidad" selection={current.audience.specialties} items={specialtyOptions}
          onChange={value=>detail("audience",{specialties:value})} help="Puedes elegir varias especialidades."/>}
      <div className="es-hint">Los destinatarios se calculan desde el plantel y la especialidad guardados en cada perfil.</div>
    </div>}
    {current&&step===2&&<div className="es-stage-content">
      <StudioChoices label="Momento de activación" value={current.trigger.type} onChange={type=>{
        if(type===current.trigger.type)return;
        if(type==="graduation")update({
          trigger:{type,startDate:"2027-07-19",endDate:"2027-07-23",videoDates:["2027-07-22","2027-07-23"]},
          presentation:"fullscreen",frequency:"once-per-day",
          graduation:current.graduation||{label:"Generación Dual",theme:"celebration"}
        });
        else update({trigger:type==="date"?{type,date:"2026-12-01"}:{type}});
      }} items={[
        {id:"on-open",title:"Al abrir el generador",description:"Bienvenida o encuesta",icon:PlayCircle},
        {id:"date",title:"Por fecha",description:"Comunicado en días establecidos",icon:CalendarBlank},
        {id:"final-bitacora",title:"Al generar la última bitácora",description:"Después de confirmar el PDF",icon:ClipboardText},
        {id:"graduation",title:"Graduación con fechas de video",description:"Tema visual y felicitación",icon:GraduationCap}
      ]}/>
      <StudioSelect label="¿Cuántas veces?" value={current.frequency} items={frequencyItems}
        onChange={frequency=>update({frequency})}/>
      <div className="es-hint">La graduación puede usar varios días de video. Cada día se recuerda por separado si eliges «Una vez por día».</div>
    </div>}
    {current&&step===3&&<div className="es-stage-content">
      {current.trigger.type==="date"&&<>
        <StudioChoices label="Tipo de fecha" value={current.trigger.annualDate?"annual":"exact"}
          onChange={mode=>update({trigger:mode==="annual"?{type:"date",annualDate:"11-02"}:{type:"date",date:"2026-12-01"}})}
          items={[{id:"exact",title:"Fecha específica",description:"Año, mes y día"},
            {id:"annual",title:"Repetir cada año",description:"Mes y día"}]}/>
        {current.trigger.annualDate?
          <StudioField label="Mes y día (MM-DD)" value={current.trigger.annualDate}
            onChange={annualDate=>detail("trigger",{annualDate})} placeholder="11-02" help="Ejemplo: 11-02 para el 2 de noviembre."/>:
          <StudioCalendar label="Fecha del comunicado" value={current.trigger.date||""}
            onChange={date=>detail("trigger",{date})}/>}
      </>}
      {current.trigger.type==="graduation"&&<>
        <div className="es-hint"><strong>Dos momentos distintos:</strong> durante el periodo se muestra el diseño de graduación; sólo los días elegidos se presenta la felicitación con video.</div>
        <div className="es-calendar-pair">
          <StudioCalendar label="Inicio de graduación" value={current.trigger.startDate||""}
            onChange={startDate=>detail("trigger",{startDate})}/>
          <StudioCalendar label="Fin de graduación" value={current.trigger.endDate||""}
            onChange={endDate=>detail("trigger",{endDate})}/>
        </div>
        <StudioCalendar label="Días para mostrar el video" multiple
          min={current.trigger.startDate||""} max={current.trigger.endDate||""}
          value={current.trigger.videoDates||[]}
          onChange={videoDates=>detail("trigger",{videoDates})}
          help="Selecciona uno o varios días. Usa las flechas para cambiar de mes."/>
      </>}
      {current.trigger.type!=="graduation"&&
        <div className="es-calendar-pair">
          <StudioCalendar label="Vigente desde (opcional)" value={current.trigger.startDate||""}
            onChange={startDate=>detail("trigger",{startDate})}/>
          <StudioCalendar label="Hasta (opcional)" value={current.trigger.endDate||""}
            onChange={endDate=>detail("trigger",{endDate})}/>
        </div>}
      {current.trigger.type==="final-bitacora"&&
        <p className="es-hint">Este mensaje sólo se activa después de descargar el PDF cuando el estudiante confirma que es su última bitácora.</p>}
    </div>}
    {current&&step===4&&<div className="es-stage-content">
      {current.trigger.type==="graduation"&&<StudioField label="Nombre de la generación"
        value={current.graduation?.label||""}
        onChange={label=>update({graduation:{...current.graduation,label,theme:"celebration"}})}/>}
      <StudioField label="Título" value={current.content.title}
        onChange={title=>detail("content",{title})}/>
      <StudioField label="Texto del mensaje" value={current.content.body}
        onChange={body=>detail("content",{body})} multiline rows={5}/>
      <StudioChoices label="Presentación" value={current.presentation}
        onChange={presentation=>update({presentation})} columns={3}
        items={[{id:"tab",title:"Pestaña",description:"No bloquea",disabled:current.trigger.type==="graduation"},
          {id:"medium",title:"Mediano",description:"Ventana centrada"},
          {id:"fullscreen",title:"Pantalla completa",description:"Mensaje destacado"}]}/>
      {current.presentation!=="tab"&&<StudioField label="ID del video de YouTube (opcional)"
        value={current.content.youtubeId||""} placeholder="YUC4FH3tSOk"
        onChange={youtubeId=>detail("content",{youtubeId:youtubeId||null})}
        help="Pega sólo el ID de 11 caracteres, no la URL completa."/>}
      <StudioField label="Texto del botón externo (opcional)" value={current.content.action?.label||""}
        onChange={label=>detail("content",{action:{...current.content.action,label,url:current.content.action?.url||null}})}
        placeholder="Responder encuesta"/>
      <StudioField label="Enlace HTTPS del botón (opcional)" value={current.content.action?.url||""}
        onChange={url=>detail("content",{action:{...current.content.action,
          label:current.content.action?.label||"Abrir enlace",url:url||null}})}
        placeholder="https://..." help="El generador no recopila las respuestas de formularios externos."/>
      <button className="es-button es-primary" type="button" onClick={()=>setPreview(current)}>
        <Eye size={17}/>Vista previa del mensaje
      </button>
    </div>}
    {current&&step===5&&<div className="es-stage-content">
      <div className="es-hint"><strong>Simulador aislado.</strong> Prueba cualquier evento del JSON, incluso si está desactivado. No cambia fechas del sistema, bitácoras ni anuncios leídos.</div>
      <div className="es-sim-fields">
        <StudioCalendar label="Fecha de prueba" value={simDate} onChange={setSimDate}/>
        <div className="es-sim-profile">
          <StudioSelect label="Plantel de prueba" value={simSchool} items={schoolOptions} onChange={setSimSchool}/>
          <StudioSelect label="Especialidad de prueba" value={simSpecialty} items={specialtyOptions} onChange={setSimSpecialty}/>
          <div className="es-status">
            <strong>{eligible?"Coincide con las reglas":"No coincide con las reglas"}</strong>
            <small>{seen?"Visto en esta simulación":"Todavía no visto"} · {current.enabled?"Evento publicado activo":"Evento desactivado: prueba forzada"}</small>
          </div>
        </div>
      </div>
      <div className="es-actions">
        <button className="es-button es-primary" type="button" onClick={()=>setPreview(current)}><PlayCircle size={17}/>Ver aviso real</button>
        {current.trigger.type==="graduation"&&<button type="button" className="es-button"
          onClick={()=>setTheme(x=>!x)}><GraduationCap size={17}/>{theme?"Ocultar graduación":"Probar diseño de graduación"}</button>}
        <button type="button" className="es-button" onClick={()=>{
          markMessageSeen(current,ctx);setMemoryRevision(x=>x+1);
        }}>Marcar visto en prueba</button>
        <button type="button" className="es-button" onClick={()=>{
          setSimMemory(fakeStorage());setMemoryRevision(x=>x+1);
        }}>Reiniciar prueba</button>
      </div>
      {theme&&current.trigger.type==="graduation"&&<>
        <p className="es-hint">{themeActive?"El tema corresponde a la fecha y al perfil simulados.":"Vista forzada del tema. La fecha o el plantel simulados no coinciden todavía."}</p>
        <GraduationStage event={current}/>
      </>}
      <div className="es-library">
        <strong>Probar eventos cargados en el JSON</strong>
        {config.events.map((event,index)=><button type="button" key={event.id} onClick={()=>testEvent(index)}
          className={index===selected?"is-active":""}>
          <span>{event.content.title}<small>{event.enabled?"Activo":"Desactivado"} · {typeLabel[event.trigger.type]}</small></span>
          <PlayCircle size={20}/>
        </button>)}
      </div>
    </div>}
    {current&&step===6&&<div className="es-stage-content">
      <div className="es-summary">
        <CheckCircle size={25}/>
        <div><strong>{current.content.title}</strong>
          <span>{typeLabel[current.trigger.type]} · {formatLabel[current.presentation]} · {audience==="all"?"Todos los alumnos Dual":"Destinatarios específicos"}</span>
        </div>
      </div>
      <StudioSwitch label="Activar al publicar" checked={current.enabled} onChange={enabled=>update({enabled})}
        help="Desactivarlo conserva el evento en el JSON, pero no se presenta a los alumnos."/>
      <button className="es-expand" type="button" aria-expanded={advanced} onClick={()=>setAdvanced(x=>!x)}>
        <Code size={17}/>Datos técnicos del evento<span>{advanced?"Ocultar":"Editar"}</span>
      </button>
      {advanced&&<div className="es-advanced">
        <StudioField label="Identificador único" value={current.id} onChange={id=>update({id})}/>
        <StudioField label="Revisión" value={String(current.revision)} onChange={value=>update({revision:Number(value)})}
          help="Aumenta la revisión para volver a mostrar el evento a quien ya lo vio."/>
        <StudioField label="Prioridad" value={String(current.priority??0)} onChange={value=>update({priority:Number(value)})}/>
      </div>}
      <div className="es-validation">
        <strong>{errors.length?errors.length+" errores por corregir":"Configuración válida"}</strong>
        {errors.map((error,i)=><p key={i}><Warning size={15}/>{error}</p>)}
        {!errors.length&&<p>Se exportarán los {config.events.length} eventos, incluidos los que no modificaste.</p>}
      </div>
      <div className="es-publish">
        <strong>El commit lo haces tú en GitHub</strong>
        <p>Descarga el JSON, abre <code>src/data/generator-messages.json</code> en tu repositorio, reemplaza su contenido y guarda los cambios mediante un commit. Debug no escribe en GitHub.</p>
        <div className="es-actions">
          <button className="es-button es-primary" type="button" disabled={Boolean(errors.length)}
            onClick={download}><FileArrowDown size={18}/>Descargar JSON completo</button>
          <button className="es-button" type="button" disabled={Boolean(errors.length)}
            onClick={()=>navigator.clipboard?.writeText(exportJSON())
              .then(()=>setNotice("JSON copiado. Pégalo en el archivo del repositorio."),
                ()=>setNotice("Tu navegador no permitió copiar. Usa Descargar JSON."))}>
            <Copy size={17}/>Copiar JSON
          </button>
        </div>
      </div>
    </div>}
    <div className="es-wizard-footer">
      <button type="button" className="es-button" disabled={step===0}
        onClick={()=>setStep(s=>Math.max(0,s-1))}><ArrowLeft size={17}/>Atrás</button>
      {step<steps.length-1?<button type="button" className="es-button es-primary" disabled={!current}
        onClick={()=>setStep(s=>s+1)}>Continuar<ArrowRight size={17}/></button>:
        <button type="button" className="es-button" onClick={()=>setStep(0)}>Volver a eventos</button>}
    </div>
    {notice&&<p className="es-notice" role="status">{notice}</p>}
    {preview&&<GeneratorMessageCard event={preview} onClose={()=>setPreview(null)}/>}
    {confirm&&<StudioConfirmation title={confirm==="reset"?"Restaurar configuración publicada":"Eliminar evento"}
      body={confirm==="reset"?"Se descartarán todos los cambios locales. Se cargarán otra vez los eventos del JSON incluido en esta versión.":"Esta acción sólo elimina el evento de la copia de trabajo. Para publicarla tendrás que exportar y hacer el commit."}
      onCancel={()=>setConfirm(null)} onConfirm={()=>{
        if(confirm==="reset"){setConfig(copy(published));setSelected(0);setStep(0);setNotice("Configuración publicada restaurada.");}
        else {setConfig(prev=>({...prev,events:prev.events.filter((_,i)=>i!==selected)}));
          setSelected(0);setStep(0);setNotice("Evento eliminado de la copia de trabajo.");}
        setConfirm(null);
      }}/>}
  </section>;
}
