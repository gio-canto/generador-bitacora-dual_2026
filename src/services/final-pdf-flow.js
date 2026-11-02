/**
 * La despedida móvil se presenta antes de crear el PDF.
 * Si el anfitrión React no está montado o no hay mensaje pendiente,
 * el generador continúa normalmente.
 */
export const BEFORE_FINAL_PDF_EVENT="bitacora-final-bitacora-before-pdf";
export const requiresFarewellBeforePdf=({mobile=false,final=false,saved=false}={})=>
  Boolean(mobile&&final&&saved);

export function waitForFinalFarewell(detail={},dispatch=event=>window.dispatchEvent(event)){
  return new Promise(resolve=>{
    let finished=false;
    const finish=shown=>{
      if(finished)return;
      finished=true;
      resolve(Boolean(shown));
    };
    const payload={...detail,handled:false,continueToPdf:()=>finish(true)};
    try{
      dispatch(new CustomEvent(BEFORE_FINAL_PDF_EVENT,{detail:payload}));
      if(!payload.handled)finish(false);
    }catch{
      finish(false);
    }
  });
}
