from pathlib import Path
import re

index = Path('index.html')
s = index.read_text()

# Modal note gets its own id so the message can match the reminder policy.
s = s.replace(
    '<div class="status-note">Esta ventana se muestra solo la primera vez que eliges este estado durante la sesión.</div>',
    '<div class="status-note" id="statusNote">Recordatorio del estado seleccionado.</div>'
)

old = '''function showStatusNotice(status){
  const message=STATUS_NOTICES[status];
  if(!message||statusNoticesSeen.has(status))return;
  statusNoticesSeen.add(status);
  try{sessionStorage.setItem(STATUS_NOTICE_KEY,JSON.stringify([...statusNoticesSeen]))}catch{}
  const dialog=$("#statusDialog"),title=$("#statusTitle"),body=$("#statusMessage"),mark=$("#statusMark");
  const meta=status==="falta"?{title:"Antes de registrar la falta",mark:"!"}:status==="sin_labores"?{title:"Antes de marcar Sin labores",mark:"i"}:{title:"Antes de marcar Día inhábil",mark:"★"};
  if(!dialog){alert(meta.title+"\\n\\n"+message);return}
  dialog.dataset.status=status;title.textContent=meta.title;body.textContent=message;mark.textContent=meta.mark;
  if(typeof dialog.showModal==="function")dialog.showModal();else alert(meta.title+"\\n\\n"+message)
}'''
new = '''function showStatusNotice(status){
  const message=STATUS_NOTICES[status];
  if(!message)return;
  const alwaysRemind=status==="falta";
  if(!alwaysRemind&&statusNoticesSeen.has(status))return;
  if(!alwaysRemind){
    statusNoticesSeen.add(status);
    try{sessionStorage.setItem(STATUS_NOTICE_KEY,JSON.stringify([...statusNoticesSeen]))}catch{}
  }
  const dialog=$("#statusDialog"),title=$("#statusTitle"),body=$("#statusMessage"),mark=$("#statusMark"),note=$("#statusNote");
  const meta=status==="falta"?{title:"Antes de registrar la falta",mark:"!"}:status==="sin_labores"?{title:"Antes de marcar Sin labores",mark:"i"}:{title:"Antes de marcar Día inhábil",mark:"★"};
  if(!dialog){alert(meta.title+"\\n\\n"+message);return}
  dialog.dataset.status=status;title.textContent=meta.title;body.textContent=message;mark.textContent=meta.mark;
  if(note)note.textContent=alwaysRemind?"Este recordatorio aparecerá cada vez que selecciones Falta.":"Este recordatorio se muestra solo la primera vez que eliges este estado durante la sesión.";
  if(typeof dialog.showModal==="function")dialog.showModal();else alert(meta.title+"\\n\\n"+message)
}'''
if old not in s:
    raise SystemExit('showStatusNotice block missing')
s = s.replace(old, new, 1)
index.write_text(s)

readme = Path('README.md')
r = readme.read_text()
r = r.replace('Beta%200.38', 'Beta%200.39').replace('**Beta 0.38**', '**Beta 0.39**')
r = r.replace(
    '- Avisos preventivos la primera vez que se selecciona Falta, Sin labores o Día inhábil durante la sesión, mostrados en ventanas visuales integradas al diseño del sistema.',
    '- Avisos preventivos en ventanas visuales: **Falta** recuerda siempre avisar a Vinculación y al jefe inmediato; **Sin labores** y **Día inhábil** se recuerdan la primera vez por sesión.'
)
readme.write_text(r)

faq = Path('faq/index.html')
f = faq.read_text()
f = f.replace('Beta 0.38', 'Beta 0.39', 2)
old_faq = '<p>La primera vez que selecciones cada uno de estos estados durante la sesión, el generador mostrará un recordatorio:</p><ul><li><strong>Falta:</strong> avisa a la directora de Vinculación y a tu jefe inmediato. Además, debes escribir la justificación.</li><li><strong>Sin labores:</strong> avisa a la directora de Vinculación que la empresa no laborará y escribe la justificación correspondiente.</li><li><strong>Día inhábil:</strong> úsalo únicamente cuando corresponda a un día feriado o inhábil del calendario escolar oficial vigente de la <strong>DGETI</strong> y de Educación Dual. El generador coloca automáticamente la leyenda <code>Falta de acuerdo con el calendario escolar vigente</code>.</li></ul>'
new_faq = '<p>El generador muestra recordatorios según el estado seleccionado:</p><ul><li><strong>Falta:</strong> el aviso aparece <strong>cada vez que selecciones Falta</strong>, aunque ya lo hayas visto antes. Recuerda avisar a la directora de Vinculación y a tu jefe inmediato, además de escribir la justificación.</li><li><strong>Sin labores:</strong> el aviso aparece la primera vez de la sesión; recuerda informar a la directora de Vinculación que la empresa no laborará y escribir la justificación correspondiente.</li><li><strong>Día inhábil:</strong> el aviso aparece la primera vez de la sesión. Úsalo únicamente cuando corresponda a un día feriado o inhábil del calendario escolar oficial vigente de la <strong>DGETI</strong> y de Educación Dual. El generador coloca automáticamente la leyenda <code>Falta de acuerdo con el calendario escolar vigente</code>.</li></ul>'
if old_faq not in f:
    raise SystemExit('FAQ reminder paragraph missing')
f = f.replace(old_faq, new_faq, 1)

# Promote a new current release note and move 0.38 into the previous-version list.
current_pat = re.compile(r'<article class="release-item"><div class="release-head"><strong>Beta 0\.38</strong><span>Actual</span></div>.*?</article>', re.S)
m = current_pat.search(f)
if not m:
    raise SystemExit('current Beta 0.38 release note missing')
old_current = m.group(0).replace('<span>Actual</span>', '')
new_current = '<article class="release-item"><div class="release-head"><strong>Beta 0.39</strong><span>Actual</span></div><ul><li>El recordatorio de Falta ahora aparece cada vez que se selecciona ese estado, aunque ya se haya mostrado antes durante la sesión.</li><li>Sin labores y Día inhábil conservan el recordatorio solo la primera vez por sesión.</li></ul></article>'
f = f[:m.start()] + new_current + f[m.end():]
needle = '<details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
if needle not in f:
    raise SystemExit('previous release list marker missing')
f = f.replace(needle, needle + old_current, 1)
faq.write_text(f)
