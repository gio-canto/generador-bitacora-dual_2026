/** Reproductor de felicitaciones: mismos ajustes para graduación y última bitácora. */
export const validVideoId=id=>typeof id==="string"&&/^[A-Za-z0-9_-]{11}$/.test(id);
export function youtubeCelebrationUrl(id,{loop=false}={}){
  if(!validVideoId(id))return "";
  const base="https://www.youtube-nocookie.com/embed/"+id;
  const args=new URLSearchParams({
    autoplay:"1",mute:"1",playsinline:"1",rel:"0",enablejsapi:"1"
  });
  if(loop){args.set("loop","1");args.set("playlist",id);}
  return base+"?"+args.toString();
}
export function sendYoutubeCommand(frame,func,args=[]){
  if(!frame?.contentWindow)return false;
  frame.contentWindow.postMessage(JSON.stringify({event:"command",func,args}),
    "https://www.youtube-nocookie.com");
  return true;
}
/** El intento de sonido automático sólo se ejecuta en celebraciones configuradas.
 * Safari, Chrome y YouTube conservan el control definitivo del permiso de audio. */
export function requestYoutubeAudio(frame){
  const volume=sendYoutubeCommand(frame,"setVolume",[90]);
  const unmute=sendYoutubeCommand(frame,"unMute");
  return volume&&unmute;
}
