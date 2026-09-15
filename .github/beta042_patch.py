from pathlib import Path

# index.html: preserve a common style (including bold) on centered multi-segment lines.
p = Path('index.html')
s = p.read_text(encoding='utf-8')
old = 'function centered(c,lines,cx,top,h,s,lh,p){const total=lines.length*lh,first=top+(h-total)/2+lh*.78;lines.forEach((ln,i)=>{const t=ln.map(x=>x.text).join(""),st=ln.length===1?ln[0].style:"normal";drawText(c,t,cx,first+i*lh,s,st,"center","#000",p)})}'
new = 'function centered(c,lines,cx,top,h,s,lh,p){const total=lines.length*lh,first=top+(h-total)/2+lh*.78;lines.forEach((ln,i)=>{const t=ln.map(x=>x.text).join(""),styles=[...new Set(ln.map(x=>x.style))],st=styles.length===1?styles[0]:"normal";drawText(c,t,cx,first+i*lh,s,st,"center","#000",p)})}'
assert old in s, 'centered() original no encontrado'
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# README.md
p = Path('README.md')
s = p.read_text(encoding='utf-8')
assert 'Beta%200.41' in s
s = s.replace('Beta%200.41', 'Beta%200.42', 1)
old_alert = '- Avisos preventivos en ventanas visuales: **Falta** recuerda siempre avisar a Vinculación y al jefe inmediato; **Sin labores** y **Día inhábil** se recuerdan la primera vez por sesión.'
new_alert = '- Avisos preventivos en ventanas visuales: **Falta**, **Sin labores** y **Día inhábil** muestran su recordatorio cada vez que se seleccionan.'
assert old_alert in s
s = s.replace(old_alert, new_alert, 1)
needle = '- Etiquetas de firma en el PDF para alumno, asesor de empresa y Vinculación CBTis No. 134.\n'
assert needle in s
s = s.replace(needle, needle + '- Los rótulos **FALTA**, **SIN LABORES** y **DÍA INHÁBIL** se muestran en negrita dentro del PDF.\n', 1)
assert '## Versión\n\n**Beta 0.41**' in s
s = s.replace('## Versión\n\n**Beta 0.41**', '## Versión\n\n**Beta 0.42**', 1)
p.write_text(s, encoding='utf-8')

# FAQ
p = Path('faq/index.html')
s = p.read_text(encoding='utf-8')
assert s.count('version-chip">Beta 0.41') >= 2
s = s.replace('version-chip">Beta 0.41', 'version-chip">Beta 0.42', 2)
assert 'version-note"><strong>Beta 0.41</strong>' in s
s = s.replace('version-note"><strong>Beta 0.41</strong>', 'version-note"><strong>Beta 0.42</strong>', 1)
old_current = '<article class="release-item"><div class="release-head"><strong>Beta 0.41</strong><span>Actual</span></div><ul><li>Se eliminó el texto redundante que indicaba que los recordatorios aparecerían cada vez que se seleccionara un estado especial.</li><li>El comportamiento de las alertas se mantiene sin cambios.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
new_current = '<article class="release-item"><div class="release-head"><strong>Beta 0.42</strong><span>Actual</span></div><ul><li>Se corrigió el renderizado del PDF para que <strong>FALTA</strong>, <strong>SIN LABORES</strong> y <strong>DÍA INHÁBIL</strong> conserven el mismo estilo en negrita.</li><li>La corrección preserva correctamente el estilo de líneas centradas formadas por varias palabras.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.41</strong></div><ul><li>Se eliminó el texto redundante que indicaba que los recordatorios aparecerían cada vez que se seleccionara un estado especial.</li><li>El comportamiento de las alertas se mantiene sin cambios.</li></ul></article>'
assert old_current in s, 'bloque actual Beta 0.41 no encontrado'
s = s.replace(old_current, new_current, 1)
p.write_text(s, encoding='utf-8')
