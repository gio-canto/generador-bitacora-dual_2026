import {useEffect,useMemo,useRef,useState} from "react";
import {announcementOverview,createAnnouncement,visibleAnnouncements} from "../services/delivery-announcements.js";
import {VERSION,RELEASE} from "../domain/records.js";
import {
  NOTICE_FORMATS,NOTICE_THEMES,NOTICE_TEMPLATES,drawNoticeCanvas,
  downloadNoticePng,downloadNoticeBatch
} from "../services/notice-png.js";
import {loadDossierLogo} from "../services/student-dossier-report.js";

const initial={kind:"custom",title:"",subtitle:"",message:"",footer:"Generador de Bitácora Dual",
  audience:"all",audienceId:"",expiresAt:"",format:"post",theme:"editorial"};
const dateLabel=raw=>{
 if(!raw)return "";
 const date=new Date(raw);
 if(!Number.isFinite(date.getTime()))return "";
 return "ENTREGA HASTA EL "+new Intl.DateTimeFormat("es-MX",{
   day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"
 }).format(date).toLocaleUpperCase("es-MX");
};
const trim=s=>String(s||"").trim();
export default function DeliveryAnnouncements({state,onSave,onBack}){
 const [tab,setTab]=useState("automatic");
 const [form,setForm]=useState(initial);
 const [editing,setEditing]=useState("");
 const [selected,setSelected]=useState("");
 const [format,setFormat]=useState("post");
 const [theme,setTheme]=useState("editorial");
 const [logo,setLogo]=useState(null);
 const [logoError,setLogoError]=useState("");
 const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const canvasRef=useRef(null);
 const companies=useMemo(()=>[...new Set((state.students||[]).map(s=>s.company).filter(Boolean))].sort(),[state.students]);
 const specialties=useMemo(()=>[...new Set((state.students||[]).map(s=>s.specialty).filter(Boolean))].sort(),[state.students]);
 const students=useMemo(()=>[...(state.students||[])].sort((a,b)=>a.name.localeCompare(b.name,"es")),[state.students]);
 const overview=useMemo(()=>announcementOverview(state),[state]);
 const saved=useMemo(()=>visibleAnnouncements(state),[state]);
 const automatic=useMemo(()=>[
   ...overview.deadlines.map(item=>({...item,subtitle:"RECORDATORIO DE ENTREGA",
     dueLabel:dateLabel(item.dueAt),footer:"Generador de Bitácora Dual",
     format:"post",theme:"editorial"})),
   {id:"current-release",kind:"release",title:"Generador de Bitácora Dual "+VERSION,
     subtitle:"NUEVA VERSIÓN DISPONIBLE",message:RELEASE+".",
     footer:"Generador de Bitácora Dual",format:"post",theme:"editorial",
     audience:"all",audienceId:""},
 ],[overview.deadlines]);
 const gallery=useMemo(()=>[...automatic,...saved],[automatic,saved]);
 const current=gallery.find(item=>item.id===selected)||automatic[0]||saved[0]||null;
 const audienceLabel=entry=>{
   if(!entry||entry.audience==="all"||!entry.audience)return "";
   if(entry.audience==="student")return students.find(s=>s.id===entry.audienceId)?.name||"Alumno";
   return entry.audienceId||"";
 };
 const fromForm=()=>({...form,
   title:trim(form.title)||"Aviso",
   subtitle:trim(form.subtitle),
   message:trim(form.message),
   footer:trim(form.footer)||"Generador de Bitácora Dual",
   audienceLabel:audienceLabel(form),
   theme,format});
 const activeNotice=tab==="manual"?fromForm():current?{
   ...current,audienceLabel:audienceLabel(current)}:null;
 useEffect(()=>{
   let valid=true;
   loadDossierLogo().then(image=>{if(valid){setLogo(image);setLogoError("");}})
     .catch(err=>{if(valid)setLogoError(err?.message||"No se pudo cargar el logotipo.");});
   return ()=>{valid=false;};
 },[]);
 useEffect(()=>{
   if(!canvasRef.current||!logo||!activeNotice)return;
   try{
     drawNoticeCanvas(canvasRef.current,activeNotice,{logo,format,theme});
     setLogoError("");
   }catch(err){setLogoError(err?.message||"No se pudo generar la vista previa.");}
 },[logo,tab,form,selected,format,theme,current?.id,
   current?.title,current?.message,current?.subtitle,current?.dueLabel,saved]);
 const update=(key,value)=>setForm(current=>({...current,[key]:value,
   ...(key==="audience"?{audienceId:""}:{})}));
 const selectPreset=id=>{
   const template=NOTICE_TEMPLATES.find(item=>item.id===id);
   if(!template)return;
   setForm(current=>({...current,kind:id==="release"?"release":
     id==="reminder"?"reminder":"custom",
     title:template.title,subtitle:template.subtitle,message:template.message}));
 };
 const pick=(entry)=>{
   setSelected(entry.id);setTab("automatic");setError("");setNotice("");
 };
 const edit=(entry)=>{
   setEditing(entry.id);setForm({...initial,...entry});
   setFormat(entry.format||"post");setTheme(entry.theme||"editorial");
   setTab("manual");setError("");setNotice("");
 };
 const save=event=>{
   event.preventDefault();setError("");setNotice("");
   if(!trim(form.title)||!trim(form.message)){setError("Escribe el título y el mensaje.");return;}
   if(form.audience!=="all"&&!form.audienceId){setError("Selecciona el destinatario.");return;}
   const entry=createAnnouncement({...form,format,theme});
   if(!entry){setError("No se pudo guardar el diseño.");return;}
   const next=editing?(state.announcements||[]).map(item=>item.id===editing?{
     ...entry,id:editing,createdAt:item.createdAt}:item):
     [...(state.announcements||[]),entry];
   onSave(next);setEditing("");
   setNotice("Diseño guardado. Puedes exportarlo desde Avisos guardados.");
 };
 const download=async(entry=activeNotice)=>{
   if(!entry||busy)return;
   setBusy("one");setError("");setNotice("");
   try{
     await downloadNoticePng(entry,{logo,format,theme});
     setNotice("PNG descargado.");
   }catch(err){setError(err?.message||"No se pudo descargar el PNG.");}
   finally{setBusy("");}
 };
 const downloadAll=async(items)=>{
   if(!items.length||busy)return;
   setBusy("batch");setError("");setNotice("");
   try{
     const result=await downloadNoticeBatch(items,{logo,format,theme});
     setNotice(result.count+" avisos descargados en ZIP.");
   }catch(err){setError(err?.message||"No se pudo generar el ZIP.");}
   finally{setBusy("");}
 };
 return <section className="delivery-announcements delivery-png-studio" aria-label="Generador de avisos PNG">
   <header className="delivery-announcements-heading">
     <button className="btn" type="button" onClick={onBack}>← Inicio</button>
     <div><span className="delivery-kicker">Generador de Bitácora Dual</span>
       <h1>Avisos PNG</h1>
       <p>Crea avisos para compartir por WhatsApp, redes sociales o imprimir.</p>
     </div>
   </header>
   <div className="delivery-png-tabs" role="tablist" aria-label="Tipo de aviso">
     <button role="tab" type="button" aria-selected={tab==="automatic"}
       className={tab==="automatic"?"active":""} onClick={()=>setTab("automatic")}>Automáticos</button>
     <button role="tab" type="button" aria-selected={tab==="manual"}
       className={tab==="manual"?"active":""} onClick={()=>setTab("manual")}>Crear aviso</button>
   </div>
   <div className="delivery-png-layout">
     <div className="delivery-png-editor">
       {tab==="automatic"?<div className="delivery-announcement-area">
         <div className="delivery-announcement-top">
           <div><h2>Listos para compartir</h2>
             <p className="delivery-announcements-muted">Fechas del registro y versión actual.</p></div>
           <button type="button" className="btn" disabled={!!busy||!logo}
             onClick={()=>downloadAll(automatic)}>Descargar todos · ZIP</button>
         </div>
         <div className="delivery-png-picks">
           {automatic.map(entry=><article key={entry.id}
             className={"delivery-png-pick"+((current?.id===entry.id)?" selected":"")}>
             <button type="button" className="delivery-png-pick-select"
               onClick={()=>pick(entry)} aria-pressed={current?.id===entry.id}>
               <small>{entry.kind==="release"?"Actualización":"Fecha límite"}</small>
               <strong>{entry.title}</strong><span>{entry.message}</span>
             </button>
             <button type="button" className="btn" disabled={!!busy||!logo}
               onClick={()=>download({...entry,audienceLabel:audienceLabel(entry)})}>PNG</button>
           </article>)}
         </div>
         {!overview.deadlines.length&&<p className="delivery-announcements-muted">
           No hay plazos próximos en los siguientes siete días. Puedes descargar el aviso de versión o crear uno manual.</p>}
         <div className="delivery-announcement-top">
           <h2>Avisos guardados</h2>
           {saved.length>0&&<button type="button" className="btn" disabled={!!busy||!logo}
             onClick={()=>downloadAll(saved.map(s=>({...s,audienceLabel:audienceLabel(s)})))}>
             Descargar guardados · ZIP
           </button>}
         </div>
         {saved.length?<div className="delivery-png-picks">{saved.map(entry=>
           <article className={"delivery-png-pick"+(current?.id===entry.id?" selected":"")} key={entry.id}>
             <button type="button" className="delivery-png-pick-select" onClick={()=>pick(entry)}>
               <small>{entry.kind==="release"?"Novedad":"Aviso"} · {audienceLabel(entry)||"General"}</small>
               <strong>{entry.title}</strong><span>{entry.message}</span>
             </button>
             <div className="delivery-png-pick-actions">
               <button type="button" className="btn" disabled={!!busy||!logo}
                 onClick={()=>download({...entry,audienceLabel:audienceLabel(entry)})}>PNG</button>
               <button type="button" className="btn" onClick={()=>edit(entry)}>Editar</button>
               <button type="button" className="btn" onClick={()=>{
                 if(window.confirm("¿Eliminar este diseño guardado?"))
                   onSave((state.announcements||[]).filter(a=>a.id!==entry.id));
               }}>Eliminar</button>
             </div>
           </article>)}</div>:<p className="delivery-announcements-muted">
             Todavía no hay avisos guardados.</p>}
       </div>:<form className="delivery-announcement-area delivery-png-manual" onSubmit={save}>
         <div className="delivery-announcement-top"><h2>{editing?"Editar diseño":"Crear aviso"}</h2>
           {editing&&<button type="button" className="btn" onClick={()=>{
             setEditing("");setForm(initial);setFormat("post");setTheme("editorial");
           }}>Nuevo aviso</button>}</div>
         <div className="delivery-announcement-form">
           <label className="delivery-announcement-wide">Plantilla
             <select aria-label="Plantilla" value="" onChange={e=>selectPreset(e.target.value)}>
               <option value="">Elegir plantilla…</option>
               {NOTICE_TEMPLATES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
             </select>
           </label>
           <label className="delivery-announcement-wide">Título
             <input maxLength={120} required value={form.title}
               onChange={e=>update("title",e.target.value)} placeholder="Último día para entregar"/>
           </label>
           <label className="delivery-announcement-wide">Subtítulo
             <input maxLength={120} value={form.subtitle}
               onChange={e=>update("subtitle",e.target.value)}
               placeholder="RECORDATORIO DE ENTREGA"/>
           </label>
           <label className="delivery-announcement-wide">Mensaje
             <textarea rows={5} maxLength={1000} required value={form.message}
               onChange={e=>update("message",e.target.value)}
               placeholder="La fecha límite para las semanas 18, 19 y 20…"/>
           </label>
           <label>Destinatarios
             <select value={form.audience} onChange={e=>update("audience",e.target.value)}>
               <option value="all">General</option><option value="student">Alumno</option>
               <option value="company">Empresa</option><option value="specialty">Especialidad</option>
             </select>
           </label>
           {form.audience!=="all"&&<label>Seleccionar {form.audience==="student"?"alumno":
               form.audience==="company"?"empresa":"especialidad"}
             <select value={form.audienceId} onChange={e=>update("audienceId",e.target.value)}>
               <option value="">Seleccionar…</option>
               {(form.audience==="student"?students.map(s=>({value:s.id,name:s.name})):
                 (form.audience==="company"?companies:specialties).map(s=>({value:s,name:s})))
                 .map(item=><option value={item.value} key={item.value}>{item.name}</option>)}
             </select>
           </label>}
           <label>Visible hasta (opcional)
             <input type="date" value={form.expiresAt} onChange={e=>update("expiresAt",e.target.value)}/>
           </label>
           <label className="delivery-announcement-wide">Pie del aviso
             <input maxLength={160} value={form.footer}
               onChange={e=>update("footer",e.target.value)}/>
           </label>
           {form.kind==="release"&&<div className="delivery-announcement-wide">
             <button type="button" className="btn" onClick={()=>setForm(current=>({
               ...current,title:"Generador de Bitácora Dual "+VERSION,
               subtitle:"NUEVA VERSIÓN DISPONIBLE",message:"Novedades: "+RELEASE+"."}))}>
               Usar datos de la versión actual
             </button>
           </div>}
           <div className="delivery-announcement-wide delivery-announcement-actions">
             <button type="submit" className="btn">Guardar diseño</button>
             <button type="button" className="btn primary" disabled={!!busy||!logo}
               onClick={()=>download()}>Descargar PNG</button>
           </div>
         </div>
       </form>}
     </div>
     <aside className="delivery-png-preview" aria-label="Vista previa PNG">
       <div className="delivery-announcement-top"><h2>Vista previa</h2>
         <span className="delivery-announcements-muted">Imagen final</span></div>
       <div className="delivery-png-options">
         <label>Formato
           <select aria-label="Formato PNG" value={format} onChange={e=>setFormat(e.target.value)}>
             {NOTICE_FORMATS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
           </select>
         </label>
         <label>Estilo
           <select aria-label="Estilo visual" value={theme} onChange={e=>setTheme(e.target.value)}>
             {NOTICE_THEMES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
           </select>
         </label>
       </div>
       <div className="delivery-png-preview-surface">
         {logo&&activeNotice?<canvas ref={canvasRef} className="delivery-png-canvas"
           role="img" aria-label="Vista previa del aviso para compartir"/>:
           <p className="delivery-announcements-muted">Preparando vista previa…</p>}
       </div>
       {activeNotice&&<button type="button" className="btn primary"
         disabled={!!busy||!logo} onClick={()=>download()}>Descargar PNG</button>}
       {busy&&<p role="status" className="delivery-announcements-muted">
         {busy==="batch"?"Creando archivo ZIP…":"Generando imagen…"}
       </p>}
       {logoError&&<p role="alert" className="delivery-announcement-error">{logoError}</p>}
       {error&&<p role="alert" className="delivery-announcement-error">{error}</p>}
       {notice&&<p role="status" className="delivery-announcements-muted">{notice}</p>}
       <p className="delivery-announcements-muted">Los PNG se crean en tu navegador. El sistema no envía los avisos ni los datos personales.</p>
     </aside>
   </div>
 </section>;
}
