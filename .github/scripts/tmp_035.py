from pathlib import Path

index_path = Path('index.html')
index = index_path.read_text(encoding='utf-8')

council = 'const COUNCIL="Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)";'
presets = '''const COMPANY_PRESETS={
  [COUNCIL]:{start:"10:00",end:"14:00",area:"Área de Informática"},
  "Instituto Tecnológico de Chilpancingo (ITCH)":{start:"08:00",end:"15:00",area:"Área de Informática"},
  "100% Natural Aeropuerto S.A. de C.V. (100% Natural)":{start:"10:00",end:"15:00",area:"Área de Informática"},
  "Chilpancingo Inn, S.A. de C.V. (Holiday Inn)":{start:"09:00",end:"14:00",area:"Área de Informática"},
  "Automóviles de Iguala, S.A. de C.V. (Nissan)":{start:"08:00",end:"15:00",area:"Área de Informática"},
  "La Avispa, Museo Interactivo":{start:"10:00",end:"15:00",area:"Área de Informática"}
};
function companyDefaults(company){return COMPANY_PRESETS[company]||{start:"10:00",end:"14:00",area:"Área de Informática"}}
function applyCompanyDefaults(){const preset=companyDefaults($("#company").value);$("#defaultStart").value=preset.start;$("#defaultEnd").value=preset.end}
'''
if 'const COMPANY_PRESETS=' not in index:
    if council not in index:
        raise SystemExit('COUNCIL marker not found')
    index = index.replace(council, council + '\n' + presets, 1)

old_blank = 'function blankEntry(date=""){return{date,status:"laboral",start:$("#defaultStart").value||"10:00",end:$("#defaultEnd").value||"14:00",area:"Área de Informática",activity:""}}'
new_blank = 'function blankEntry(date=""){const preset=companyDefaults($("#company").value);return{date,status:"laboral",start:$("#defaultStart").value||preset.start,end:$("#defaultEnd").value||preset.end,area:preset.area,activity:""}}'
if old_blank in index:
    index = index.replace(old_blank, new_blank, 1)
elif new_blank not in index:
    raise SystemExit('blankEntry pattern not found')

pos = index.find('function syncCompanyContext()')
end = index.find('\nfunction fillIdentity', pos)
if pos < 0 or end < 0:
    raise SystemExit('syncCompanyContext block not found')
block = index[pos:end]
if 'applyCompanyDefaults()' not in block:
    if 'setInstructorEnabledUI()}' not in block:
        raise SystemExit('setInstructorEnabledUI marker not found')
    block = block.replace('setInstructorEnabledUI()}', 'setInstructorEnabledUI();applyCompanyDefaults()}', 1)
    index = index[:pos] + block + index[end:]
index_path.write_text(index, encoding='utf-8')

readme_path = Path('README.md')
readme = readme_path.read_text(encoding='utf-8')
readme = readme.replace('Beta%200.34', 'Beta%200.35').replace('**Beta 0.34**', '**Beta 0.35**')
needle = '- Horarios predeterminados editables.\n'
add = '- Horarios predeterminados editables.\n- Horarios y área predeterminados ajustados automáticamente según la empresa seleccionada, sin impedir modificaciones manuales.\n'
if needle in readme and 'ajustados automáticamente según la empresa seleccionada' not in readme:
    readme = readme.replace(needle, add, 1)
readme_path.write_text(readme, encoding='utf-8')

faq_path = Path('faq/index.html')
faq = faq_path.read_text(encoding='utf-8')
faq = faq.replace('Beta 0.34', 'Beta 0.35')

css_marker = '.contribute{margin-top:28px;'
release_css = '.release-notes{margin-top:28px;padding:24px;border-radius:24px;background:#fff;border:1px solid rgba(0,0,0,.06);box-shadow:var(--shadow)}.release-notes h2{margin:0 0 7px;font-size:26px;letter-spacing:-.035em}.release-intro{margin:0 0 16px;color:var(--muted);font-size:14px;line-height:1.55}.release-list{display:grid;gap:10px}.release-item{padding:15px 16px;border-radius:17px;background:#f5f5f7}.release-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.release-head strong{font-size:13.5px}.release-head span{padding:4px 8px;border-radius:999px;background:#fff;color:var(--blue);font-size:10.5px;font-weight:760}.release-item ul{margin:0;padding-left:19px;color:#525256;font-size:12.8px;line-height:1.55}.release-item li{margin:4px 0}'
if '.release-notes{' not in faq:
    if css_marker not in faq:
        raise SystemExit('FAQ CSS marker not found')
    faq = faq.replace(css_marker, release_css + css_marker, 1)
faq = faq.replace('.contribute{padding:20px;border-radius:20px}', '.release-notes,.contribute{padding:20px;border-radius:20px}', 1)

q_marker = '</section>\n<div class="empty" id="emptyState">'
question = '''<details data-search="horarios predeterminados empresa turno entrada salida area informatica cocytieg tecnm hotel nissan museo natural"><summary>¿Por qué cambia el horario predeterminado cuando selecciono una empresa?</summary><div class="answer"><p>Desde la <strong>Beta 0.35</strong>, el generador ajusta automáticamente la entrada, la salida y, cuando corresponde, el área predeterminada según la empresa seleccionada.</p><ul><li><strong>COCYTIEG:</strong> 10:00–14:00.</li><li><strong>TecNM Campus Chilpancingo:</strong> 08:00–15:00.</li><li><strong>100% Natural:</strong> 10:00–15:00.</li><li><strong>Holiday Inn:</strong> 09:00–14:00.</li><li><strong>Nissan / Automóviles de Iguala:</strong> 08:00–15:00 y Área de Informática.</li><li><strong>La Avispa, Museo Interactivo:</strong> 10:00–15:00.</li></ul><p>Son valores iniciales para agilizar el llenado. <strong>Puedes modificarlos manualmente</strong> si tu horario real es distinto. Cambiar de empresa tampoco altera las jornadas que ya capturaste.</p><div class="important">Si tu empresa o Vinculación te indican otro horario, utiliza siempre el horario real y la instrucción oficial.</div></div></details>
'''
if '¿Por qué cambia el horario predeterminado cuando selecciono una empresa?' not in faq:
    if q_marker not in faq:
        raise SystemExit('FAQ list marker not found')
    faq = faq.replace(q_marker, question + q_marker, 1)

contribute = '<section class="contribute">'
releases = '''<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.35</span><h2 id="releaseNotesTitle">Notas de actualización</h2><p class="release-intro">Cambios recientes del Generador de Bitácora Dual 2026.</p><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.35</strong><span>Actual</span></div><ul><li>Horarios predeterminados por empresa.</li><li>Área predeterminada de Informática para Nissan / Automóviles de Iguala.</li><li>Nueva sección de notas de actualización dentro del FAQ.</li></ul></article><article class="release-item"><div class="release-head"><strong>Beta 0.34</strong></div><ul><li>Se ampliaron los disparadores secretos del easter egg de créditos.</li></ul></article><article class="release-item"><div class="release-head"><strong>Beta 0.33</strong></div><ul><li>El PDF identifica la empresa debajo de Autorizó y del Instructor Formador usando abreviaturas cuando están disponibles.</li></ul></article><article class="release-item"><div class="release-head"><strong>Beta 0.32</strong></div><ul><li>Optimización de la generación del PDF y de la ventana “PDF listo”.</li><li>Menos trabajo de renderizado y menor bloqueo visual al terminar la exportación.</li></ul></article><article class="release-item"><div class="release-head"><strong>Beta 0.31</strong></div><ul><li>Catálogo de responsables de Autorizó para TecNM Campus Chilpancingo.</li><li>Etiquetas de firma para alumno, asesor de empresa y Vinculación.</li><li>Ajuste de proporción del logotipo en el PDF.</li></ul></article></div></section>
'''
if 'id="releaseNotesTitle"' not in faq:
    if contribute not in faq:
        raise SystemExit('Contribute section marker not found')
    faq = faq.replace(contribute, releases + contribute, 1)
faq_path.write_text(faq, encoding='utf-8')
