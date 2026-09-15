from pathlib import Path
import re

# index.html
p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('<div class="status-note" id="statusNote">Este recordatorio se muestra solo la primera vez que eliges este estado durante la sesión.</div>','')
s=s.replace('<div class="status-note" id="statusNote">Este recordatorio aparecerá cada vez que selecciones este estado.</div>','')
s=s.replace(',note=$("#statusNote")','')
s=re.sub(r'\n\s*if\(note\)note\.textContent=.*?;','',s)
p.write_text(s,encoding='utf-8')

# README.md
p=Path('README.md')
s=p.read_text(encoding='utf-8')
s=s.replace('Beta%200.40','Beta%200.41')
s=s.replace('**Beta 0.40**','**Beta 0.41**')
p.write_text(s,encoding='utf-8')

# FAQ
p=Path('faq/index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('<section class="contribute"><span class="version-chip">Beta 0.40</span>', '<section class="contribute"><span class="version-chip">Beta 0.41</span>', 1)
s=s.replace('<p class="version-note"><strong>Beta 0.40</strong></p>', '<p class="version-note"><strong>Beta 0.41</strong></p>', 1)
s=s.replace('<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.40</span>', '<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.41</span>', 1)
old='<article class="release-item"><div class="release-head"><strong>Beta 0.40</strong><span>Actual</span></div><ul><li>Falta, Sin labores y Día inhábil muestran su recordatorio cada vez que se seleccionan.</li><li>Sin labores recuerda avisar a la directora de Vinculación que en la empresa no laborarán.</li><li>Día inhábil queda señalado como opción exclusiva para fechas contempladas en los calendarios oficiales vigentes de DGETI, CBTis, SEP y el calendario interno propio aplicable a Educación Dual.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
new='<article class="release-item"><div class="release-head"><strong>Beta 0.41</strong><span>Actual</span></div><ul><li>Se eliminó el texto redundante que indicaba que los recordatorios aparecerían cada vez que se seleccionara un estado especial.</li><li>El comportamiento de las alertas se mantiene sin cambios.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.40</strong></div><ul><li>Falta, Sin labores y Día inhábil muestran su recordatorio cada vez que se seleccionan.</li><li>Sin labores recuerda avisar a la directora de Vinculación que en la empresa no laborarán.</li><li>Día inhábil queda señalado como opción exclusiva para fechas contempladas en los calendarios oficiales vigentes de DGETI, CBTis, SEP y el calendario interno propio aplicable a Educación Dual.</li></ul></article>'
if old not in s:
    raise SystemExit('No se encontró el bloque actual de Beta 0.40 en FAQ')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
