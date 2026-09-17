from pathlib import Path
import re

root=Path('.')
index=root/'index.html'
readme=root/'README.md'
faq=root/'faq/index.html'
html=index.read_text(encoding='utf-8')
rd=readme.read_text(encoding='utf-8')
fqtxt=faq.read_text(encoding='utf-8')

# ---------- CSS ----------
css='''
.guard-dialog{padding:0;border:0;width:min(92vw,500px);border-radius:26px;color:var(--ink);background:#fff;box-shadow:0 24px 80px rgba(0,0,0,.22)}
.guard-dialog::backdrop{background:rgba(18,18,20,.42);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.guard-shell{padding:30px}.guard-mark{width:46px;height:46px;display:grid;place-items:center;border-radius:15px;background:#ff3b30;color:#fff;font-size:21px;font-weight:800}.guard-shell h2{margin:20px 0 8px;font-size:28px;line-height:1.05;letter-spacing:-.04em}.guard-shell p{margin:0;color:#4a4a4f;font-size:14px;line-height:1.6;white-space:pre-line}.guard-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px;flex-wrap:wrap}.guard-dialog[data-kind="warning"] .guard-mark{background:#ff9f0a}.guard-dialog[data-kind="info"] .guard-mark{background:#0071e3}
.counter{display:flex;justify-content:flex-end;gap:4px;flex-wrap:wrap}.line-budget{font-weight:760;color:#3a3a3c}.line-budget.near{color:#9a6700}.line-budget.full{color:#b42318}
.week-rule{margin-top:10px;padding:11px 13px;border-radius:14px;background:#f5f5f7;color:var(--muted);font-size:11.5px;line-height:1.45}
'''
assert '</style>' in html
html=html.replace('</style>',css+'</style>',1)

# ---------- Group A-D only ----------
old='<div class="field"><label>Grupo</label><input id="group" value="B" maxlength="20"></div>'
new='<div class="field"><label>Grupo</label><select id="group"><option value="A">A</option><option value="B" selected>B</option><option value="C">C</option><option value="D">D</option></select></div>'
assert old in html
html=html.replace(old,new,1)

# ---------- Week guidance ----------
old='<div class="section"><div class="section-title"><h3>Actividades</h3><div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap"><label class="toggle"><input type="checkbox" id="markdown" checked> Formato Markdown</label><button class="btn" id="addDayBtn" type="button">＋ Día</button></div></div><div id="days"></div></div>'
new='<div class="section"><div class="section-title"><h3>Actividades</h3><div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap"><label class="toggle"><input type="checkbox" id="markdown" checked> Formato Markdown</label><button class="btn" id="addDayBtn" type="button">＋ Día</button></div></div><div class="week-rule"><strong>La bitácora debe tener exactamente 4 días.</strong> Cada actividad requiere al menos 4 palabras. El límite de líneas se calcula automáticamente con el espacio disponible en la hoja y cambia según lo escrito en las otras jornadas.</div><div id="days"></div></div>'
assert old in html
html=html.replace(old,new,1)

# ---------- Privacy note ----------
html=html.replace('La información se guarda únicamente en este navegador. No se envía a servidores externos.','La información y el borrador se guardan automáticamente únicamente en este navegador. No se envían a servidores externos.',1)

# ---------- Guard dialog ----------
guard='''<dialog class="guard-dialog" id="guardDialog" aria-labelledby="guardTitle"><div class="guard-shell"><div class="guard-mark" id="guardMark" aria-hidden="true">!</div><h2 id="guardTitle">Revisa la información</h2><p id="guardMessage"></p><div class="guard-actions"><button class="btn" id="guardCancel" type="button" hidden>Revisar</button><button class="btn primary" id="guardConfirm" type="button">Entendido</button></div></div></dialog>
'''
marker='<dialog class="delivery-dialog"'
assert marker in html
html=html.replace(marker,guard+marker,1)

# ---------- Draft key ----------
old='const STORE_KEY="bitacora_dual_clean_v3",SEEDED_KEY="bitacora_dual_clean_v3_seeded",ACTIVITY_LIMIT=900,MAX_DAYS=4,PAGE={w:297,h:210};'
new='const STORE_KEY="bitacora_dual_clean_v3",SEEDED_KEY="bitacora_dual_clean_v3_seeded",DRAFT_KEY="bitacora_dual_draft_v1",ACTIVITY_LIMIT=900,MAX_DAYS=4,PAGE={w:297,h:210};'
assert old in html
html=html.replace(old,new,1)

# ---------- Dirty state queues autosave ----------
old='function setSaveState(t,k=""){const n=$("#saveState");n.textContent=t;n.className="pill"+(k?" "+k:"")}function markDirty(){dirty=true;setSaveState("Sin guardar","warn")}'
new='function setSaveState(t,k=""){const n=$("#saveState");n.textContent=t;n.className="pill"+(k?" "+k:"")}function markDirty(){dirty=true;setSaveState("Sin guardar","warn");queueDraftSave()}'
assert old in html
html=html.replace(old,new,1)

# ---------- Helpers after blankEntry ----------
needle='function blankEntry(date=""){const preset=companyDefaults($("#company").value);return{date,status:"laboral",start:$("#defaultStart").value||preset.start,end:$("#defaultEnd").value||preset.end,area:preset.area,activity:""}}\n'
assert needle in html
helpers=r'''let guardResolver=null,draftTimer=null,lastSpaceNotice=0;
const confirmedShortNames=new Set();
function settleGuard(value){const d=$("#guardDialog"),resolve=guardResolver;guardResolver=null;if(d?.open)d.close();if(resolve)resolve(value)}
function openGuardDialog(title,message,{confirm=false,kind="warning",confirmText="Entendido",cancelText="Revisar"}={}){
  const d=$("#guardDialog");
  if(!d){if(confirm)return Promise.resolve(window.confirm(message));alert(title+"\n\n"+message);return Promise.resolve(false)}
  if(d.open)d.close();d.dataset.kind=kind;$("#guardTitle").textContent=title;$("#guardMessage").textContent=message;$("#guardMark").textContent=kind==="info"?"i":"!";$("#guardConfirm").textContent=confirmText;$("#guardCancel").textContent=cancelText;$("#guardCancel").hidden=!confirm;
  return new Promise(resolve=>{guardResolver=resolve;if(typeof d.showModal==="function")d.showModal();else resolve(confirm?window.confirm(message):(alert(message),false))})
}
function showGuardAlert(title,message,kind="warning"){openGuardDialog(title,message,{kind});return false}
function showGuardConfirm(title,message,confirmText="Está correcto",cancelText="Revisar"){return openGuardDialog(title,message,{confirm:true,kind:"warning",confirmText,cancelText})}
function nameWords(value){return String(value||"").trim().match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[.'’\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*/g)||[]}
function getShortNames(scope="all"){
  const fields=[];
  if(scope==="student"||scope==="all")fields.push(["Alumno",$("#student")?.value||""]);
  if(scope==="representatives"||scope==="all"){
    fields.push(["Vo.Bo.",$("#voboName")?.value||""],["Autorizó",$("#autorizoName")?.value||""]);
    if($("#instructorEnabled")?.checked)fields.push(["Instructor formador",$("#instructorName")?.value||""]);
  }
  return fields.filter(([,value])=>value.trim()&&nameWords(value).length<3).filter(([label,value])=>!confirmedShortNames.has(label+"|"+value.trim().toLowerCase()))
}
async function confirmShortNames(scope="all"){
  const short=getShortNames(scope);if(!short.length)return true;
  const list=short.map(([label,value])=>`${label}: ${value}`).join("\n");
  const ok=await showGuardConfirm("¿El nombre está completo?",`Estos nombres tienen menos de 3 palabras:\n\n${list}\n\nVerifica que estén escritos correctamente. Si la persona no utiliza apellido materno o su nombre legal realmente tiene menos palabras, puedes hacer caso omiso y continuar.`,"Sí, está correcto","Revisar");
  if(ok)short.forEach(([label,value])=>confirmedShortNames.add(label+"|"+value.trim().toLowerCase()));return ok
}
function activityWords(value){return String(value||"").replace(/[*_`#>•]/g," ").match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}(?:['’\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})*/g)||[]}
function validateActivityText(value){
  const words=activityWords(value);if(words.length<4)return{ok:false,reason:`Tiene ${words.length} palabra${words.length===1?"":"s"}; se requieren al menos 4 palabras.`};
  const lower=words.map(w=>w.toLowerCase());const unique=new Set(lower);const obvious=words.filter(w=>/(.)\1{3,}/i.test(w)||/(asdf|qwer|zxcv|hjkl|lorem|ipsum)/i.test(w));
  if(unique.size<Math.min(3,Math.ceil(words.length*.5))||obvious.length>=Math.ceil(words.length*.5))return{ok:false,reason:"El texto parece repetitivo o poco legible. Usa palabras completas que describan la actividad o la justificación."};
  return{ok:true}
}
function validateWeekEntries(){
  if(entries.length!==MAX_DAYS)return{ok:false,title:"Se requieren exactamente 4 días",message:`La bitácora semanal debe contener exactamente 4 jornadas. Actualmente tienes ${entries.length}. Agrega o elimina días hasta tener 4.`};
  if(entries.some(e=>!String(e.date||"").trim()))return{ok:false,title:"Falta una fecha",message:"Cada una de las 4 jornadas debe tener una fecha antes de continuar."};
  if(new Set(entries.map(e=>e.date)).size!==MAX_DAYS)return{ok:false,title:"Hay fechas repetidas",message:"Las 4 jornadas deben corresponder a fechas distintas."};
  for(let i=0;i<entries.length;i++){
    const e=entries[i];if(e.status==="inhabil")continue;const check=validateActivityText(e.activity);
    if(!check.ok)return{ok:false,title:`Revisa la jornada ${i+1}`,message:`${check.reason}\n\nCada actividad o justificación debe tener al menos 4 palabras y ser legible.`};
  }
  const model=buildPageModel();if(!model.fits)return{ok:false,title:"La semana ya no cabe en una hoja",message:"Reduce el texto de una o más jornadas. El sistema calcula el espacio de los cuatro días de forma compartida para conservar el PDF en una sola página."};
  return{ok:true}
}
function activityLineMetrics(model=buildPageModel()){
  const slack=Math.max(0,model.maxBottom-model.bottom);
  return model.rows.map(row=>{const labelLines=row.special?1:0,used=Math.max(0,row.activityLines.length-labelLines),maxTotal=Math.max(row.activityLines.length,Math.floor((row.h+slack-3)/3.38)),max=Math.max(used,maxTotal-labelLines);return{used,max}})
}
function refreshLineLimits(){
  if(!entries.length)return;const metrics=activityLineMetrics();metrics.forEach((m,i)=>{const el=document.querySelector(`[data-lines="${i}"]`);if(!el)return;el.textContent=entries[i]?.status==="inhabil"?`Automático · ${m.used} líneas PDF`:`Líneas PDF: ${m.used}/${m.max} máximo dinámico`;el.classList.toggle("near",m.max>0&&m.used>=m.max-1);el.classList.toggle("full",m.max>0&&m.used>=m.max)})
}
function notifySpaceLimit(){const now=Date.now();if(now-lastSpaceNotice<1400)return;lastSpaceNotice=now;showGuardAlert("Límite de espacio alcanzado","Ese cambio haría que la bitácora dejara de caber en una sola hoja. El máximo de líneas de esta jornada se calcula con base en lo que ya ocupan las otras tres. Reduce texto en otra jornada si necesitas liberar más espacio aquí.")}
function collectDraft(){return{version:1,currentId,weekDate:$("#weekDate")?.value||"",defaultStart:$("#defaultStart")?.value||"10:00",defaultEnd:$("#defaultEnd")?.value||"14:00",markdown:$("#markdown")?.checked!==false,identity:getIdentity(),entries:deepCopy(entries),savedAt:new Date().toISOString()}}
function saveDraftNow(){clearTimeout(draftTimer);try{localStorage.setItem(DRAFT_KEY,JSON.stringify(collectDraft()));if(dirty)setSaveState("Borrador guardado","warn")}catch{}}
function queueDraftSave(){clearTimeout(draftTimer);draftTimer=setTimeout(saveDraftNow,180)}
function clearDraft(){clearTimeout(draftTimer);try{localStorage.removeItem(DRAFT_KEY)}catch{}}
function restoreDraft(){try{const raw=localStorage.getItem(DRAFT_KEY);if(!raw)return false;const d=JSON.parse(raw);if(!d||!d.identity||!Array.isArray(d.entries))return false;currentId=d.currentId||null;entries=deepCopy(d.entries).slice(0,MAX_DAYS);fillIdentity(d.identity);$("#weekDate").value=d.weekDate||"";$("#defaultStart").value=d.defaultStart||companyDefaults($("#company").value).start;$("#defaultEnd").value=d.defaultEnd||companyDefaults($("#company").value).end;$("#markdown").checked=d.markdown!==false;renderDays();dirty=true;setSaveState("Borrador recuperado","warn");updatePreview();return true}catch{return false}}
window.bitacoraAlert=showGuardAlert;window.bitacoraConfirm=showGuardConfirm;window.bitacoraValidateWeek=validateWeekEntries;window.bitacoraConfirmNames=confirmShortNames;
'''
html=html.replace(needle,needle+helpers,1)

# ---------- Render counter ----------
old='<div class="counter"><span data-count="${i}">${e.activity.length}</span>/${ACTIVITY_LIMIT}</div>'
new='<div class="counter"><span class="line-budget" data-lines="${i}">Calculando líneas…</span><span>·</span><span data-count="${i}">${e.activity.length}</span>/${ACTIVITY_LIMIT} caracteres</div>'
assert old in html
html=html.replace(old,new,1)

# ---------- Status change must not overflow ----------
old='''      if(k==="status"){
        const previous=entries[i].status,next=input.value;
        entries[i].status=next;
        if(next==="inhabil")entries[i].activity=INHABIL_JUSTIFICATION;
        else if(previous==="inhabil"&&entries[i].activity===INHABIL_JUSTIFICATION)entries[i].activity="";
        showStatusNotice(next);
        renderDays();markDirty();updatePreview();return;
      }
      entries[i][k]=input.value;
      if(k==="activity"){const c=host.querySelector(`[data-count="${i}"]`);if(c)c.textContent=input.value.length}
      markDirty();updatePreview()
'''
new='''      if(k==="status"){
        const snapshot=deepCopy(entries[i]),before=buildPageModel(),previous=entries[i].status,next=input.value;
        entries[i].status=next;
        if(next==="inhabil")entries[i].activity=INHABIL_JUSTIFICATION;
        else if(previous==="inhabil"&&entries[i].activity===INHABIL_JUSTIFICATION)entries[i].activity="";
        const after=buildPageModel();
        if(!after.fits&&after.bottom>=before.bottom-.01){entries[i]=snapshot;renderDays();notifySpaceLimit();return}
        showStatusNotice(next);
        renderDays();markDirty();updatePreview();refreshLineLimits();return;
      }
      const previous=entries[i][k],before=buildPageModel();entries[i][k]=input.value;const after=buildPageModel();
      if(!after.fits&&after.bottom>=before.bottom-.01){entries[i][k]=previous;input.value=previous??"";if(k==="activity"){const c=host.querySelector(`[data-count="${i}"]`);if(c)c.textContent=String(previous??"").length;notifySpaceLimit()}else showGuardAlert("Límite de espacio alcanzado","Ese cambio haría que el PDF rebasara una hoja. Reduce el contenido de otra jornada antes de ampliar este campo.");refreshLineLimits();return}
      if(k==="activity"){const c=host.querySelector(`[data-count="${i}"]`);if(c)c.textContent=input.value.length}
      markDirty();updatePreview();refreshLineLimits()
'''
assert old in html
html=html.replace(old,new,1)

old='  host.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{entries.splice(+b.dataset.delete,1);renderDays();markDirty();updatePreview()}))\n}'
new='  host.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{entries.splice(+b.dataset.delete,1);renderDays();markDirty();updatePreview();refreshLineLimits()}));refreshLineLimits()\n}'
assert old in html
html=html.replace(old,new,1)

# ---------- Generate week alert ----------
html=html.replace('if(!value){alert("Selecciona una fecha de la semana.");return}','if(!value){showGuardAlert("Selecciona una fecha","Elige una fecha de referencia de la semana antes de generar las cuatro jornadas.");return}',1)

# ---------- Sanitize group when restoring/importing ----------
old='$("#group").value=r.group??"B";'
new='const restoredGroup=String(r.group??"B").trim().toUpperCase();$("#group").value=["A","B","C","D"].includes(restoredGroup)?restoredGroup:"B";'
assert old in html
html=html.replace(old,new,1)

# ---------- New/load draft behavior ----------
old='function newBlank(){currentId=null;entries=[];$("#weekDate").value="";$("#markdown").checked=true;fillIdentity(DEFAULTS);renderDays();dirty=false;setSaveState("Nueva");updatePreview()}'
new='function newBlank(clear=true){if(clear)clearDraft();currentId=null;entries=[];$("#weekDate").value="";$("#markdown").checked=true;fillIdentity(DEFAULTS);renderDays();dirty=false;setSaveState("Nueva");updatePreview()}'
assert old in html
html=html.replace(old,new,1)
old='function loadRecord(r){currentId=r.id;entries=deepCopy(r.entries||[]);$("#markdown").checked=r.markdown!==false;fillIdentity(r);renderDays();dirty=false;setSaveState("Guardado");updatePreview()}'
new='function loadRecord(r){currentId=r.id;entries=deepCopy(r.entries||[]).slice(0,MAX_DAYS);$("#markdown").checked=r.markdown!==false;fillIdentity(r);renderDays();dirty=false;setSaveState("Guardado");updatePreview();saveDraftNow()}'
assert old in html
html=html.replace(old,new,1)

# ---------- Save validates week + names ----------
old='function saveRecord(){if(!entries.length){alert("Agrega al menos un día antes de guardar.");return}if(hasMissingJustification()){alert("Escribe la justificación de cada falta o día sin labores antes de guardar.");return}const r=collectRecord();currentId=r.id;const all=readStore(),i=all.findIndex(x=>x.id===r.id);if(i>=0)all[i]=r;else all.unshift(r);writeStore(all);dirty=false;setSaveState("Guardado");renderRecords()}'
new='async function saveRecord(){const check=validateWeekEntries();if(!check.ok){showGuardAlert(check.title,check.message);return}if(!(await confirmShortNames("all")))return;const r=collectRecord();currentId=r.id;const all=readStore(),i=all.findIndex(x=>x.id===r.id);if(i>=0)all[i]=r;else all.unshift(r);writeStore(all);dirty=false;setSaveState("Guardado");renderRecords();saveDraftNow()}'
assert old in html
html=html.replace(old,new,1)

# ---------- PDF validates same rules ----------
old='async function downloadPdf(){const m=buildPageModel();if(!entries.length){alert("Agrega al menos un día.");return}if(hasMissingJustification()){alert("Escribe la justificación de cada falta o día sin labores antes de generar el PDF.");return}if(!m.fits){alert("El contenido excede el espacio de una página. Reduce un poco el texto antes de exportar.");return}'
new='async function downloadPdf(){const check=validateWeekEntries();if(!check.ok){showGuardAlert(check.title,check.message);return}if(!(await confirmShortNames("all")))return;const m=buildPageModel();if(!m.fits){showGuardAlert("La semana no cabe en una hoja","Reduce un poco el texto antes de exportar.");return}'
assert old in html
html=html.replace(old,new,1)

# ---------- attachEvents: guard, add-day UI, autosave fields and page lifecycle ----------
old='function attachEvents(){$("#statusClose")?.addEventListener("click",()=>$("#statusDialog")?.close());'
new='function attachEvents(){$("#guardConfirm")?.addEventListener("click",()=>settleGuard(true));$("#guardCancel")?.addEventListener("click",()=>settleGuard(false));$("#guardDialog")?.addEventListener("cancel",e=>{e.preventDefault();settleGuard(false)});$("#statusClose")?.addEventListener("click",()=>$("#statusDialog")?.close());'
assert old in html
html=html.replace(old,new,1)
html=html.replace('if(entries.length>=MAX_DAYS){alert("El formato está limitado a cuatro días (martes a viernes).");return}','if(entries.length>=MAX_DAYS){showGuardAlert("Máximo de 4 días","La bitácora debe contener exactamente cuatro jornadas. No puedes agregar una quinta.");return}',1)
old='["student","company","school","specialty","semester","group","voboName","voboRole","autorizoName","autorizoRole","instructorName","instructorRoleMain","instructorNote"]'
new='["student","company","school","specialty","semester","group","weekDate","defaultStart","defaultEnd","voboName","voboRole","autorizoName","autorizoRole","instructorName","instructorRoleMain","instructorNote"]'
assert old in html
html=html.replace(old,new,1)
old='window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}})'
new='window.addEventListener("pagehide",saveDraftNow);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")saveDraftNow()})'
assert old in html
html=html.replace(old,new,1)

# ---------- init restores draft ----------
old='function init(){populateInstructorSelect();ensureSeed();renderRecords();attachEvents();configureMobileLabels();logoImage=new Image();logoImage.onload=updatePreview;logoImage.src="Assets/Edu.png";newBlank()}init();'
new='function init(){populateInstructorSelect();ensureSeed();renderRecords();attachEvents();configureMobileLabels();logoImage=new Image();logoImage.onload=updatePreview;logoImage.src="Assets/Edu.png";if(!restoreDraft())newBlank(false)}init();'
assert old in html
html=html.replace(old,new,1)

# ---------- Wizard hard validation + non-blocking short-name confirmation ----------
pattern=r'function valid\(i\)\{.*?return true\}function showStep'
m=re.search(pattern,html,re.S)
assert m, 'wizard valid() not found'
replacement='''function valid(i){for(const id of req[i]){const el=document.getElementById(id);if(!el||!el.value.trim()){announce("Completa los campos necesarios para continuar");el?.focus();return false}}if(i===0&&!['A','B','C','D'].includes(document.getElementById('group')?.value)){window.bitacoraAlert?.("Grupo no válido","El grupo solo puede ser A, B, C o D.");return false}if(i===2){const check=window.bitacoraValidateWeek?window.bitacoraValidateWeek():{ok:true};if(!check.ok){window.bitacoraAlert?.(check.title,check.message);return false}}return true}async function advance(){if(!valid(step))return;if(step===1&&window.bitacoraConfirmNames&&!(await window.bitacoraConfirmNames("student")))return;if(step===3&&window.bitacoraConfirmNames&&!(await window.bitacoraConfirmNames("representatives")))return;showStep(step+1,true)}function showStep'''
html=html[:m.start()]+replacement+html[m.end():]
old='document.querySelectorAll(".wizard-next").forEach(b=>b.onclick=()=>showStep(step+1));'
new='document.querySelectorAll(".wizard-next").forEach(b=>b.onclick=advance);'
assert old in html
html=html.replace(old,new,1)

# ---------- Persist/restore wizard step ----------
old='(()=>{"use strict";let step=0,highestStep=0,tourIndex=0;const panels='
new='(()=>{"use strict";let step=0,highestStep=0,tourIndex=0;const STEP_KEY="bitacora_dual_wizard_step_v1";const panels='
assert old in html
html=html.replace(old,new,1)
old='step=Math.max(0,Math.min(panels.length-1,i));highestStep=Math.max(highestStep,step);panels.forEach'
new='step=Math.max(0,Math.min(panels.length-1,i));highestStep=Math.max(highestStep,step);try{localStorage.setItem(STEP_KEY,String(step))}catch{}panels.forEach'
assert old in html
html=html.replace(old,new,1)
old='let state=null;try{state=localStorage.getItem(KEY)}catch{}if(!state)requestAnimationFrame(startTour);const credits='
new='let state=null;try{state=localStorage.getItem(KEY)}catch{}if(!state)requestAnimationFrame(startTour);else{try{const savedStep=Math.max(0,Math.min(4,Number(localStorage.getItem(STEP_KEY)||0)));if(localStorage.getItem("bitacora_dual_draft_v1")){highestStep=savedStep;requestAnimationFrame(()=>showStep(savedStep,true))}}catch{}}const credits='
assert old in html
html=html.replace(old,new,1)

# ---------- README Beta 0.44 ----------
rd=rd.replace('Beta%200.43','Beta%200.44',1)
rd=rd.replace('**Beta 0.43**','**Beta 0.44**',1)
anchor='- Descripción de actividades con Markdown básico y contador de caracteres.\n'
assert anchor in rd
rd=rd.replace(anchor,anchor+'- Límite dinámico de líneas por jornada: el espacio disponible se recalcula con base en lo escrito en los otros días y bloquea contenido que haría rebasar una hoja.\n- Validación obligatoria de exactamente 4 jornadas y mínimo 4 palabras legibles por actividad o justificación.\n- Grupo restringido a A, B, C o D.\n- Autoguardado del borrador en el almacenamiento local del navegador, con recuperación al volver a abrir la aplicación.\n- Aviso no restrictivo para nombres de alumno o responsables con menos de 3 palabras.\n',1)
privacy='- Los registros se guardan mediante Web Storage.\n'
assert privacy in rd
rd=rd.replace(privacy,privacy+'- El borrador en curso se guarda automáticamente en Web Storage para recuperarlo después de cerrar o recargar el navegador.\n',1)
rd=rd.replace('> Borrar los datos del sitio en el navegador también elimina los registros locales. Se recomienda exportar respaldos periódicamente.','> Borrar los datos del sitio en el navegador también elimina los registros y el borrador local. El autoguardado permite recuperar el progreso en el mismo navegador y dispositivo; para cambiar de dispositivo o protegerse ante pérdida del equipo, se recomienda exportar respaldos JSON periódicamente.',1)

# ---------- FAQ Beta 0.44 + help ----------
fqtxt=fqtxt.replace('<span class="version-chip">Beta 0.43</span><h2>¿Falta algo?</h2>','<span class="version-chip">Beta 0.44</span><h2>¿Falta algo?</h2>',1)
fqtxt=fqtxt.replace('<p class="version-note"><strong>Beta 0.43</strong></p>','<p class="version-note"><strong>Beta 0.44</strong></p>',1)
fqtxt=fqtxt.replace('<span class="version-chip">Beta 0.43</span><h2 id="releaseNotesTitle">Notas de actualización</h2>','<span class="version-chip">Beta 0.44</span><h2 id="releaseNotesTitle">Notas de actualización</h2>',1)
old_current='<article class="release-item"><div class="release-head"><strong>Beta 0.43</strong><span>Actual</span></div>'
assert old_current in fqtxt
new_current='<article class="release-item"><div class="release-head"><strong>Beta 0.44</strong><span>Actual</span></div><ul><li>La semana exige exactamente 4 jornadas y cada actividad o justificación requiere al menos 4 palabras legibles.</li><li>El límite de líneas del PDF ahora es dinámico y bloquea escritura adicional cuando los cuatro días ya no cabrían en una sola hoja.</li><li>El grupo queda restringido a A, B, C o D.</li><li>El borrador se autoguarda localmente y se recupera al volver a abrir el generador en el mismo navegador y dispositivo.</li><li>Los nombres con menos de 3 palabras muestran una confirmación no restrictiva para revisar posibles apellidos faltantes.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.43</strong></div>'
# Replace current opener AND the existing history opener that directly follows the current Beta 0.43 article.
# Capture the Beta 0.43 body and strip the old <details...> prefix from after it.
start=fqtxt.index(old_current)
body_start=start+len(old_current)
hist_marker='</article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
hist=fqtxt.index(hist_marker,body_start)
beta43_body=fqtxt[body_start:hist+len('</article>')]
# beta43_body begins after opener and ends with </article>
replacement=new_current+beta43_body.replace('</article>','</article>',1)
# We accidentally duplicated the Beta 0.43 body after new opener if used directly; construct explicitly:
beta43_content=fqtxt[body_start:hist]
replacement='<article class="release-item"><div class="release-head"><strong>Beta 0.44</strong><span>Actual</span></div><ul><li>La semana exige exactamente 4 jornadas y cada actividad o justificación requiere al menos 4 palabras legibles.</li><li>El límite de líneas del PDF ahora es dinámico y bloquea escritura adicional cuando los cuatro días ya no cabrían en una sola hoja.</li><li>El grupo queda restringido a A, B, C o D.</li><li>El borrador se autoguarda localmente y se recupera al volver a abrir el generador en el mismo navegador y dispositivo.</li><li>Los nombres con menos de 3 palabras muestran una confirmación no restrictiva para revisar posibles apellidos faltantes.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.43</strong></div>'+beta43_content
fqtxt=fqtxt[:start]+replacement+fqtxt[hist+len(hist_marker):]

# Add FAQ items before closing faq list section using known final special-day question as anchor.
faq_anchor='<details data-search="falta sin labores dia inhabil aviso directora vinculacion jefe inmediato justificar calendario dgeti dual cbtis sep"><summary>¿Qué pasa cuando selecciono Falta, Sin labores o Día inhábil?</summary>'
pos=fqtxt.find(faq_anchor)
assert pos>=0
section_end=fqtxt.find('</section>',pos)
extra='''\n<details data-search="cuatro dias exactos 4 actividades minimo palabras lineas limite hoja pdf"><summary>¿Por qué el sistema exige exactamente 4 días y limita las líneas?</summary><div class="answer"><p>La bitácora de este generador está configurada para cuatro jornadas. Para evitar que el documento se salga de la hoja, el espacio vertical se reparte de forma dinámica: lo que escribes en un día reduce el espacio disponible de los demás.</p><p>Cada actividad o justificación debe contener al menos <strong>4 palabras</strong>. Además, una comprobación local intenta detectar texto evidentemente repetitivo o de relleno; no sustituye una revisión académica ni interpreta el significado del contenido.</p></div></details>\n<details data-search="autoguardado borrador cerrar recargar recuperar progreso dispositivo cache almacenamiento local respaldo"><summary>¿Se guarda mi progreso si cierro el navegador?</summary><div class="answer"><p>Sí. El borrador actual se guarda automáticamente en el almacenamiento local del navegador y se recupera cuando vuelves a abrir el generador en <strong>ese mismo navegador y dispositivo</strong>.</p><div class="important">El almacenamiento local no puede recuperar información si pierdes o cambias de dispositivo. Para eso, exporta periódicamente el respaldo JSON y consérvalo fuera del equipo.</div></div></details>\n<details data-search="nombre tres palabras apellidos apellido materno aviso responsable alumno"><summary>¿Por qué aparece un aviso cuando un nombre tiene menos de 3 palabras?</summary><div class="answer"><p>Es una comprobación preventiva para detectar nombres posiblemente incompletos. <strong>No es restrictiva</strong>: si la persona no utiliza apellido materno o su nombre legal tiene menos de tres palabras, selecciona que el nombre está correcto y continúa.</p></div></details>\n'''
fqtxt=fqtxt[:section_end]+extra+fqtxt[section_end:]

# Verify version markers and no accidental duplicated details nesting beyond expected.
assert 'Beta 0.44' in rd and 'Beta 0.44' in fqtxt
assert 'bitacora_dual_draft_v1' in html
assert 'Líneas PDF:' in html
assert 'Se requieren exactamente 4 días' in html
assert '<select id="group">' in html
assert 'window.bitacoraValidateWeek' in html

index.write_text(html,encoding='utf-8')
readme.write_text(rd,encoding='utf-8')
faq.write_text(fqtxt,encoding='utf-8')
print('Beta 0.44 patch applied')
