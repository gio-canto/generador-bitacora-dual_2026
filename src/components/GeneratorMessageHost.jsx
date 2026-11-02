import {useCallback,useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {readProfileData,readActiveProfileId} from "../services/profile.js";
import config from "../data/generator-messages.json";
import {eligibleMessages,markMessageSeen,hasSeenMessage,mexicoDate,activeGraduation,finalBitacoraMessages,historyMessages} from "../services/generator-message-rules.js";
import {enqueueEventMessages,retainEventsForContext,takeNextEvent} from "../services/generator-event-queue.js";
import {youtubeCelebrationUrl,requestYoutubeAudio,sendYoutubeCommand} from "../services/youtube-celebration.js";
import {BEFORE_FINAL_PDF_EVENT} from "../services/final-pdf-flow.js";
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
  const [graduation,setGraduation]=useState(null);
  const queue=useRef([]);
  const activeRef=useRef(null);
  const historyRef=useRef(false);
  const openNext=useCallback(()=>{
    if(activeRef.current||historyRef.current||busy())return;
    const ctx=currentContext();
    const selected=takeNextEvent(queue.current,{
      profileId:ctx.profileId,date:ctx.date,
      wasSeen:(event,snapshot)=>hasSeenMessage(event,snapshot)
    });
    queue.current=selected.queue;
    if(selected.next){activeRef.current=selected.next;setActive(selected.next);}
  },[]);
  const enqueue=useCallback((kind,extra={})=>{
    const ctx={...currentContext(),...extra};
    if(kind!=="final-bitacora")
      queue.current=retainEventsForContext(queue.current,ctx);
    const entries=kind==="final-bitacora"
      ? finalBitacoraMessages(config,ctx)
      : eligibleMessages(config,{...ctx,trigger:kind});
    queue.current=enqueueEventMessages(queue.current,entries,ctx,kind,activeRef.current);
    openNext();
  },[openNext]);
  const dismiss=useCallback(()=>{
    const item=activeRef.current;
    if(!item)return;
    markMessageSeen(item.event,item.ctx);
    activeRef.current=null;setActive(null);
    // Al cerrar el video móvil se autoriza generar el PDF, una sola vez.
    item.onClose?.();
    window.setTimeout(openNext,260);
  },[openNext]);
  useEffect(()=>{
    const checkGraduation=()=>{
      const event=activeGraduation(config,currentContext());
      document.body.classList.toggle("generator-graduation-active",Boolean(event));
      setGraduation(event);
      enqueue("graduation");
    };
    const begin=()=>{
      const ctx=currentContext();
      queue.current=retainEventsForContext(queue.current,ctx);
      if(activeRef.current?.kind!=="final-bitacora" &&
         activeRef.current?.ctx.profileId!==undefined &&
         activeRef.current.ctx.profileId!==ctx.profileId){
        activeRef.current=null;setActive(null);
      }
      enqueue("on-open");enqueue("date");checkGraduation();
    };
    const initial=window.setTimeout(begin,2400);
    const poll=window.setInterval(openNext,900);
    const calendarPoll=window.setInterval(checkGraduation,60000);
    const final=e=>enqueue("final-bitacora",{profile:{...readProfileData(),...e.detail}});
    const beforeFinalPdf=e=>{
      const detail=e.detail;
      if(typeof detail?.continueToPdf!=="function")return;
      const ctx={...currentContext(),profile:{...readProfileData(),
        school:detail.school||readProfileData().school,
        specialty:detail.specialty||readProfileData().specialty}};
      const event=finalBitacoraMessages(config,ctx)[0];
      if(!event)return; // Sin evento elegible: el generador prosigue solo.
      detail.handled=true;
      const item={event,ctx,kind:"final-bitacora",onClose:detail.continueToPdf};
      // Una despedida manual tiene prioridad sobre los avisos pendientes.
      queue.current=[item,...queue.current];
      openNext();
    };
    const showList=()=>{if(activeRef.current)return;historyRef.current=true;setHistoryOpen(true);};
    const focus=()=>{if(!document.hidden){enqueue("date");checkGraduation();openNext();}};
    window.addEventListener("bitacora-final-bitacora",final);
    window.addEventListener(BEFORE_FINAL_PDF_EVENT,beforeFinalPdf);
    window.addEventListener("bitacora-profile",begin);
    window.addEventListener("bitacora-open-messages",showList);
    window.addEventListener("focus",focus);
    return ()=>{
      window.clearTimeout(initial);window.clearInterval(poll);window.clearInterval(calendarPoll);
      document.body.classList.remove("generator-graduation-active");
      window.removeEventListener("bitacora-final-bitacora",final);
      window.removeEventListener(BEFORE_FINAL_PDF_EVENT,beforeFinalPdf);
      window.removeEventListener("bitacora-profile",begin);
      window.removeEventListener("bitacora-open-messages",showList);
      window.removeEventListener("focus",focus);
    };
  },[enqueue,openNext]);
  const ctx=historyOpen?currentContext():null;
  const available=historyOpen?historyMessages(config,ctx):[];
  const closeHistory=()=>{historyRef.current=false;setHistoryOpen(false);openNext();};
  return createPortal(<>
    {graduation&&<div className="generator-graduation-banner" role="status">
      <span>Celebramos su formación dual</span>
      <strong>{graduation.graduation?.label||graduation.content.title}</strong>
    </div>}
    {active&&<GeneratorMessageCard key={active.event.id+active.event.revision} event={active.event} onClose={dismiss}/>}
    {historyOpen&&<div className="generator-message-layer generator-message-medium">
      <section className="generator-message-card" role="dialog" aria-modal="true" aria-label="Mis mensajes">
        <header className="generator-message-header"><span>Mensajes</span>
          <button className="generator-message-close" onClick={closeHistory} aria-label="Cerrar mensajes">×</button>
        </header>
        <h2>Mis mensajes</h2>
        {available.length ? <ul className="generator-message-history">
          {available.map(message=><li key={message.id}><strong>{message.content.title}</strong>
            <span>{hasSeenMessage(message,ctx)?"Visto":"Nuevo"}</span>
            <button type="button" onClick={()=>{
              historyRef.current=false;setHistoryOpen(false);
              const item={event:message,ctx,kind:"history"};
              activeRef.current=item;setActive(item);
            }}>Abrir</button>
          </li>)}
        </ul> : <p>No hay mensajes para tu perfil en este momento.</p>}
      </section>
    </div>}
  </>,document.body);
}
