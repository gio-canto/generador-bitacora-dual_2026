from pathlib import Path
import re

# index.html
p=Path('index.html')
s=p.read_text()
s=s.replace('Beta 0.39','Beta 0.40')
s=s.replace('const STATUS_NOTICE_KEY="bitacora_dual_status_notices_v1";\n','')
s=s.replace('let statusNoticesSeen=new Set();\ntry{statusNoticesSeen=new Set(JSON.parse(sessionStorage.getItem(STATUS_NOTICE_KEY)||"[]"))}catch{}\n','')
old='''function showStatusNotice(status){\n  const message=STATUS_NOTICES[status];\n  if(!message)return;\n  const alwaysRemind=status==="falta";\n  if(!alwaysRemind&&statusNoticesSeen.has(status))return;\n  if(!alwaysRemind){\n    statusNoticesSeen.add(status);\n    try{sessionStorage.setItem(STATUS_NOTICE_KEY,JSON.stringify([...statusNoticesSeen]))}catch{}\n  }\n  const dialog=$("#statusDialog"),title=$("#statusTitle"),body=$("#statusMessage"),mark=$("#statusMark"),note=$("#statusNote");\n  const meta=status==="falta"?{title:"Antes de registrar la falta",mark:"!"}:status==="sin_labores"?{title:"Antes de marcar Sin labores",mark:"i"}:{title:"Antes de marcar Día inhábil",mark:"★"};\n  if(!dialog){alert(meta.title+"\\n\\n"+message);return}\n  dialog.dataset.status=status;title.textContent=meta.title;body.textContent=message;mark.textContent=meta.mark;\n  if(note)note.textContent=alwaysRemind?"Este recordatorio aparecerá cada vez que selecciones Falta.":"Este recordatorio se muestra solo la primera vez que eliges este estado durante la sesión.";\n  if(typeof dialog.showModal==="function")dialog.showModal();else alert(meta.title+"\\n\\n"+message)\n}'''
new='''function showStatusNotice(status){\n  const message=STATUS_NOTICES[status];\n  if(!message)return;\n  const dialog=$("#statusDialog"),title=$("#statusTitle"),body=$("#statusMessage"),mark=$("#statusMark"),note=$("#statusNote");\n  const meta=status==="falta"?{title:"Antes de registrar la falta",mark:"!"}:status==="sin_labores"?{title:"Antes de marcar Sin labores",mark:"i"}:{title:"Antes de marcar Día inhábil",mark:"★"};\n  if(!dialog){alert(meta.title+"\\n\\n"+message);return}\n  dialog.dataset.status=status;title.textContent=meta.title;body.textContent=message;mark.textContent=meta.mark;\n  if(note)note.textContent="Este recordatorio aparecerá cada vez que selecciones este estado.";\n  if(typeof dialog.showModal==="function")dialog.showModal();else alert(meta.title+"\\n\\n"+message)\n}'''
if old not in s: raise SystemExit('showStatusNotice block not found')
s=s.replace(old,new,1)
s=s.replace('sin_labores:"No olvides avisar a la directora de Vinculación que tu empresa no laborará.",','sin_labores:"No olvides avisar a la directora de Vinculación que en tu empresa no laborarán.",')
s=s.replace('inhabil:"Día inhábil solo aplica para días feriados o inhábiles de acuerdo con el calendario escolar oficial vigente de la DGETI y de Educación Dual."','inhabil:"Esta opción es exclusiva para los días contemplados como inhábiles o feriados en los calendarios oficiales vigentes de la DGETI, CBTis, SEP y el calendario interno propio aplicable a Educación Dual."')
s=s.replace('Esta ventana se muestra solo la primera vez que eliges este estado durante la sesión.','Este recordatorio aparecerá cada vez que selecciones este estado.')
p.write_text(s)

# README.md
p=Path('README.md'); r=p.read_text()
r=r.replace('Beta%200.39','Beta%200.40').replace('**Beta 0.39**','**Beta 0.40**')
r=r.replace('Avisos preventivos la primera vez que se selecciona Falta, Sin labores o Día inhábil durante la sesión, mostrados en ventanas visuales integradas al diseño del sistema.','Avisos preventivos cada vez que se selecciona Falta, Sin labores o Día inhábil, mostrados en ventanas visuales integradas al diseño del sistema.')
p.write_text(r)

# FAQ
p=Path('faq/index.html'); f=p.read_text()
f=f.replace('Beta 0.39','Beta 0.40')
f=f.replace('La primera vez que selecciones cada uno de estos estados durante la sesión, el generador mostrará un recordatorio:','Cada vez que selecciones Falta, Sin labores o Día inhábil, el generador mostrará un recordatorio:')
f=f.replace('<li><strong>Sin labores:</strong> avisa a la directora de Vinculación que la empresa no laborará y escribe la justificación correspondiente.</li>','<li><strong>Sin labores:</strong> avisa a la directora de Vinculación que en tu empresa no laborarán y escribe la justificación correspondiente.</li>')
f=f.replace('<li><strong>Día inhábil:</strong> úsalo únicamente cuando corresponda a un día feriado o inhábil del calendario escolar oficial vigente de la <strong>DGETI</strong> y de Educación Dual. El generador coloca automáticamente la leyenda <code>Falta de acuerdo con el calendario escolar vigente</code>.</li>','<li><strong>Día inhábil:</strong> esta opción es exclusiva para días contemplados como inhábiles o feriados en los calendarios oficiales vigentes de <strong>DGETI, CBTis, SEP</strong> y el calendario interno propio aplicable a Educación Dual. El generador coloca automáticamente la leyenda <code>Falta de acuerdo con el calendario escolar vigente</code>.</li>')
# Replace current release card and push 0.39 into previous list
pattern=re.compile(r'<article class="release-item"><div class="release-head"><strong>Beta 0\.40</strong><span>Actual</span></div><ul>.*?</ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">', re.S)
m=pattern.search(f)
if not m: raise SystemExit('release current block not found')
current='<article class="release-item"><div class="release-head"><strong>Beta 0.40</strong><span>Actual</span></div><ul><li>Falta, Sin labores y Día inhábil muestran su recordatorio cada vez que se seleccionan.</li><li>Sin labores recuerda avisar a la directora de Vinculación que en la empresa no laborarán.</li><li>Día inhábil queda señalado como opción exclusiva para fechas contempladas en los calendarios oficiales vigentes de DGETI, CBTis, SEP y el calendario interno propio aplicable a Educación Dual.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.39</strong></div><ul><li>El recordatorio de Falta pasó a mostrarse cada vez que se selecciona.</li><li>Sin labores y Día inhábil conservaban el aviso de primera vez por sesión.</li></ul></article>'
f=f[:m.start()]+current+f[m.end():]
p.write_text(f)
