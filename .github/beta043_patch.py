from pathlib import Path

# index.html
p=Path('index.html')
s=p.read_text(encoding='utf-8')

old_css='.status-note{margin-top:16px;padding:13px 14px;border-radius:15px;background:#f5f5f7;color:var(--muted);font-size:12px;line-height:1.5}.status-actions{display:flex;justify-content:flex-end;margin-top:22px}'
new_css='.status-note{margin-top:16px;padding:13px 14px;border-radius:15px;background:#f5f5f7;color:var(--muted);font-size:12px;line-height:1.5}.status-help{margin-top:17px;padding:14px;border-radius:17px;background:#f5f5f7}.status-help strong{display:block;font-size:13px}.status-help p{margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.45}.status-help-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.status-help .btn{min-height:38px;padding:8px 10px;font-size:11.5px}.status-actions{display:flex;justify-content:flex-end;margin-top:22px}'
assert old_css in s
s=s.replace(old_css,new_css,1)

old_modal='<dialog class="status-dialog" id="statusDialog" aria-labelledby="statusTitle"><div class="status-shell"><div class="status-mark" id="statusMark" aria-hidden="true">!</div><h2 id="statusTitle">Recordatorio</h2><p id="statusMessage"></p><div class="status-actions"><button class="btn primary" id="statusClose" type="button">Entendido</button></div></div></dialog>'
new_modal='<dialog class="status-dialog" id="statusDialog" aria-labelledby="statusTitle"><div class="status-shell"><div class="status-mark" id="statusMark" aria-hidden="true">!</div><h2 id="statusTitle">Recordatorio</h2><p id="statusMessage"></p><div class="status-help" id="statusHelp" hidden><strong>¿Tienes duda de si tu día es inhábil?</strong><p>Consulta las fuentes oficiales antes de marcar esta opción.</p><div class="status-help-actions"><a class="btn" href="https://modelo.formaciondual.sems.gob.mx/" target="_blank" rel="noopener noreferrer">Modelo de Formación Dual</a><a class="btn" href="https://dgeti.sep.gob.mx/index.php/tramites-y-servicios" target="_blank" rel="noopener noreferrer">DGETI · Trámites y servicios</a></div></div><div class="status-actions"><button class="btn primary" id="statusClose" type="button">Entendido</button></div></div></dialog>'
assert old_modal in s
s=s.replace(old_modal,new_modal,1)

old_fn='const dialog=$("#statusDialog"),title=$("#statusTitle"),body=$("#statusMessage"),mark=$("#statusMark");'
new_fn='const dialog=$("#statusDialog"),title=$("#statusTitle"),body=$("#statusMessage"),mark=$("#statusMark"),help=$("#statusHelp");'
assert old_fn in s
s=s.replace(old_fn,new_fn,1)
old_set='dialog.dataset.status=status;title.textContent=meta.title;body.textContent=message;mark.textContent=meta.mark;\n  if(typeof dialog.showModal==="function")dialog.showModal();else alert(meta.title+"\\n\\n"+message)'
new_set='dialog.dataset.status=status;title.textContent=meta.title;body.textContent=message;mark.textContent=meta.mark;if(help)help.hidden=status!=="inhabil";\n  if(typeof dialog.showModal==="function")dialog.showModal();else alert(meta.title+"\\n\\n"+message)'
assert old_set in s
s=s.replace(old_set,new_set,1)
p.write_text(s,encoding='utf-8')

# README.md
p=Path('README.md')
s=p.read_text(encoding='utf-8')
s=s.replace('versi%C3%B3n-Beta%200.42-0071E3','versi%C3%B3n-Beta%200.43-0071E3',1)
s=s.replace('**Beta 0.42**\n\n## Desarrollo y colaboración','**Beta 0.43**\n\n## Desarrollo y colaboración',1)
needle='- Avisos preventivos en ventanas visuales: **Falta**, **Sin labores** y **Día inhábil** muestran su recordatorio cada vez que se seleccionan.\n'
assert needle in s
s=s.replace(needle,needle+'- La alerta de **Día inhábil** incluye accesos directos al Modelo de Formación Dual y a DGETI para consultar fuentes oficiales si existe duda.\n',1)
p.write_text(s,encoding='utf-8')

# FAQ
p=Path('faq/index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('<span class="version-chip">Beta 0.42</span><h2>¿Falta algo?</h2>','<span class="version-chip">Beta 0.43</span><h2>¿Falta algo?</h2>',1)
s=s.replace('<p class="version-note"><strong>Beta 0.42</strong></p>','<p class="version-note"><strong>Beta 0.43</strong></p>',1)
s=s.replace('<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.42</span>','<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.43</span>',1)
old_current='<article class="release-item"><div class="release-head"><strong>Beta 0.42</strong><span>Actual</span></div><ul><li>Se corrigió el renderizado del PDF para que <strong>FALTA</strong>, <strong>SIN LABORES</strong> y <strong>DÍA INHÁBIL</strong> conserven el mismo estilo en negrita.</li><li>La corrección preserva correctamente el estilo de líneas centradas formadas por varias palabras.</li></ul></article><details class="release-disclosure">'
new_current='<article class="release-item"><div class="release-head"><strong>Beta 0.43</strong><span>Actual</span></div><ul><li>La alerta de <strong>Día inhábil</strong> ahora incluye accesos directos al Modelo de Formación Dual y a DGETI para consultar fuentes oficiales cuando exista duda.</li><li>Los enlaces se muestran únicamente en el recordatorio de Día inhábil.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.42</strong></div><ul><li>Se corrigió el renderizado del PDF para que <strong>FALTA</strong>, <strong>SIN LABORES</strong> y <strong>DÍA INHÁBIL</strong> conserven el mismo estilo en negrita.</li><li>La corrección preserva correctamente el estilo de líneas centradas formadas por varias palabras.</li></ul></article>'
# Existing details already contains summary/div, so replace a wider prefix instead.
old_prefix='<article class="release-item"><div class="release-head"><strong>Beta 0.42</strong><span>Actual</span></div><ul><li>Se corrigió el renderizado del PDF para que <strong>FALTA</strong>, <strong>SIN LABORES</strong> y <strong>DÍA INHÁBIL</strong> conserven el mismo estilo en negrita.</li><li>La corrección preserva correctamente el estilo de líneas centradas formadas por varias palabras.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
assert old_prefix in s
s=s.replace(old_prefix,new_current,1)

faq_old='<li><strong>Día inhábil:</strong> esta opción es <strong>exclusiva</strong> para fechas contempladas como inhábiles o feriados en los calendarios oficiales vigentes de <strong>DGETI, CBTis, SEP</strong> y en el calendario interno propio aplicable a Educación Dual. El generador coloca automáticamente la leyenda <code>Falta de acuerdo con el calendario escolar vigente</code>.</li>'
faq_new='<li><strong>Día inhábil:</strong> esta opción es <strong>exclusiva</strong> para fechas contempladas como inhábiles o feriados en los calendarios oficiales vigentes de <strong>DGETI, CBTis, SEP</strong> y en el calendario interno propio aplicable a Educación Dual. El generador coloca automáticamente la leyenda <code>Falta de acuerdo con el calendario escolar vigente</code>. Si tienes duda, la ventana te ofrece acceso al <a href="https://modelo.formaciondual.sems.gob.mx/" target="_blank" rel="noopener noreferrer">Modelo de Formación Dual</a> y a <a href="https://dgeti.sep.gob.mx/index.php/tramites-y-servicios" target="_blank" rel="noopener noreferrer">DGETI · Trámites y servicios</a>.</li>'
assert faq_old in s
s=s.replace(faq_old,faq_new,1)
p.write_text(s,encoding='utf-8')
