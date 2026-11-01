import {useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {Bell,CheckCircle,WarningCircle,X,SpeakerHigh,SpeakerSlash} from "@phosphor-icons/react";
import {pendingReasonReviews,reasonsForReview} from "../services/reason-reviews.js";
import {getRegistryNotifications,getSeenInbox,markInboxSeen,isInboxSoundOn,setInboxSound,playInboxBell,
  visibleInboxNotices,ignoreInboxNotice,readIgnoredInbox,INBOX_IGNORED_KEY} from "../services/registry-notifications.js";
import "../delivery-reason-inbox.css";

function ReviewItem({item,onReview}){
  const [selected,setSelected]=useState("63");
  return <li className="dual-inbox-item">
    <div className="dual-inbox-entry-heading"><strong>{item.student}</strong><span>{item.week} · {item.day}</span></div>
    <p>{item.status==="falta"?"Falta":"Sin labores"} · Otro motivo</p>
    <label><span>Motivo</span>
      <select value={selected} onChange={e=>setSelected(e.target.value)}
        aria-label={"Motivo de "+item.student+" · "+item.day}>
        <option value="63">Conservar como Otro motivo</option>
        {reasonsForReview(item.status).map(reason=><option key={reason.id} value={reason.code}>{reason.label}</option>)}
      </select>
    </label>
    <button type="button" className="btn primary" onClick={()=>onReview({...item,code:Number(selected)})}>
      {selected==="63"?"Conservar como otro":"Guardar"}
    </button>
  </li>;
}

export default function ReasonInbox({state,backupPending=false,onReview,onBackup,onNavigate}){
  const [open,setOpen]=useState(false);
  const [filter,setFilter]=useState("all");
  const [ignoredRevision,setIgnoredRevision]=useState(0);
  const [clock,setClock]=useState(()=>new Date());
  useEffect(()=>{
    const timer=window.setInterval(()=>setClock(new Date()),60000);
    return ()=>window.clearInterval(timer);
  },[]);
  const [sound,setSound]=useState(()=>isInboxSoundOn(typeof window!=="undefined"?window.localStorage:null));
  const [seen,setSeen]=useState(()=>getSeenInbox(typeof window!=="undefined"?window.localStorage:null));
  const trigger=useRef(null),panel=useRef(null),attempted=useRef(new Set());
  const reviews=useMemo(()=>pendingReasonReviews(state),[state]);
  const messages=useMemo(()=>getRegistryNotifications(state,{backupPending,now:clock}),[state,backupPending,clock]);
  const visible=visibleInboxNotices(messages,window.localStorage,state,{now:clock});
  const ignoredCount=messages.length-visible.length;
  const unread=visible.filter(item=>!seen[item.id]);
  const listed=filter==="all"?visible:filter==="new"?unread:visible.filter(m=>m.severity===filter);
  useEffect(()=>{
    if(!sound)return;
    const newItems=visible.filter(x=>!seen[x.id]&&!attempted.current.has(x.id));
    if(!newItems.length)return;
    for(const item of newItems)attempted.current.add(item.id);
    let cancelled=false;
    const ring=async()=>{if(cancelled)return;const ok=await playInboxBell();if(ok)document.removeEventListener("pointerdown",ring);};
    ring();
    document.addEventListener("pointerdown",ring,{once:true});
    return ()=>{cancelled=true;document.removeEventListener("pointerdown",ring);};
  },[messages,sound,ignoredRevision,clock]);
  useEffect(()=>{
    if(!open)return;
    markInboxSeen(window.localStorage,visible);
    setSeen(getSeenInbox(window.localStorage));
    const keydown=e=>{if(e.key==="Escape")setOpen(false);};
    document.addEventListener("keydown",keydown);
    panel.current?.focus({preventScroll:true});
    return ()=>document.removeEventListener("keydown",keydown);
  },[open]);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  const navigate=item=>{
    if(item.action==="backup"){onBackup?.();return;}
    if(item.action==="reasons"){const section=document.getElementById("dualReasonReviewSection");if(section){section.open=true;section.scrollIntoView({behavior:"smooth"});}return;}
    close();onNavigate?.(item.action,item.weekId);
  };
  return <>
    <button ref={trigger} type="button" className="btn dual-inbox-trigger" title="Avisos"
      aria-label={"Avisos internos: "+visible.length+" pendiente(s)"}
      aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(x=>!x)}>
      <Bell size={19} aria-hidden="true"/>
      {visible.length>0&&<span className="dual-inbox-counter">{visible.length>99?"99+":visible.length}</span>}
      {unread.length>0&&<span className="dual-inbox-unread-dot" aria-label={unread.length+" nuevos"}/>}
    </button>
    {open&&createPortal(<div className="dual-inbox-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}>
      <section className="dual-inbox-panel" role="dialog" aria-modal="true" aria-label="Avisos" ref={panel} tabIndex={-1}>
        <header className="dual-inbox-header">
          <div><h2>Avisos</h2><span className="dual-inbox-subcount">{visible.length} activos{ignoredCount?", "+ignoredCount+" omitidos":""}</span></div>
          <button type="button" className="btn" onClick={close} aria-label="Cerrar avisos"><X size={18}/></button>
        </header>
        <div className="dual-inbox-content">
          <div className="dual-inbox-filters" aria-label="Filtrar avisos">
            {[["all","Todos"],["urgent","Urgentes"],["followup","Seguimiento"],["info","Información"]].map(([key,label])=>
              <button key={key} type="button" aria-pressed={filter===key}
                className={filter===key?"active":""} onClick={()=>setFilter(key)}>{label}</button>)}
          </div>
          {listed.length? <ul className="dual-inbox-alert-list">
            {listed.map(item=><li key={item.id} className={"dual-inbox-alert "+item.severity}>
              <div><strong>{item.title}</strong>{!seen[item.id]&&<span className="dual-inbox-new">Nuevo</span>}</div>
              <p>{item.description}</p>
              <div className="dual-inbox-item-actions">
                <button type="button" className="btn" onClick={()=>navigate(item)}>
                  {item.action==="backup"?"Guardar respaldo":item.action==="reasons"?"Revisar motivos":"Ver detalles"}
                </button>
                <button type="button" className="btn" onClick={()=>{
                  ignoreInboxNotice(window.localStorage,item,state,{now:clock});
                  setIgnoredRevision(x=>x+1);
                }}>{item.severity==="info"?"Ocultar":"Omitir por ahora"}</button>
              </div>
            </li>)}
          </ul>:<div className="dual-inbox-empty" role="status">
            <CheckCircle size={24}/><p>Sin avisos en esta categoría.</p>
          </div>}
          {reviews.length>0&&<details id="dualReasonReviewSection" className="dual-inbox-reason-details">
            <summary>Clasificar motivos ({reviews.length})</summary>
            <p className="dual-inbox-explanation">Consulta la bitácora antes de reclasificar.</p>
            <ul className="dual-inbox-list">{reviews.map(item=><ReviewItem key={item.key} item={item} onReview={onReview}/>)}</ul>
          </details>}
          {ignoredCount>0&&<div className="dual-inbox-snoozed">
            <span>{ignoredCount} aviso(s) omitido(s). Las advertencias reaparecen la siguiente semana o ronda de captura.</span>
            <button type="button" className="btn" onClick={()=>{
              window.localStorage.removeItem(INBOX_IGNORED_KEY);
              setIgnoredRevision(x=>x+1);
            }}>Mostrar omitidos</button>
          </div>}
          <div className="dual-inbox-sound">
            <button type="button" className="btn" onClick={()=>{setInboxSound(window.localStorage,!sound);setSound(!sound);}}>
              {sound?<SpeakerHigh size={17}/>:<SpeakerSlash size={17}/>}
              {sound?"Sonido activado":"Sonido silenciado"}
            </button>
            <button type="button" className="btn" onClick={()=>playInboxBell()}>Probar campana</button>
          </div>
        </div>
      </section>
    </div>,document.body)}
  </>;
}
