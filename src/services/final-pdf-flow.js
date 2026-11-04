/**
 * La despedida móvil se presenta antes de crear el PDF.
 * Si el anfitrión React no está montado o no hay mensaje pendiente,
 * el generador continúa normalmente.
 */
export const BEFORE_FINAL_PDF_EVENT="bitacora-final-bitacora-before-pdf";
export const requiresFarewellBeforePdf=({mobile=false,final=false,saved=false}={})=>
  Boolean(mobile&&final&&saved);

/** Recuperación defensiva: el video sigue siendo cerrable; si el host deja
 * de responder, nunca se bloquea indefinidamente la generación del PDF. */
export function waitForFinalFarewell(
  detail={},dispatch=event=>window.dispatchEvent(event),timeoutMs=12*60*1000
){
  return new Promise(resolve=>{
    let finished=false;
    let watchdog=null;
    const finish=shown=>{
      if(finished)return;
      finished=true;
      if(watchdog!==null)clearTimeout(watchdog);
      resolve(Boolean(shown));
    };
    const payload={...detail,handled:false,continueToPdf:()=>finish(true)};
    try{
      dispatch(new CustomEvent(BEFORE_FINAL_PDF_EVENT,{detail:payload}));
      if(!payload.handled)finish(false);
      else if(!finished&&Number.isFinite(timeoutMs)&&timeoutMs>0)
        watchdog=setTimeout(()=>finish(false),timeoutMs);
    }catch{
      finish(false);
    }
  });
}
