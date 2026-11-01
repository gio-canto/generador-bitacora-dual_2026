import {useCallback,useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {readProfileData,readActiveProfileId} from "../services/profile.js";
import config from "../data/generator-messages.json";
import {eligibleMessages,markMessageSeen,hasSeenMessage,mexicoDate,activeGraduation} from "../services/generator-message-rules.js";
import {youtubeCelebrationUrl,requestYoutubeAudio,sendYoutubeCommand} from "../services/youtube-celebration.js";
import "../generator-messages.css";
import "../generator-graduation.css";

const currentContext=()=>({profile:readProfileData(),profileId:readActiveProfileId(),date:mexicoDate(),
  storage:window.localStorage,sessionStorage:window.sessionStorage});

const busy=()=>Boolean(document.querySelector(
  "dialog[open], #tourLayer:not([hidden]), #virtualEaster:not([hidden]), .calendar-easter.show"
));
export function GeneratorMessageCard({event,onClose}){
  // YouTube inicia la reproducción al montar el modal, silenciado para
  // cumplir las restricciones de autoplay de Safari y Chromium.
  // El usuario puede activar el sonido con los controles del reproductor.
  const container=useRef(null);
  const videoFrame=useRef(null);
  const audioTimers=useRef([]);
  const playing=useRef(false);
  const [audioRequested,setAudioRequested]=useState(false);
  const dualCelebration=event.celebration?.kind==="dual";
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
  const videoSrc=youtubeCelebrationUrl(content.youtubeId,{
    loop:Boolean(event.celebration?.loopVideo)
  });
  const activateAudio=()=>{
    if(requestYoutubeAudio(videoFrame.current)){
      sendYoutubeCommand(videoFrame.current,"playVideo");
      setAudioRequested(true);
    }
  };
  const playerLoaded=()=>{
    if(!event.celebration?.autoplayAudio)return;
    // El iframe inicia sin sonido para que el video sí cargue; al estar listo
    // se solicita audio automáticamente. El navegador puede bloquearlo.
    const attempt=()=>requestYoutubeAudio(videoFrame.current);
    audioTimers.current.push(window.setTimeout(attempt,250));
    audioTimers.current.push(window.setTimeout(()=>{
      if(!playing.current){
        sendYoutubeCommand(videoFrame.current,"mute");
        sendYoutubeCommand(videoFrame.current,"playVideo");
      }
    },1800));
  };
  useEffect(()=>{
    const youtubeMessage=e=>{
      if(e.source!==videoFrame.current?.contentWindow ||
         !["https://www.youtube.com","https://www.youtube-nocookie.com"].includes(e.origin))return;
      try{
        const payload=typeof e.data==="string"?JSON.parse(e.data):e.data;
        if(payload?.event==="onReady"&&event.celebration?.autoplayAudio)
          requestYoutubeAudio(videoFrame.current);
        if(payload?.event==="onStateChange"){
          if(payload.info===1)playing.current=true;
          if(payload.info===0||payload.info===2)playing.current=false;
        }
      }catch{/* mensajes de terceros no pertinentes */}
    };
    window.addEventListener("message",youtubeMessage);
    return ()=>{
      audioTimers.current.forEach(id=>window.clearTimeout(id));
      audioTimers.current=[];
      window.removeEventListener("message",youtubeMessage);
    };
  },[event.id,event.revision,event.celebration?.autoplayAudio]);
  return <div className={"generator-message-layer generator-message-"+event.presentation+(dualCelebration?" generator-message-graduation":"")}
    onMouseDown={e=>{if(!isTab && e.target===e.currentTarget)onClose();}}>
    <section ref={container} tabIndex={-1} className="generator-message-card"
      role={isTab?"status":"dialog"} aria-modal={!isTab} aria-label={content.title}>
      <header className="generator-message-header">
        <span>{event.trigger?.type==="graduation"?"Graduación Dual":event.presentation==="fullscreen"?"Mensaje especial":"Aviso"}</span>
        <button type="button" className="generator-message-close" onClick={onClose} aria-label="Cerrar mensaje">×</button>
      </header>
      {videoSrc && event.presentation!=="tab" && <div className="generator-message-media">
        <div className="generator-message-video">
          <iframe ref={videoFrame} src={videoSrc} onLoad={playerLoaded}
            title={"Video: "+content.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            loading="eager" referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen/>
        </div>
        <div className="generator-message-media-controls">
          <button type="button" onClick={activateAudio}>
            {audioRequested?"Reactivar audio":"Activar audio"}
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
