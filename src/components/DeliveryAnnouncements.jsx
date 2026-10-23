import {useMemo,useState} from "react";
import {announcementOverview,createAnnouncement,visibleAnnouncements} from "../services/delivery-announcements.js";

const initial={kind:"custom",title:"",message:"",audience:"all",audienceId:"",expiresAt:""};
export default function DeliveryAnnouncements({state,onSave,onBack}){
 const [form,setForm]=useState(initial);
 const [editing,setEditing]=useState("");
 const [error,setError]=useState("");
 const [preview,setPreview]=useState(false);
 const [filter,setFilter]=useState("all");
 const companies=[...new Set(state.students.map(s=>s.company).filter(Boolean))].sort();
 const specialties=[...new Set(state.students.map(s=>s.specialty).filter(Boolean))].sort();
 const students=[...state.students].sort((a,b)=>a.name.localeCompare(b.name,"es"));
 const overview=useMemo(()=>announcementOverview(state),[state]);
 const list=useMemo(()=>visibleAnnouncements(state),[state]);
 const update=(field,value)=>setForm(current=>({...current,[field]:value,
   ... (field==="audience"?{audienceId:""}:{})}));
 const save=event=>{
   event.preventDefault();setError("");
   if(!form.title.trim()||!form.message.trim()){setError("Indica el título y el mensaje.");return;}
   if(form.audience!=="all"&&!form.audienceId){setError("Selecciona el destinatario.");return;}
   const entry=createAnnouncement(form);
   if(!entry){setError("No se pudo guardar el aviso.");return;}
   const announcements=editing
     ? (state.announcements||[]).map(item=>item.id===editing?{...entry,id:editing,createdAt:item.createdAt}:item)
     : [...(state.announcements||[]),entry];
   onSave(announcements);
   setForm(initial);setEditing("");setPreview(false);
 };
 const startEdit=item=>{
   setEditing(item.id);
   setForm({kind:item.kind,title:item.title,message:item.message,
     audience:item.audience,audienceId:item.audienceId,expiresAt:item.expiresAt});
   setPreview(false);
 };
 const visibleFor=item=>{
   if(item.audience==="all")return "Todos";
   if(item.audience==="student")return students.find(s=>s.id===item.audienceId)?.name||"Alumno";
   return item.audienceId||"Sin destinatario";
 };
 const rendered=filter==="all"?list:list.filter(item=>item.kind===filter);
 return <section className="delivery-announcements" aria-label="Centro de anuncios">
   <header className="delivery-announcements-heading">
     <button className="btn" type="button" onClick={onBack}>← Inicio</button>
     <div><span className="delivery-kicker">Registro de entregas</span><h1>Anuncios</h1>
       <p>Recordatorios y avisos para el plantel.</p></div>
   </header>
   <section className="delivery-announcement-area" aria-label="Fechas próximas">
     <h2>Próximas entregas</h2>
     {overview.deadlines.length?overview.deadlines.map(item=>
       <article className="delivery-announcement-note" key={item.id}>
         <span className="delivery-announcement-type">Fecha límite</span>
         <strong>{item.title}</strong>
         <p>{item.message}</p>
       </article>):<p className="delivery-announcements-muted">No hay fechas límite en los próximos siete días.</p>}
   </section>
   <section className="delivery-announcement-area">
     <div className="delivery-announcement-top"><h2>Avisos guardados</h2>
       <label>Mostrar <select value={filter} onChange={e=>setFilter(e.target.value)}>
         <option value="all">Todos</option><option value="custom">Personalizados</option>
         <option value="release">Novedades</option>
       </select></label></div>
     {rendered.length?<div className="delivery-announcement-list">{rendered.map(item=>
       <article className="delivery-announcement-note" key={item.id}>
         <span className="delivery-announcement-type">{item.kind==="release"?"Novedad":"Aviso"} · {visibleFor(item)}</span>
         <strong>{item.title}</strong><p>{item.message}</p>
         {item.expiresAt&&<small>Hasta {item.expiresAt}</small>}
         <div className="delivery-announcement-actions">
           <button className="btn" type="button" onClick={()=>startEdit(item)}>Editar</button>
           <button className="btn" type="button" onClick={()=>{
             if(window.confirm("¿Eliminar este anuncio?"))
               onSave((state.announcements||[]).filter(a=>a.id!==item.id));
           }}>Eliminar</button>
         </div>
       </article>)}</div>:
       <p className="delivery-announcements-muted">No hay anuncios para mostrar.</p>}
   </section>
   <section className="delivery-announcement-area">
     <h2>{editing?"Editar anuncio":"Nuevo anuncio"}</h2>
     <form className="delivery-announcement-form" onSubmit={save}>
       <label>Tipo
         <select value={form.kind} onChange={e=>update("kind",e.target.value)}>
           <option value="custom">Aviso personalizado</option>
           <option value="release">Novedad de la aplicación</option>
         </select>
       </label>
       <label>Destinatarios
         <select value={form.audience} onChange={e=>update("audience",e.target.value)}>
           <option value="all">Todos</option>
           <option value="specialty">Especialidad</option>
           <option value="company">Empresa</option>
           <option value="student">Alumno</option>
         </select>
       </label>
       {form.audience!=="all"&&<label>Seleccionar {form.audience==="student"?"alumno":form.audience==="company"?"empresa":"especialidad"}
         <select value={form.audienceId} onChange={e=>update("audienceId",e.target.value)}>
           <option value="">Seleccionar…</option>
           {(form.audience==="student"?students.map(s=>({value:s.id,name:s.name})):
             (form.audience==="company"?companies:specialties).map(s=>typeof s==="string"?{value:s,name:s}:s))
             .map(s=><option key={s.value} value={s.value}>{s.name}</option>)}
         </select>
       </label>}
       <label className="delivery-announcement-wide">Título
         <input value={form.title} maxLength={120} onChange={e=>update("title",e.target.value)}
           placeholder="Recordatorio de bitácoras" required/>
       </label>
       <label className="delivery-announcement-wide">Mensaje
         <textarea value={form.message} maxLength={1000} rows={4} required
           onChange={e=>update("message",e.target.value)}
           placeholder="Recuerda presentar la bitácora de la semana…"/>
       </label>
       <label>Mostrar hasta (opcional)
         <input type="date" value={form.expiresAt} onChange={e=>update("expiresAt",e.target.value)}/>
       </label>
       <div className="delivery-announcement-wide delivery-announcement-actions">
         <button type="button" className="btn" onClick={()=>setPreview(p=>!p)}>
           {preview?"Ocultar vista previa":"Vista previa"}
         </button>
         {editing&&<button type="button" className="btn" onClick={()=>{
           setEditing("");setForm(initial);setPreview(false);
         }}>Cancelar edición</button>}
         <button type="submit" className="btn primary">{editing?"Guardar cambios":"Publicar aviso local"}</button>
       </div>
       {error&&<p role="alert" className="delivery-announcement-error">{error}</p>}
       {preview&&<div className="delivery-announcement-note delivery-announcement-wide">
         <span className="delivery-announcement-type">Vista previa · {form.kind==="release"?"Novedad":"Aviso"}</span>
         <strong>{form.title||"Título"}</strong><p>{form.message||"Mensaje"}</p></div>}
     </form>
     <p className="delivery-announcements-muted">Los avisos se guardan en este registro local y en sus respaldos. No se envían a teléfonos ni a otros navegadores.</p>
   </section>
 </section>;
}
