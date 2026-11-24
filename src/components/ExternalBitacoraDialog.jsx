import {useEffect,useRef,useState} from "react";
import {EXTERNAL_MAX_FILES,extractExternalFields,suggestExternalStudent,suggestExternalWeek,suggestExternalWeekPeriod,applyExternalLearning,externalCompanyOptions,suggestExternalCompany,externalKey,
  externalDaysToStatistics,externalReviewMetadata} from "../services/external-bitacora.js";
import {readExternalBitacora,createExternalWorker,externalFileKind} from "../services/external-ocr.js";
import {buildManualStatistics,reasonsForStatus,MANUAL_DAYS} from "../services/manual-statistics.js";
import {eventsForSchool,EVENT_PHASE_LABELS,specialEventByCode} from "../services/special-events.js";
import "../external-bitacora.css";

function statusLabel(value){
 return {laboral:"Con labores",falta:"Falta",sin_labores:"Sin labores",inhabil:"Día inhábil",evento:"Evento especial"}[value]||"Sin clasificar";
}
function duration(start,end){
 if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end))return "";
 const a=Number(start.slice(0,2))*60+Number(start.slice(3));
 const b=Number(end.slice(0,2))*60+Number(end.slice(3));
 return b>a?String((b-a)/60):"";
}
export default function ExternalBitacoraDialog({students,weeks,school,loadPdfJs,onClose,onSave,onCreateWeek,learningExamples=[]}){
 const [items,setItems]=useState([]);
 const [selected,setSelected]=useState(0);
 const [busy,setBusy]=useState(false);
 const [progress,setProgress]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [weekDraft,setWeekDraft]=useState(null);
 const workerRef=useRef(null),mounted=useRef(true),urls=useRef([]);
 const onCloseRef=useRef(onClose);onCloseRef.current=onClose;
 const busyRef=useRef(busy);busyRef.current=busy;
 const fileRef=useRef(null),photoRef=useRef(null),scrollRef=useRef(null);
 const item=items[selected]||null;
 const events=eventsForSchool(school);
 const companyOptions=externalCompanyOptions(students);
 useEffect(()=>{
   mounted.current=true;
   const former=document.body.style.overflow;
   document.body.style.overflow="hidden";
   const key=event=>{if(event.key==="Escape"&&!busyRef.current)onCloseRef.current();};
   document.addEventListener("keydown",key);
   scrollRef.current?.focus({preventScroll:true});
   return ()=>{
     mounted.current=false;
     document.body.style.overflow=former;
     document.removeEventListener("keydown",key);
     [...new Set(urls.current)].forEach(url=>URL.revokeObjectURL(url));
     urls.current=[];
     workerRef.current?.terminate?.().catch(()=>{});
   };
 },[]);
 const getWorker=async()=>{
   if(workerRef.current)return workerRef.current;
   setProgress("Iniciando reconocimiento de texto en español e inglés…");
   workerRef.current=await createExternalWorker(()=>{});
   return workerRef.current;
 };
 const enqueue=async files=>{
   const picked=[...files].filter(Boolean);
   if(!picked.length||busy)return;
   setError("");setNotice("");
   if(picked.length+items.length>EXTERNAL_MAX_FILES){
     setError("Puedes revisar hasta "+EXTERNAL_MAX_FILES+" documentos por lote.");return;
   }
   setBusy(true);
   setProgress("Preparando archivos…");
   let added=0;
   try{
     for(const [fileIndex,file] of picked.entries()){
       if(!mounted.current)break;
       const kind=externalFileKind(file);
       if(!kind){setError("Archivo no compatible: "+file.name);continue;}
       const url=URL.createObjectURL(file);urls.current.push(url);
       setProgress("Archivo "+(fileIndex+1)+" de "+picked.length+" · "+file.name);
       try{
         const result=await readExternalBitacora(file,{
           loadPdfJs,getWorker,
           onProgress:({stage,page,pages,row,rows})=>mounted.current&&setProgress(
             (stage==="table"?"Leyendo la tabla":stage==="ocr"?"Reconociendo texto":stage==="docx"?"Leyendo Word":"Leyendo PDF")+
             " · "+file.name+(page?" · página "+page+" de "+pages:"")+
             (row?" · fila "+row+" de "+rows:""))
         });
         const docs=result.documents?.length?result.documents:[{page:1,text:result.text,method:result.method}];
         for(const doc of docs){
           if(items.length+added>=EXTERNAL_MAX_FILES){
             setNotice("Se alcanzó el máximo de "+EXTERNAL_MAX_FILES+" páginas o documentos por lote.");
             break;
           }
           const extracted=extractExternalFields(doc.text);
           const studentId=suggestExternalStudent(extracted,students);
           const learned=applyExternalLearning(extracted,learningExamples,studentId);
           const weekId=suggestExternalWeek(extracted,weeks);
           const proposedWeek=suggestExternalWeekPeriod(extracted);
           const current={key:(globalThis.crypto?.randomUUID?.()||"external-"+Date.now()+"-"+added),
             filename:result.pages>1?file.name+" · página "+doc.page:file.name,kind,url,
             pageNumber:doc.page,pages:1,method:doc.method||result.method,truncated:result.truncated,
             text:doc.text,proposedWeek,observedName:extracted.name,observedCompany:extracted.company,
             learnAlias:false,form:{name:extracted.name,company:suggestExternalCompany(learned,students,studentId),
               studentId,weekId,days:extracted.days},warnings:extracted.warnings,state:"ready"};
           if(mounted.current){setItems(prev=>[...prev,current]);setSelected(items.length+added);added++;}
         }
       }catch(e){
         if(mounted.current){
           setItems(prev=>[...prev,{key:(globalThis.crypto?.randomUUID?.()||"external-error-"+Date.now()+"-"+added),filename:file.name,kind,url,
             state:"error",message:e?.message||"No se pudo leer el archivo."}]);
           setSelected(items.length+added);added++;
         }
       }
     }
   }finally{if(mounted.current){setBusy(false);setProgress("");}}
 };
 const updateItem=patch=>setItems(current=>current.map((x,i)=>i===selected?{...x,...patch}:x));
 const updateForm=patch=>updateItem({form:{...item.form,...patch}});
 const updateDay=(index,patch)=>{
   const days=item.form.days.map((day,i)=>{
     if(i!==index)return day;
     const next={...day,...patch};
     if(Object.hasOwn(patch,"start")||Object.hasOwn(patch,"end"))
       next.hours=duration(next.start,next.end);
     if(Object.hasOwn(patch,"status")&&patch.status!=="evento")next.reasonCode="0";
     if(patch.status==="evento"){next.eventMode="con";}
     return next;
   });
   updateForm({days});
 };
 const reanalyze=()=>{
   const extracted=extractExternalFields(item.text);
   const learned=applyExternalLearning(extracted,learningExamples,item.form.studentId);
   updateItem({...item,observedName:extracted.name,observedCompany:extracted.company,
     form:{...item.form,name:extracted.name,company:suggestExternalCompany(learned,students,item.form.studentId),
     days:extracted.days},warnings:extracted.warnings});
   setNotice("El texto fue analizado nuevamente. Revisa los campos antes de guardar.");
 };
 const makeWeek=()=>{
   if(!weekDraft?.startDate||!onCreateWeek)return;
   setError("");
   try{
     const id=onCreateWeek(weekDraft);
     if(!id){setError("Introduce una fecha de inicio válida.");return;}
     updateForm({weekId:id});
     setWeekDraft(null);
     setNotice("Semana creada o recuperada. Revisa las jornadas antes de confirmar.");
   }catch(error){setError(error?.message||"No se pudo crear la semana.");}
 };
 const selectStudent=id=>{
   const found=students.find(student=>student.id===id);
   const currentCompany=item.form.company||"";
   const observed=suggestExternalCompany({company:item.observedCompany},students,item.form.studentId);
   const fallback=!currentCompany||currentCompany===observed;
   updateForm({studentId:id,company:fallback?suggestExternalCompany(
     {company:item.observedCompany},students,id):currentCompany});
 };
 const submit=()=>{
   setError("");setNotice("");
   if(!item||item.state!=="ready")return;
   const {studentId,weekId,days,name,company}=item.form;
   if(!students.some(x=>x.id===studentId)){setError("Selecciona el alumno del padrón.");return;}
   const week=weeks.find(x=>x.id===weekId);
   if(!week){setError("Selecciona la semana correspondiente.");return;}
   if(week.closedAt){setError("La semana está cerrada. Reábrela para registrar la entrega.");return;}
   const invalidDates=days.some((day,index)=>{
     if(!day.date)return false;
     const d=new Date(week.startDate+"T12:00:00Z");
     d.setUTCDate(d.getUTCDate()+index);
     return day.date!==d.toISOString().slice(0,10);
   });
   if(invalidDates){
     setError("Una fecha de la bitácora no coincide con el día correspondiente de la semana seleccionada.");
     return;
   }
   const duplicate=Boolean(week.deliveries?.[studentId]);
   if(duplicate&&!window.confirm("Ya existe un registro de este alumno en esa semana. ¿Deseas reemplazarlo con la lectura externa?"))return;
   try{
     const captured=externalDaysToStatistics(days);
     const statistics=captured?buildManualStatistics(captured):null;
     const metadata=externalReviewMetadata({...item,name,company},days);
     const saved=onSave({studentId,weekId,statistics,metadata,replace:duplicate});
     if(saved===false)return;
     const next=items.findIndex((x,i)=>i>selected&&x.state==="ready"&&!x.saved);
     updateItem({saved:true});
     if(next>=0)setSelected(next);
     setNotice(statistics?"Bitácora registrada con jornadas y horas.":"Entrega registrada. Las jornadas incompletas se conservaron para revisión, sin inventar horas.");
   }catch(e){setError(e?.message||"Revisa las jornadas antes de guardar.");}
 };
 const remove=()=>{
   if(!item)return;
   if(!items.some((other,i)=>i!==selected&&other.url===item.url)){
     URL.revokeObjectURL(item.url);
     urls.current=urls.current.filter(url=>url!==item.url);
   }
   setItems(current=>current.filter((_,i)=>i!==selected));
   setSelected(i=>Math.max(0,i-(i>0?1:0)));
   setError("");setNotice("");
 };
 const onFiles=e=>{const files=e.target.files;enqueue(files||[]);e.target.value="";};
 return <div className="external-overlay" role="presentation">
   <section className="external-panel" role="dialog" aria-modal="true" aria-label="Lector de bitácoras externas" tabIndex={-1} ref={scrollRef}>
     <header className="external-header">
       <div><h2>Bitácoras externas</h2></div>
       <button type="button" className="btn external-close" onClick={onClose} disabled={busy} aria-label="Cerrar lector externo">Cerrar</button>
     </header>
     <div className="external-upload">
       <label className="btn primary external-upload-btn" htmlFor="external-files">
         Cargar PDF, Word o fotografías
       </label>
       <input id="external-files" ref={fileRef} type="file" multiple accept=".pdf,.docx,application/pdf,image/*,.heic,.heif" onChange={onFiles} disabled={busy}/>
       <label className="btn external-upload-btn" htmlFor="external-camera">Tomar fotografía</label>
       <input id="external-camera" ref={photoRef} type="file" accept="image/*" capture="environment" onChange={onFiles} disabled={busy}/>
       <span className="external-upload-tip">PDF, Word o imagen · hasta 12 archivos</span>
     </div>
     {busy&&<div className="external-loading-layer" role="status" aria-live="polite" aria-label="Leyendo bitácoras externas">
       <div className="external-loading-content">
         <span className="external-spinner" aria-hidden="true"/>
         <strong>Procesando bitácoras</strong>
         <span>{progress||"Leyendo archivo…"}</span>
         <div className="external-loading-track" aria-hidden="true"><i/></div>
       </div>
     </div>}
     {error&&<p className="external-error" role="alert">{error}</p>}
     {notice&&<p className="external-notice" role="status">{notice}</p>}
     {items.length>0&&<>
       <div className="external-queue" role="tablist" aria-label="Documentos cargados">
         {items.map((x,i)=><button key={x.key} role="tab" type="button"
           aria-selected={i===selected} className={"external-queue-item "+(i===selected?"active":"")}
           onClick={()=>{setSelected(i);setWeekDraft(null);setError("");setNotice("");}}>
           {x.saved?"Registrado · ":""}{x.filename}{x.state==="error"?" · Error":""}
         </button>)}
       </div>
       {item&&<div className="external-review">
         <details className="external-original">
           <summary>Documento original · {item.filename}</summary>
           <div className="external-original-preview">
           {item.kind==="image"?<img src={item.url} alt={"Fotografía original: "+item.filename}/>:
             <div className="external-pdf-preview"><strong>{item.kind==="docx"?"DOCX":"PDF"}</strong><span>{item.kind==="docx"?"Documento Word":(item.pages||"?")+" páginas revisadas"}</span>
               <a className="btn" href={item.url} target="_blank" rel="noopener noreferrer">Abrir documento original</a></div>}
           {item.state==="ready"&&<details className="external-transcript"><summary>Ver y corregir transcripción OCR</summary>
             <textarea aria-label="Texto reconocido" value={item.text} rows={8}
               onChange={e=>updateItem({text:e.target.value.slice(0,20000)})}/>
             <button className="btn" type="button" onClick={reanalyze}>Volver a detectar campos</button>
           </details>}
           </div>
         </details>
         <div className="external-data">
           {item.state==="error"?<div role="alert"><strong>No se pudo leer este documento.</strong><p>{item.message}</p>
               <p>Puedes capturar la entrega mediante el registro manual mientras consigues otra imagen.</p></div>:
             <>
               <div className="external-part-title"><strong>Datos por confirmar</strong></div>
               {item.truncated&&<p className="external-warning">Se revisaron las primeras 16 páginas del PDF.</p>}
               {item.warnings?.length>0&&<ul className="external-warnings">{item.warnings.map((x,i)=><li key={i}>{x}</li>)}</ul>}
               <div className="external-fields">
                 <label>Nombre leído
                   <input value={item.form.name||""} maxLength={120}
                     placeholder="Nombre detectado en el documento" onChange={e=>updateForm({name:e.target.value})}/>
                 </label>
                 <label>Alumno del padrón *
                   <select value={item.form.studentId||""} onChange={e=>selectStudent(e.target.value)}>
                     <option value="">Selecciona alumno…</option>
                     {students.map(x=><option key={x.id} value={x.id}>{x.name} · {x.specialty||"Sin especialidad"}</option>)}
                   </select>
                 </label>
                 <label>Empresa
                   <select aria-label="Empresa de la bitácora"
                     value={companyOptions.some(company=>externalKey(company)===externalKey(item.form.company||""))
                       ?companyOptions.find(company=>externalKey(company)===externalKey(item.form.company||""))
                       :item.form.company?"__manual":""}
                     onChange={e=>updateForm({company:e.target.value==="__manual"?"":e.target.value})}>
                     <option value="">Seleccionar empresa…</option>
                     {companyOptions.map(company=><option key={company} value={company}>{company}</option>)}
                     <option value="__manual">Otra empresa</option>
                   </select>
                 </label>
                 {(!item.form.company||!companyOptions.some(company=>externalKey(company)===externalKey(item.form.company)))&&
                   <label>Escribir empresa
                     <input aria-label="Escribir empresa" value={item.form.company||""}
                       placeholder="Nombre de la empresa" maxLength={160}
                       onChange={e=>updateForm({company:e.target.value})}/>
                   </label>}
                 <label>Semana del registro *
                   <select value={item.form.weekId||""} onChange={e=>updateForm({weekId:e.target.value})}>
                     <option value="">Selecciona semana…</option>
                     {weeks.map(w=><option key={w.id} value={w.id}>{w.label} · {w.startDate} a {w.endDate}{w.closedAt?" (cerrada)":""}</option>)}
                   </select>
                 </label>
               </div>
               {!item.form.weekId&&<div className="external-week-create">
                   <p>Semana no registrada.</p>
                   {!weekDraft?<button className="btn" type="button" onClick={()=>setWeekDraft({
                     startDate:item.proposedWeek?.startDate||"",label:"Semana "+(weeks.length+1),dueAt:""
                   })}>Crear semana</button>:
                     <div className="external-week-fields">
                       <label>Inicio del periodo (martes)
                         <input type="date" aria-label="Inicio de la nueva semana externa"
                           value={weekDraft.startDate} onChange={e=>setWeekDraft({...weekDraft,startDate:e.target.value})}/>
                       </label>
                       <label>Nombre de la semana
                         <input aria-label="Nombre de la nueva semana externa" value={weekDraft.label}
                           onChange={e=>setWeekDraft({...weekDraft,label:e.target.value})}/>
                       </label>
                       <label>Fecha límite (opcional)
                         <input type="datetime-local" aria-label="Límite de la nueva semana externa"
                           value={weekDraft.dueAt} onChange={e=>setWeekDraft({...weekDraft,dueAt:e.target.value})}/>
                       </label>
                       <button className="btn primary" type="button" onClick={makeWeek}>Crear y seleccionar</button>
                       <button className="btn" type="button" onClick={()=>setWeekDraft(null)}>Cancelar</button>
                     </div>}
                 </div>}
               <div className="external-days">
                 <h3>Jornadas</h3>
                 {item.form.days.map((day,i)=>{
                   const event=specialEventByCode(day.reasonCode);
                   return <details className="external-day" key={item.key+"-"+i} open={i===0}>
                     <summary className="external-day-head"><strong>{MANUAL_DAYS[i]}</strong>
                       <span>{statusLabel(day.status)}{day.hours?" · "+day.hours+" h":""}</span></summary>
                     <div className="external-day-fields">
                       <label>Estado
                         <select aria-label={MANUAL_DAYS[i]+" · estado externo"} value={day.status}
                           onChange={e=>updateDay(i,{status:e.target.value})}>
                           <option value="">Sin clasificar</option>
                           {["laboral","falta","sin_labores","inhabil","evento"].map(st=>
                             <option key={st} value={st}>{statusLabel(st)}</option>)}
                         </select>
                       </label>
                       <label>Fecha leída
                         <input type="date" aria-label={MANUAL_DAYS[i]+" · fecha externa"}
                           value={day.date||""} onChange={e=>updateDay(i,{date:e.target.value})}/>
                       </label>
                       {Array.isArray(day.timeBlocks)&&day.timeBlocks.length>1&&
                         <p className="external-time-blocks">
                           Tramos detectados: {day.timeBlocks.map(block=>block.raw).join(" · ")}.
                           {day.needsReview?" Confirma los horarios y el total antes de registrar.":" Revisa el total calculado."}
                         </p>}
                       {["laboral","evento"].includes(day.status)&&<>
                         <label>Entrada <input type="time" aria-label={MANUAL_DAYS[i]+" · entrada externa"}
                           value={day.start||""} onChange={e=>updateDay(i,{start:e.target.value})}/></label>
                         <label>Salida <input type="time" aria-label={MANUAL_DAYS[i]+" · salida externa"}
                           value={day.end||""} onChange={e=>updateDay(i,{end:e.target.value})}/></label>
                         <label>Horas <input type="number" inputMode="decimal" min="0.0166667" max="24" step="any"
                           aria-label={MANUAL_DAYS[i]+" · horas externas"} value={day.hours||""}
                           onChange={e=>updateDay(i,{hours:e.target.value})}/></label>
                       </>}
                       {["falta","sin_labores"].includes(day.status)&&
                         <label>Motivo <select value={day.reasonCode||"0"} onChange={e=>updateDay(i,{reasonCode:e.target.value})}>
                           <option value="0">Sin clasificar</option>
                           {reasonsForStatus(day.status).map(x=><option key={x.id} value={x.code}>{x.label}</option>)}
                         </select></label>}
                       {day.status==="evento"&&<>
                         <label>Evento <select value={day.reasonCode||"0"} onChange={e=>{
                           const chosen=specialEventByCode(e.target.value);
                           updateDay(i,{reasonCode:e.target.value,
                             eventPhase:chosen?.phases?.[0]||"no_aplica",
                             eventDiscipline:chosen?.disciplines?.[0]||"No aplica"});}}>
                           <option value="0">Selecciona…</option>
                           {events.map(x=><option key={x.id} value={x.code}>{x.label}</option>)}
                         </select></label>
                         {event&&<>
                           <label>Fase <select value={day.eventPhase||"no_aplica"} onChange={e=>updateDay(i,{eventPhase:e.target.value})}>
                             {event.phases.map(x=><option key={x} value={x}>{EVENT_PHASE_LABELS[x]||x}</option>)}
                           </select></label>
                           <label>Disciplina <select value={day.eventDiscipline||"No aplica"} onChange={e=>updateDay(i,{eventDiscipline:e.target.value})}>
                             {event.disciplines.map(x=><option key={x} value={x}>{x}</option>)}
                           </select></label>
                         </>}
                         <label>Resultado <input value={day.eventResult||""} maxLength={120}
                           onChange={e=>updateDay(i,{eventResult:e.target.value})} placeholder="Opcional"/></label>
                       </>}
                       <label className="external-field-wide">Actividades transcritas
                         <textarea value={day.activity||""} maxLength={900} rows={2}
                           onChange={e=>updateDay(i,{activity:e.target.value})}
                           placeholder="Transcripción original, editable"/></label>
                     </div>
                   </details>;
                 })}
               </div>
               <div className="external-save">
                 {!externalDaysToStatistics(item.form.days)&&!item.saved&&
                   <p>Faltan datos para calcular las horas.</p>}
                 <button className="btn" type="button" onClick={remove} disabled={busy}>Quitar documento</button>
                 <button className="btn primary" type="button" onClick={submit} disabled={busy||item.saved}>
                   {item.saved?"Registrado":"Confirmar y registrar"}
                 </button>
               </div>
             </>}
         </div>
       </div>}
     </>}
     {!items.length&&!busy&&<div className="external-empty">Agrega una bitácora para comenzar.</div>}
   </section>
 </div>;
}