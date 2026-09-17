from pathlib import Path
import re

index_path=Path('index.html')
readme_path=Path('README.md')
faq_path=Path('faq/index.html')

index=index_path.read_text(encoding='utf-8')
readme=readme_path.read_text(encoding='utf-8')
faq=faq_path.read_text(encoding='utf-8')

new_script=r'''<script>
(()=>{
  "use strict";
  const AUDIO_SRC="Assets/Asset_vt_in_nocy.mp3";
  const shell=document.querySelector(".shell"),overlay=document.getElementById("virtualEaster"),student=document.getElementById("student"),credits=document.getElementById("creditsDialog");
  if(!shell||!overlay||!student)return;
  const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
  const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  let active=false,finishing=false,raf=0,audio=null,safetyTimer=0,finaleTimer=0,saved=null,studentArmed=true,weekArmed=true,motionStart=0,motionDuration=12000;

  function restorePosition(){
    if(!saved)return;
    window.scrollTo({left:saved.scrollX,top:saved.scrollY,behavior:"auto"});
  }
  function restoreFocus(){
    if(!saved)return;
    const el=saved.focus;
    if(el&&el.isConnected){
      try{el.focus({preventScroll:true})}catch{try{el.focus()}catch{}}
      if(typeof saved.selectionStart==="number"&&typeof el.setSelectionRange==="function"){try{el.setSelectionRange(saved.selectionStart,saved.selectionEnd)}catch{}}
    }
  }
  function finishEverything(){
    restorePosition();
    restoreFocus();
    saved=null;
  }
  function showClassicCredits(){
    active=false;finishing=false;
    if(credits&&!credits.open){
      credits.addEventListener("close",finishEverything,{once:true});
      credits.showModal();
    }else finishEverything();
  }
  function restoreVisualAndContinue(){
    overlay.classList.remove("show");
    setTimeout(()=>{
      overlay.hidden=true;
      shell.style.transform=saved?.transform||"";
      shell.style.transition=saved?.transition||"";
      shell.style.willChange=saved?.willChange||"";
      document.documentElement.style.overflowX=saved?.htmlOverflowX||"";
      document.body.classList.remove("virtual-insanity-running");
      restorePosition();
      showClassicCredits();
    },430);
  }
  function finale(){
    if(!active||finishing)return;
    finishing=true;
    clearTimeout(safetyTimer);cancelAnimationFrame(raf);
    if(audio){audio.pause();audio.removeAttribute("src");try{audio.load()}catch{}audio=null}
    shell.style.transition="transform 1.15s cubic-bezier(.22,1,.36,1)";
    shell.style.transform="translate3d(0,0,0)";
    overlay.hidden=false;
    requestAnimationFrame(()=>overlay.classList.add("show"));
    finaleTimer=setTimeout(restoreVisualAndContinue,2500);
  }
  function animate(now){
    if(!active||finishing)return;
    const elapsed=now-motionStart;
    const p=Math.min(1,elapsed/motionDuration);
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exitX=-(saved.shellRight+Math.max(96,innerWidth*.08));
    let x=0;
    if(reduced){
      x=0;
    }else if(p<.58){
      x=exitX*easeInOut(p/.58);
    }else if(p<.72){
      x=exitX;
    }else{
      x=exitX*(1-easeInOut((p-.72)/.28));
    }
    shell.style.transform=`translate3d(${x.toFixed(2)}px,0,0)`;
    if(p<1)raf=requestAnimationFrame(animate);else finale();
  }
  function trigger(){
    if(active)return;
    active=true;finishing=false;
    clearTimeout(finaleTimer);
    const focus=document.activeElement,rect=shell.getBoundingClientRect();
    saved={scrollX:window.scrollX,scrollY:window.scrollY,focus,selectionStart:typeof focus?.selectionStart==="number"?focus.selectionStart:null,selectionEnd:typeof focus?.selectionEnd==="number"?focus.selectionEnd:null,transform:shell.style.transform,transition:shell.style.transition,willChange:shell.style.willChange,htmlOverflowX:document.documentElement.style.overflowX,shellRight:rect.right};
    document.documentElement.style.overflowX="hidden";
    document.body.classList.add("virtual-insanity-running");
    shell.style.transition="none";shell.style.willChange="transform";
    motionDuration=12000;motionStart=performance.now();
    audio=new Audio(AUDIO_SRC);audio.preload="auto";audio.volume=.88;
    audio.addEventListener("loadedmetadata",()=>{
      if(Number.isFinite(audio.duration)&&audio.duration>0){
        motionDuration=Math.max(8000,Math.min(18000,audio.duration*900));
      }
    },{once:true});
    audio.play().catch(()=>{});
    raf=requestAnimationFrame(animate);
    safetyTimer=setTimeout(finale,22000);
  }
  student.addEventListener("input",()=>{
    const hit=normalize(student.value)==="jamiroquai";
    if(hit&&studentArmed)trigger();
    studentArmed=!hit;
  });
  document.addEventListener("input",event=>{
    if(!event.target.matches?.('#days textarea[data-key="activity"]'))return;
    const hit=[...document.querySelectorAll('#days textarea[data-key="activity"]')].some(el=>normalize(el.value).includes("virtual insanity"));
    if(hit&&weekArmed)trigger();
    weekArmed=!hit;
  });
  document.addEventListener("keydown",event=>{if(active&&event.key==="Escape")finale()});
})();
</script>'''

pattern=r'<script>\s*\(\(\)=>\{\s*"use strict";\s*const AUDIO_SRC="Assets/Asset_vt_in_nocy\.mp3";.*?</script>'
index2,n=re.subn(pattern,new_script,index,count=1,flags=re.S)
if n!=1:
    raise SystemExit(f'No se encontró exactamente un bloque del easter egg: {n}')
index=index2

readme=readme.replace('Beta%200.46','Beta%200.47').replace('**Beta 0.46**','**Beta 0.47**')

faq=faq.replace('<section class="contribute"><span class="version-chip">Beta 0.46</span>','<section class="contribute"><span class="version-chip">Beta 0.47</span>',1)
faq=faq.replace('<p class="version-note"><strong>Beta 0.46</strong></p>','<p class="version-note"><strong>Beta 0.47</strong></p>',1)
old_current='<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.46</span><h2 id="releaseNotesTitle">Notas de actualización</h2><p class="release-intro">Cambios recientes del Generador de Bitácora Dual 2026.</p><article class="release-item"><div class="release-head"><strong>Beta 0.46</strong><span>Actual</span></div><ul><li>Ajustes visuales y mejoras menores de interacción en el generador.</li><li>Mejoras internas de estabilidad para conservar el estado de la interfaz durante interacciones especiales.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
new_current='<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.47</span><h2 id="releaseNotesTitle">Notas de actualización</h2><p class="release-intro">Cambios recientes del Generador de Bitácora Dual 2026.</p><article class="release-item"><div class="release-head"><strong>Beta 0.47</strong><span>Actual</span></div><ul><li>Correcciones menores de interfaz y estabilidad general.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.46</strong></div><ul><li>Ajustes visuales y mejoras menores de interacción en el generador.</li><li>Mejoras internas de estabilidad para conservar el estado de la interfaz durante interacciones especiales.</li></ul></article>'
if old_current not in faq:
    raise SystemExit('No se encontró el bloque actual Beta 0.46 del FAQ')
faq=faq.replace(old_current,new_current,1)

index_path.write_text(index,encoding='utf-8')
readme_path.write_text(readme,encoding='utf-8')
faq_path.write_text(faq,encoding='utf-8')

# Validaciones de contenido sin exponer disparadores en notas públicas.
if 'Beta 0.47' not in readme or 'Beta 0.47' not in faq:
    raise SystemExit('No se actualizó la versión')
release=faq.split('<section class="release-notes"',1)[1]
current=release.split('<details class="release-disclosure"',1)[0].lower()
for forbidden in ('jamiroquai','virtual insanity','easter egg','audio','mp3'):
    if forbidden in current:
        raise SystemExit(f'La nota pública revela contenido secreto: {forbidden}')
if 'normalize(student.value)==="jamiroquai"' not in index or 'normalize(el.value).includes("virtual insanity")' not in index:
    raise SystemExit('Faltan los disparadores normalizados')
if 'exitX=-(saved.shellRight+Math.max(96,innerWidth*.08))' not in index:
    raise SystemExit('Falta el desplazamiento total fuera de pantalla')
if 'credits.showModal()' not in index:
    raise SystemExit('Falta encadenar los créditos clásicos')
