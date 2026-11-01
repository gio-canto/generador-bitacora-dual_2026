import {useCallback,useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {readProfileData,readActiveProfileId} from "../services/profile.js";
import config from "../data/generator-messages.json";
import {eligibleMessages,markMessageSeen,hasSeenMessage,mexicoDate,activeGraduation} from "../services/generator-message-rules.js";
import "../generator-messages.css";
import "../generator-graduation.css";

const currentContext=()=>({profile:readProfileData(),profileId:readActiveProfileId(),date:mexicoDate(),
  storage:window.localStorage,sessionStorage:window.sessionStorage});
const safeEmbed=id=>/^[A-Za-z0-9_-]{11}$/.test(id||"") ? "https://www.youtube-nocookie.com/embed/"+id : "";
const busy=()=>Boolean(document.querySelector(
  "dialog[open], #tourLayer:not([hidden]), #virtualEaster:not([hidden]), .calendar-easter.show"
));
export function GeneratorMessageCard({event,onClose}){
  // YouTube inicia la reproducción al montar el modal, silenciado para
  // cumplir las restricciones de autoplay de Safari y Chromium.
  // El usuario puede activar el sonido con los controles del reproductor.
  const container=useRef(null);
  const videoFrame=useRef(null);
  const [audioOn,setAudioOn]=useState(false);
  const isTab=event.presentation==="tab";
  useEffect(()=>{
    if(isTab)return;
    const prior=document.activeElement;
    container.current?.focus();
    const keyboard=e=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",keyboard);
    return ()=>{document.removeEventListener("keydown",keyboard);if(prior?.isConnected)prior.focus?.();};
  },[event.id,onClose,isTab]);
  const content=event.content||{};
  const videoSrc=safeEmbed(content.youtubeId);
  // El autoplay empieza silenciado; el audio sólo se habilita por una acción del usuario.
  // YouTube acepta comandos de su API mediante postMessage con enablejsapi=1.
  const activateAudio=()=>{
    const player=videoFrame.current?.contentWindow;
    if(!player)return;
    const command=func=>player.postMessage(JSON.stringify({event:"command",func,args:func==="setVolume"?[90]:[]}),
      "https://www.youtube-nocookie.com");
    command("setVolume");
    command("unMute");
    setAudioOn(true);
  };
  return <div className={"generator-message-layer generator-message-"+event.presentation+(event.trigger?.type==="graduation"?" generator-message-graduation":"")}
    onMouseDown={e=>{if(!isTab && e.target===e.currentTarget)onClose();}}>
    <section ref={container} tabIndex={-1} className="generator-message-card"
      role={isTab?"status":"dialog"} aria-modal={!isTab} aria-label={content.title}>
      <header className="generator-message-header">
        <span>{event.trigger?.type==="graduation"?"Graduación Dual":event.presentation==="fullscreen"?"Mensaje especial":"Aviso"}</span>
        <button type="button" className="generator-message-close" onClick={onClose} aria-label="Cerrar mensaje">×</button>
      </header>
      {videoSrc && event.presentation!=="tab" && <div className="generator-message-media">
        <div className="generator-message-video">
          <iframe ref={videoFrame} src={videoSrc+"?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1"}
            title={"Video: "+content.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            loading="eager" referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen/>
        </div>
        <div className="generator-message-media-controls">
          <span>El video inicia sin sonido.</span>
          <button type="button" onClick={activateAudio} disabled={audioOn}>
            {audioOn?"Audio activado":"Activar audio"}
          </button>
        </div>
      </div>}
      <h2>{content.title}</h2>
      <p>{content.body}</p>
      {content.action?.url && /^https:\/\//.test(content.action.url) &&
        <a className="generator-message-action" href={content.action.url}
          target="_blank" rel="noopener noreferrer" onClick={onClose}>{content.action.label||"Abrir enlace"}</a>}
      {!isTab && <button type="button" className="generator-message-secondary" onClick={onClose}>Cerrar</button>}
    </section>
  </div>;
}
export default function GeneratorMessageHost(){
  const [active,setActive]=useState(null);
  const [historyOpen,setHistoryOpen]=useState(false);
  const [clock,setClock]=useState(0);
  const [graduation,setGraduation]=useState(null);
  const queue=useRef([]);
  const context=useRef(null);
  const activeRef=useRef(null);
  const openNext=useCallback(()=>{
    if(activeRef.current || busy())return;
    const next=queue.current.shift();
    if(next){activeRef.current=next;setActive(next);}
  },[]);
  const enqueue=useCallback((kind,extra={})=>{
    const ctx={...currentContext(),...extra};
    context.current=ctx;
    // Si ese día se presenta el video de graduación, no duplicar la despedida
    // genérica al descargar la última bitácora.
    if(kind==="final-bitacora"){
      const grad=activeGraduation(config,ctx);
      if(grad?.trigger?.videoDates?.includes(ctx.date))return;
    }
    const entries=eligibleMessages(config,{...ctx,trigger:kind});
    const known=new Set([activeRef.current?.id,...queue.current.map(x=>x.id)]);
    for(const entry of entries)if(!known.has(entry.id)){queue.current.push(entry);known.add(entry.id);}
    queue.current.sort((a,b)=>(b.priority||0)-(a.priority||0));
    openNext();
  },[openNext]);
  const dismiss=useCallback(()=>{
    if(activeRef.current)markMessageSeen(activeRef.current,context.current||currentContext());
    activeRef.current=null;setActive(null);
    window.setTimeout(openNext,260);
  },[openNext]);
  useEffect(()=>{
    const checkGraduation=()=>{
      const ctx=currentContext();
      const event=activeGraduation(config,ctx);
      document.body.classList.toggle("generator-graduation-active",Boolean(event));
      setGraduation(event);
      enqueue("graduation");
    };
    const begin=()=>{enqueue("on-open");enqueue("date");checkGraduation();};
    const initial=window.setTimeout(begin,2400);
    const poll=window.setInterval(openNext,900);
    const calendarPoll=window.setInterval(checkGraduation,60000);
    const final=e=>enqueue("final-bitacora",{profile:{...readProfileData(),...e.detail}});
    const showList=()=>{setHistoryOpen(true);setClock(x=>x+1);};
    const focus=()=>{if(!document.hidden){enqueue("date");checkGraduation();openNext();}};
    window.addEventListener("bitacora-final-bitacora",final);
    window.addEventListener("bitacora-profile",begin);
    window.addEventListener("bitacora-open-messages",showList);
    window.addEventListener("focus",focus);
    return ()=>{window.clearTimeout(initial);window.clearInterval(poll);window.clearInterval(calendarPoll);
      document.body.classList.remove("generator-graduation-active");
      window.removeEventListener("bitacora-final-bitacora",final);
      window.removeEventListener("bitacora-profile",begin);
      window.removeEventListener("bitacora-open-messages",showList);
      window.removeEventListener("focus",focus);
    };
  },[enqueue,openNext]);
  const ctx=historyOpen?currentContext():null;
  const available=historyOpen?config.events.filter(event=>{
    const visible=eligibleMessages({...config,events:[event]},{...ctx,trigger:event.trigger.type,ignoreSeen:true});
    return visible.length>0;
  }):[];
  return createPortal(<>
    {graduation&&<div className="generator-graduation-banner" role="status">
      <span>Celebramos su formación dual</span>
      <strong>{graduation.graduation?.label||graduation.content.title}</strong>
    </div>}
    {active&&<GeneratorMessageCard key={active.id+active.revision} event={active} onClose={dismiss}/>}
    {historyOpen&&<div className="generator-message-layer generator-message-medium">
      <section className="generator-message-card" role="dialog" aria-modal="true" aria-label="Mis mensajes">
        <header className="generator-message-header"><span>Mensajes</span>
          <button className="generator-message-close" onClick={()=>setHistoryOpen(false)} aria-label="Cerrar mensajes">×</button>
        </header>
        <h2>Mis mensajes</h2>
        {available.length ? <ul className="generator-message-history">
          {available.map(message=><li key={message.id}><strong>{message.content.title}</strong>
            <span>{hasSeenMessage(message,ctx)?"Visto":"Nuevo"}</span>
            <button type="button" onClick={()=>{setHistoryOpen(false);activeRef.current=message;context.current=ctx;setActive(message);}}>Abrir</button>
          </li>)}
        </ul> : <p>No hay mensajes para tu perfil en este momento.</p>}
      </section>
    </div>}
  </>,document.body);
}
