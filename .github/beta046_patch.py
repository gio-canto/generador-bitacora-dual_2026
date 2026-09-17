from pathlib import Path

root=Path('.')
index=root/'index.html'
readme=root/'README.md'
faq=root/'faq/index.html'

s=index.read_text(encoding='utf-8')
assert 'id="virtualEaster"' not in s

css='''\nbody.virtual-insanity-running{overflow-x:hidden}.virtual-easter{position:fixed;inset:0;z-index:180;display:grid;place-items:center;padding:24px;background:rgba(18,18,20,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;pointer-events:none;transition:opacity .42s ease}.virtual-easter.show{opacity:1}.virtual-easter-card{width:min(92vw,480px);padding:28px;border:1px solid rgba(255,255,255,.72);border-radius:28px;background:rgba(255,255,255,.92);box-shadow:0 24px 80px rgba(0,0,0,.20);text-align:center;transform:translateY(18px) scale(.97);transition:transform .5s cubic-bezier(.22,1,.36,1)}.virtual-easter.show .virtual-easter-card{transform:none}.virtual-easter-mark{width:54px;height:54px;margin:0 auto 16px;display:grid;place-items:center;border-radius:17px;background:#111;color:#fff;font-size:24px;font-weight:850}.virtual-easter-card h2{margin:0 0 7px;font-size:30px;letter-spacing:-.045em}.virtual-easter-card p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.55}@media(prefers-reduced-motion:reduce){.virtual-easter,.virtual-easter-card{transition:none}}\n'''
pos=s.find('</style>')
assert pos!=-1
s=s[:pos]+css+s[pos:]

overlay='''<div class="virtual-easter" id="virtualEaster" role="status" aria-live="polite" hidden><div class="virtual-easter-card"><div class="virtual-easter-mark" aria-hidden="true">VI</div><h2>Virtual Insanity</h2><p>Easter egg desbloqueado :3</p></div></div>\n'''
needle='<dialog class="welcome-dialog" id="welcomeDialog"'
assert needle in s
s=s.replace(needle,overlay+needle,1)

script=r'''\n<script>\n(()=>{\n  "use strict";\n  const AUDIO_SRC="Assets/Asset_vt_in_nocy.mp3";\n  const shell=document.querySelector(".shell"),overlay=document.getElementById("virtualEaster"),student=document.getElementById("student");\n  if(!shell||!overlay||!student)return;\n  const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();\n  let active=false,finishing=false,raf=0,audio=null,safetyTimer=0,finaleTimer=0,saved=null,studentArmed=true,weekArmed=true;\n  function restoreFocus(){\n    if(!saved)return;\n    window.scrollTo({left:saved.scrollX,top:saved.scrollY,behavior:"auto"});\n    const el=saved.focus;\n    if(el&&el.isConnected){\n      try{el.focus({preventScroll:true})}catch{try{el.focus()}catch{}}\n      if(typeof saved.selectionStart==="number"&&typeof el.setSelectionRange==="function"){try{el.setSelectionRange(saved.selectionStart,saved.selectionEnd)}catch{}}\n    }\n  }\n  function cleanup(){\n    clearTimeout(safetyTimer);clearTimeout(finaleTimer);cancelAnimationFrame(raf);\n    if(audio){audio.pause();audio.removeAttribute("src");try{audio.load()}catch{}audio=null}\n    overlay.classList.remove("show");\n    setTimeout(()=>{\n      overlay.hidden=true;\n      shell.style.transform=saved?.transform||"";\n      shell.style.transition=saved?.transition||"";\n      shell.style.willChange=saved?.willChange||"";\n      document.body.classList.remove("virtual-insanity-running");\n      restoreFocus();active=false;finishing=false;saved=null;\n    },430);\n  }\n  function finale(){\n    if(!active||finishing)return;finishing=true;\n    clearTimeout(safetyTimer);cancelAnimationFrame(raf);\n    shell.style.transition="transform 1.15s cubic-bezier(.22,1,.36,1)";\n    shell.style.transform="translate3d(0,0,0)";\n    overlay.hidden=false;requestAnimationFrame(()=>overlay.classList.add("show"));\n    finaleTimer=setTimeout(cleanup,2500);\n  }\n  function animate(start,now){\n    if(!active||finishing)return;\n    const t=(now-start)/1000,reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;\n    const amp=reduced?12:Math.min(78,innerWidth*.075),vamp=reduced?2:9;\n    const x=Math.sin(t*.72)*amp+Math.sin(t*.27)*amp*.32;\n    const y=Math.sin(t*.41)*vamp;\n    const scale=reduced?1:1.004+Math.sin(t*.31)*.003;\n    shell.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;\n    raf=requestAnimationFrame(n=>animate(start,n));\n  }\n  function trigger(){\n    if(active)return;active=true;finishing=false;\n    const focus=document.activeElement;\n    saved={scrollX:window.scrollX,scrollY:window.scrollY,focus,selectionStart:typeof focus?.selectionStart==="number"?focus.selectionStart:null,selectionEnd:typeof focus?.selectionEnd==="number"?focus.selectionEnd:null,transform:shell.style.transform,transition:shell.style.transition,willChange:shell.style.willChange};\n    document.body.classList.add("virtual-insanity-running");\n    shell.style.transition="none";shell.style.willChange="transform";\n    const start=performance.now();raf=requestAnimationFrame(n=>animate(start,n));\n    audio=new Audio(AUDIO_SRC);audio.preload="auto";audio.volume=.88;\n    audio.addEventListener("ended",finale,{once:true});\n    audio.addEventListener("loadedmetadata",()=>{if(Number.isFinite(audio.duration)&&audio.duration>0){clearTimeout(safetyTimer);safetyTimer=setTimeout(finale,Math.min(90000,Math.max(8000,(audio.duration+2)*1000)))}});\n    audio.play().catch(()=>{clearTimeout(safetyTimer);safetyTimer=setTimeout(finale,10000)});\n    safetyTimer=setTimeout(finale,60000);\n  }\n  student.addEventListener("input",()=>{\n    const hit=normalize(student.value)==="jamiroquai";\n    if(hit&&studentArmed)trigger();\n    studentArmed=!hit;\n  });\n  document.addEventListener("input",event=>{\n    if(!event.target.matches?.('#days textarea[data-key="activity"]'))return;\n    const hit=[...document.querySelectorAll('#days textarea[data-key="activity"]')].some(el=>normalize(el.value).includes("virtual insanity"));\n    if(hit&&weekArmed)trigger();\n    weekArmed=!hit;\n  });\n  document.addEventListener("keydown",event=>{if(active&&event.key==="Escape")finale()});\n})();\n</script>\n'''
assert '</body>' in s
s=s.replace('</body>',script+'</body>',1)
index.write_text(s,encoding='utf-8')

r=readme.read_text(encoding='utf-8')
assert 'Beta%200.45' in r and '**Beta 0.45**' in r
r=r.replace('Beta%200.45','Beta%200.46',1).replace('**Beta 0.45**','**Beta 0.46**',1)
readme.write_text(r,encoding='utf-8')

f=faq.read_text(encoding='utf-8')
assert 'Beta 0.46' not in f
f=f.replace('<section class="contribute"><span class="version-chip">Beta 0.45</span>','<section class="contribute"><span class="version-chip">Beta 0.46</span>',1)
f=f.replace('<p class="version-note"><strong>Beta 0.45</strong></p>','<p class="version-note"><strong>Beta 0.46</strong></p>',1)
old_current='<article class="release-item"><div class="release-head"><strong>Beta 0.45</strong><span>Actual</span></div><ul><li>El aviso de nombres cortos ahora usa una redacción más natural: indica que puede haber solo un nombre y un apellido o que el nombre esté incompleto.</li><li>Se retiró el bloque fijo de reglas de la sección Registra la semana para reducir ruido visual.</li><li>La alerta de cantidad de días recuerda registrar de martes a viernes y usar el estado correspondiente cuando no se labore.</li><li>El contador de actividad ahora muestra únicamente cuántas líneas quedan disponibles.</li></ul></article>'
old_history=old_current.replace('<span>Actual</span>','')
new_current='<article class="release-item"><div class="release-head"><strong>Beta 0.46</strong><span>Actual</span></div><ul><li>Ajustes visuales y mejoras menores de interacción en el generador.</li><li>Mejoras internas de estabilidad para conservar el estado de la interfaz durante interacciones especiales.</li></ul></article>'
assert old_current in f
f=f.replace('<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.45</span>','<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.46</span>',1)
f=f.replace(old_current,new_current,1)
marker='<details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
assert marker in f
f=f.replace(marker,marker+old_history,1)
faq.write_text(f,encoding='utf-8')

# Validation
out=index.read_text(encoding='utf-8')
assert 'Assets/Asset_vt_in_nocy.mp3' in out
assert 'normalize(student.value)==="jamiroquai"' in out
assert 'includes("virtual insanity")' in out
assert 'id="virtualEaster"' in out
assert 'Beta 0.46' in faq.read_text(encoding='utf-8')
assert 'Virtual Insanity' not in new_current and 'Jamiroquai' not in new_current
