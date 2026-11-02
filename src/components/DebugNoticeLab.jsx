import {useEffect,useMemo,useRef,useState} from "react";
import {NOTICE_FORMATS,NOTICE_THEMES,drawNoticeCanvas,downloadNoticePng}
 from "../services/notice-png.js";
import {loadDossierLogo} from "../services/student-dossier-report.js";
import {VERSION,RELEASE} from "../domain/records.js";
import "./debug-notice-lab.css";

const sample=(kind,deadline,message)=>{
 if(kind==="release")return {kind,title:"Versión "+VERSION,
   message:RELEASE+".",footer:""};
 if(kind==="custom")return {kind,title:"Aviso para estudiantes",
   message:message||"Presenta tu reporte en la fecha indicada.",footer:""};
 if(kind==="overflow")return {kind:"custom",title:"Comunicado",
   message:"Información extensa para comprobar el comportamiento del diseño. ".repeat(50),footer:""};
 return {kind:"reminder",title:"Entrega de bitácoras",
   message:"Entrega las semanas indicadas antes de la fecha límite.",
   weekLabels:["Semana 18","Semana 19"],
   dueAt:/^\d{4}-\d{2}-\d{2}$/.test(deadline)&&Number.isFinite(Date.parse(deadline+"T18:00:00-06:00"))
     ?new Date(deadline+"T18:00:00-06:00").toISOString():"",footer:""};
};

/** Laboratorio independiente del registro real y de los diseños guardados. */
export default function DebugNoticeLab(){
 const [kind,setKind]=useState("reminder");
 const [format,setFormat]=useState("post");
 const [theme,setTheme]=useState("editorial");
 const [deadline,setDeadline]=useState("2027-07-23");
 const [message,setMessage]=useState("Presenta tu reporte en la fecha indicada.");
 const [logo,setLogo]=useState(null);
 const [error,setError]=useState("");
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const canvasRef=useRef(null);
 const notice=useMemo(()=>sample(kind,deadline,message),[kind,deadline,message]);
 useEffect(()=>{
   let active=true;
   loadDossierLogo().then(image=>{if(active){setLogo(image);setError("");}})
     .catch(e=>{if(active){setError(e?.message||"No se pudo cargar el logotipo.");setReady(false);}});
   return ()=>{active=false;};
 },[]);
 useEffect(()=>{
   if(!logo||!canvasRef.current)return;
   try{
     drawNoticeCanvas(canvasRef.current,notice,{logo,format,theme});
     setError("");setReady(true);
   }catch(err){setReady(false);setError(err?.message||"No se pudo dibujar el aviso.");}
 },[notice,logo,format,theme]);
 const download=async()=>{
   if(!ready||busy)return;
   setBusy(true);
   try{
     await downloadNoticePng(notice,{logo,format,theme});
     setError("");
   }catch(err){setError(err?.message||"No se pudo exportar la prueba.");}
   finally{setBusy(false);}
 };
 const dimensions=NOTICE_FORMATS.find(item=>item.id===format);
 return <section className="debug-notice-lab" aria-label="Simulador de avisos PNG">
   <div className="debug-notice-controls">
     <label>Escenario PNG
       <select value={kind} onChange={event=>setKind(event.target.value)}>
         <option value="reminder">Fecha límite y semanas</option>
         <option value="release">Nueva versión</option>
         <option value="custom">Personalizado</option>
         <option value="overflow">Texto demasiado largo</option>
       </select>
     </label>
     <label>Formato de prueba
       <select value={format} onChange={event=>setFormat(event.target.value)}>
         {NOTICE_FORMATS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
       </select>
     </label>
     <label>Estilo de prueba
       <select value={theme} onChange={event=>setTheme(event.target.value)}>
         {NOTICE_THEMES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
       </select>
     </label>
     {kind==="reminder"&&<label>Fecha límite simulada
       <input type="date" value={deadline} onChange={event=>setDeadline(event.target.value)}/>
     </label>}
     {kind==="custom"&&<label className="debug-notice-wide">Texto de prueba
       <textarea rows={3} value={message} onChange={event=>setMessage(event.target.value)}
         maxLength={1000}/>
     </label>}
     <div className="debug-notice-actions">
       <span role="status">{error?"No cabe o no se pudo dibujar":ready?
         "PNG válido · "+dimensions.width+" × "+dimensions.height+" px":
         "Preparando imagen"}</span>
       <button className="debug-button primary" type="button" disabled={!ready||busy}
         onClick={download}>Descargar PNG de prueba</button>
     </div>
     {error&&<p role="alert" className="debug-notice-error">{error}</p>}
   </div>
   <div className="debug-notice-preview">
     <canvas ref={canvasRef} aria-label="Vista previa PNG de prueba" role="img"/>
   </div>
 </section>;
}
