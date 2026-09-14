from pathlib import Path
import re

index_path=Path('index.html')
index=index_path.read_text(encoding='utf-8')

old_company='100% Natural Aeropuerto S.A. de C.V. (100% Natural)'
new_company='El Buen Tzin S.A. de C.V. (100% Natural)'
index=index.replace(old_company,new_company)

council='const COUNCIL="Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)";'
constants='''const NATURAL_COMPANY="El Buen Tzin S.A. de C.V. (100% Natural)";
const LEGACY_COMPANY_ALIASES={"100% Natural Aeropuerto S.A. de C.V. (100% Natural)":NATURAL_COMPANY};
const INHABIL_JUSTIFICATION="Falta de acuerdo con el calendario escolar vigente";
const STATUS_NOTICE_KEY="bitacora_dual_status_notices_v1";
const STATUS_NOTICES={
  falta:"No olvides avisar a la directora de Vinculación sobre tu falta y a tu jefe inmediato.",
  sin_labores:"No olvides avisar a la directora de Vinculación que tu empresa no laborará.",
  inhabil:"Día inhábil solo aplica para días feriados o inhábiles de acuerdo con el calendario escolar oficial vigente de la DGETI y de Educación Dual."
};
let statusNoticesSeen=new Set();
try{statusNoticesSeen=new Set(JSON.parse(sessionStorage.getItem(STATUS_NOTICE_KEY)||"[]"))}catch{}
function showStatusNotice(status){
  const message=STATUS_NOTICES[status];
  if(!message||statusNoticesSeen.has(status))return;
  statusNoticesSeen.add(status);
  try{sessionStorage.setItem(STATUS_NOTICE_KEY,JSON.stringify([...statusNoticesSeen]))}catch{}
  const title=status==="falta"?"Antes de registrar la falta":status==="sin_labores"?"Antes de marcar Sin labores":"Antes de marcar Día inhábil";
  alert(title+"\\n\\n"+message);
}
'''
if 'const NATURAL_COMPANY=' not in index:
    index=index.replace(council,council+'\n'+constants,1)

index=index.replace('  "El Buen Tzin S.A. de C.V. (100% Natural)":{start:"10:00",end:"15:00",area:"Área de Informática"},','  [NATURAL_COMPANY]:{start:"10:00",end:"15:00",area:"Área de Informática"},',1)
index=index.replace('function companyDefaults(company){return COMPANY_PRESETS[company]||{start:"10:00",end:"14:00",area:"Área de Informática"}}','function companyDefaults(company){company=LEGACY_COMPANY_ALIASES[company]||company;return COMPANY_PRESETS[company]||{start:"10:00",end:"14:00",area:"Área de Informática"}}',1)

new_render=r'''function renderDays(){
  const host=$("#days");
  host.innerHTML="";
  if(!entries.length){host.innerHTML='<div class="empty">Selecciona una fecha y genera de martes a viernes, o agrega un día manualmente.</div>';return}
  entries.forEach((e,i)=>{
    if(e.status==="inhabil")e.activity=INHABIL_JUSTIFICATION;
    const card=document.createElement("div");
    card.className="day-card"+(e.status!=="laboral"?" nonwork":"");
    const activityLabel=e.status==="falta"?"Justificación de la falta":e.status==="sin_labores"?"Justificación de sin labores":e.status==="inhabil"?"Justificación de día inhábil":"Actividad";
    const activityPlaceholder=e.status==="falta"?"Explica brevemente el motivo":e.status==="sin_labores"?"Explica por qué no hubo labores en la empresa":e.status==="inhabil"?INHABIL_JUSTIFICATION:"Puedes usar **negritas**, *cursivas* y listas con -";
    card.innerHTML=`<div class="day-grid"><div class="field"><label>Fecha</label><input data-index="${i}" data-key="date" type="date" value="${escapeHtml(e.date)}"></div><div class="field"><label>Tipo de día</label><select data-index="${i}" data-key="status"><option value="laboral" ${e.status==="laboral"?"selected":""}>Con labores</option><option value="sin_labores" ${e.status==="sin_labores"?"selected":""}>Sin labores</option><option value="inhabil" ${e.status==="inhabil"?"selected":""}>Día inhábil</option><option value="falta" ${e.status==="falta"?"selected":""}>Falta</option></select></div><div class="field"><label>Entrada</label><input data-index="${i}" data-key="start" type="time" value="${escapeHtml(e.start)}" ${e.status!=="laboral"?"disabled":""}></div><div class="field"><label>Salida</label><input data-index="${i}" data-key="end" type="time" value="${escapeHtml(e.end)}" ${e.status!=="laboral"?"disabled":""}></div><div class="field"><label>Área</label><input data-index="${i}" data-key="area" value="${escapeHtml(e.area)}" ${e.status!=="laboral"?"disabled":""}></div><button class="icon-btn" data-delete="${i}" title="Eliminar día">×</button></div><div class="field" style="margin-top:9px"><label>${activityLabel}</label><textarea data-index="${i}" data-key="activity" maxlength="${ACTIVITY_LIMIT}" placeholder="${escapeHtml(activityPlaceholder)}" ${e.status==="inhabil"?"disabled":""}>${escapeHtml(e.activity)}</textarea><div class="counter"><span data-count="${i}">${e.activity.length}</span>/${ACTIVITY_LIMIT}</div></div>`;
    host.appendChild(card)
  });
  host.querySelectorAll("[data-key]").forEach(input=>{
    const handler=()=>{
      const i=+input.dataset.index,k=input.dataset.key;
      if(k==="status"){
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
    };
    if(input.tagName==="SELECT")input.addEventListener("change",handler);else input.addEventListener("input",handler)
  });
  host.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{entries.splice(+b.dataset.delete,1);renderDays();markDirty();updatePreview()}))
}'''
index,n=re.subn(r'function renderDays\(\)\{.*?\nfunction generateWeek\(\)\{',new_render+'\nfunction generateWeek(){',index,count=1,flags=re.S)
if n!=1: raise SystemExit('renderDays replacement failed')

index=index.replace('$("#company").value=r.company??"";','$("#company").value=LEGACY_COMPANY_ALIASES[r.company]||(r.company??"");',1)

new_save='''function hasMissingJustification(){return entries.some(e=>(e.status==="falta"||e.status==="sin_labores")&&!String(e.activity||"").trim())}
function saveRecord(){if(!entries.length){alert("Agrega al menos un día antes de guardar.");return}if(hasMissingJustification()){alert("Escribe la justificación de cada falta o día sin labores antes de guardar.");return}const r=collectRecord();currentId=r.id;const all=readStore(),i=all.findIndex(x=>x.id===r.id);if(i>=0)all[i]=r;else all.unshift(r);writeStore(all);dirty=false;setSaveState("Guardado");renderRecords()}'''
index,n=re.subn(r'function saveRecord\(\)\{.*?\nfunction renderRecords\(\)\{',new_save+'\nfunction renderRecords(){',index,count=1,flags=re.S)
if n!=1: raise SystemExit('saveRecord replacement failed')

old_activity='activityLines=st==="falta"?[...wrapPlain(label,widths[1]-3.2,sizes.activity,"bold"),...wrapStyled(e.activity,widths[1]-3.2,sizes.activity,on)]:special?wrapPlain(label,widths[1]-3.2,sizes.activity,"bold"):wrapStyled(e.activity,widths[1]-3.2,sizes.activity,on)'
new_activity='activityLines=special?[...wrapPlain(label,widths[1]-3.2,sizes.activity,"bold"),...wrapStyled(e.activity,widths[1]-3.2,sizes.activity,on)]:wrapStyled(e.activity,widths[1]-3.2,sizes.activity,on)'
if old_activity not in index: raise SystemExit('buildPageModel activity pattern not found')
index=index.replace(old_activity,new_activity,1)

index=index.replace('if(entries.some(e=>e.status==="falta"&&!String(e.activity||"").trim())){alert("Escribe la justificación de cada falta antes de generar el PDF.");return}','if(hasMissingJustification()){alert("Escribe la justificación de cada falta o día sin labores antes de generar el PDF.");return}',1)

index=index.replace('function showDeliveryTips(){const d=$("#deliveryDialog");if(!d)return;if(typeof d.showModal==="function"){if(!d.open)requestAnimationFrame(()=>{if(!d.open)d.showModal()})}else{alert("PDF listo. Recomendación: imprime 3 copias, reúne las firmas y utiliza preferentemente tinta azul. Si aún no tienes una firma definida, puedes escribir tu nombre completo.")}}','function showDeliveryTips(){const d=$("#deliveryDialog");if(!d)return;if(typeof d.showModal==="function"){if(!d.open)requestAnimationFrame(()=>{if(!d.open)d.showModal()})}else{alert("PDF listo. Recomendación: imprime 3 copias, reúne las firmas y utiliza preferentemente tinta azul. No se permiten firmas digitales: las firmas deben ser autógrafas. Si aún no tienes una firma definida, puedes escribir tu nombre completo.")}}',1)

signature_item='<div class="delivery-item"><b>5</b><div><strong>Solo firmas autógrafas</strong><p>No se permiten firmas digitales. Las firmas de la bitácora deben realizarse de forma autógrafa en el documento impreso.</p></div></div>'
marker='</div></div><div class="delivery-note"><strong>Importante:</strong>'
if 'Solo firmas autógrafas' not in index:
    if marker not in index: raise SystemExit('delivery marker not found')
    index=index.replace(marker,signature_item+'</div><div class="delivery-note"><strong>Importante:</strong>',1)

old_valid='cards.some(c=>c.querySelector(\'[data-key="status"]\')?.value==="falta"&&!c.querySelector(\'textarea[data-key="activity"]\')?.value.trim())'
new_valid='cards.some(c=>["falta","sin_labores"].includes(c.querySelector(\'[data-key="status"]\')?.value)&&!c.querySelector(\'textarea[data-key="activity"]\')?.value.trim())'
if old_valid not in index: raise SystemExit('wizard validation pattern not found')
index=index.replace(old_valid,new_valid,1).replace('announce("Escribe la justificación de cada falta")','announce("Escribe la justificación de cada falta o día sin labores")',1)

index_path.write_text(index,encoding='utf-8')

readme_path=Path('README.md')
readme=readme_path.read_text(encoding='utf-8')
readme=readme.replace('Beta%200.35','Beta%200.36').replace('**Beta 0.35**','**Beta 0.36**')
readme=readme.replace(old_company,new_company)
readme=readme.replace('- Justificación personalizada y obligatoria cuando se registra una falta.','- Justificación obligatoria para **Falta** y **Sin labores**; **Día inhábil** utiliza una justificación automática basada en el calendario escolar vigente.\n- Avisos preventivos la primera vez que se selecciona Falta, Sin labores o Día inhábil durante la sesión.\n- Recordatorio final de que las firmas deben ser autógrafas y no se permiten firmas digitales.')
readme_path.write_text(readme,encoding='utf-8')

faq_path=Path('faq/index.html')
faq=faq_path.read_text(encoding='utf-8')
faq=faq.replace('Beta 0.35','Beta 0.36')
faq=faq.replace(old_company,new_company)
faq=faq.replace('<strong>Beta 0.36</strong><span>Actual</span>','<strong>Beta 0.35</strong>',1)

release_open='<div class="release-list">'
release_036='<article class="release-item"><div class="release-head"><strong>Beta 0.36</strong><span>Actual</span></div><ul><li>Avisos preventivos al seleccionar Falta, Sin labores y Día inhábil.</li><li>Justificación obligatoria para Falta y Sin labores; Día inhábil se completa automáticamente con la leyenda del calendario escolar vigente.</li><li>El PDF muestra también la justificación de Sin labores y Día inhábil.</li><li>Recordatorio final: no se permiten firmas digitales; las firmas deben ser autógrafas.</li><li>100% Natural actualiza su razón social a El Buen Tzin S.A. de C.V. (100% Natural).</li></ul></article>'
if 'Avisos preventivos al seleccionar Falta' not in faq:
    faq=faq.replace(release_open,release_open+release_036,1)

question='''<details data-search="falta sin labores dia inhabil aviso directora vinculacion jefe inmediato justificar calendario dgeti dual"><summary>¿Qué pasa cuando selecciono Falta, Sin labores o Día inhábil?</summary><div class="answer"><p>La primera vez que selecciones cada uno de estos estados durante la sesión, el generador mostrará un recordatorio:</p><ul><li><strong>Falta:</strong> avisa a la directora de Vinculación y a tu jefe inmediato. Además, debes escribir la justificación.</li><li><strong>Sin labores:</strong> avisa a la directora de Vinculación que la empresa no laborará y escribe la justificación correspondiente.</li><li><strong>Día inhábil:</strong> úsalo únicamente cuando corresponda a un día feriado o inhábil del calendario escolar oficial vigente de la <strong>DGETI</strong> y de Educación Dual. El generador coloca automáticamente la leyenda <code>Falta de acuerdo con el calendario escolar vigente</code>.</li></ul><div class="important">Selecciona el estado que realmente corresponda. Si Vinculación o tu empresa te dan una indicación específica, esa instrucción tiene prioridad.</div></div></details>\n'''
marker='</section>\n<div class="empty" id="emptyState">'
if '¿Qué pasa cuando selecciono Falta, Sin labores o Día inhábil?' not in faq:
    faq=faq.replace(marker,question+marker,1)

faq_path.write_text(faq,encoding='utf-8')
