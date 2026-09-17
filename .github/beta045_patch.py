from pathlib import Path
import re

index_path=Path('index.html')
readme_path=Path('README.md')
faq_path=Path('faq/index.html')
index=index_path.read_text(encoding='utf-8')
readme=readme_path.read_text(encoding='utf-8')
faq=faq_path.read_text(encoding='utf-8')

def rep(text, old, new, label, count=1):
    found=text.count(old)
    if found < count:
        raise SystemExit(f'{label}: esperado >= {count}, encontrado {found}')
    return text.replace(old,new,count)

# 1) Aviso de nombres cortos más natural.
old='const list=short.map(([label,value])=>`${label}: ${value}`).join("\\n");\n  const ok=await showGuardConfirm("¿El nombre está completo?",`Estos nombres tienen menos de 3 palabras:\\n\\n${list}\\n\\nVerifica que estén escritos correctamente. Si la persona no utiliza apellido materno o su nombre legal realmente tiene menos palabras, puedes hacer caso omiso y continuar.`,"Sí, está correcto","Revisar");'
new='const list=short.map(([label,value])=>`${label}: ${value}`).join("\\n");\n  const ok=await showGuardConfirm("¿El nombre está completo?",`Solo tienes 1 nombre y un apellido o está incompleto:\\n\\n${list}\\n\\nVerifica que esté escrito correctamente. Si la persona no utiliza apellido materno o su nombre legal realmente tiene menos palabras, puedes hacer caso omiso y continuar.`,"Sí, está correcto","Revisar");'
index=rep(index,old,new,'mensaje de nombres')

# 2) Quitar texto fijo de reglas en Registra la semana.
old='<div class="week-rule"><strong>La bitácora debe tener exactamente 4 días.</strong> Cada actividad requiere al menos 4 palabras. El límite de líneas se calcula automáticamente con el espacio disponible en la hoja y cambia según lo escrito en las otras jornadas.</div>'
index=rep(index,old,'','regla visible semana')
index=re.sub(r'\.week-rule\{[^}]*\}(?:\.week-rule strong\{[^}]*\})?','',index)

# 3) Mensaje más humano cuando no hay exactamente cuatro días.
old='if(entries.length!==MAX_DAYS)return{ok:false,title:"Se requieren exactamente 4 días",message:`La bitácora semanal debe contener exactamente 4 jornadas. Actualmente tienes ${entries.length}. Agrega o elimina días hasta tener 4.`};'
new='if(entries.length!==MAX_DAYS)return{ok:false,title:"Faltan o te pasaste de días",message:"Recuerda que en tu modalidad dual tienes que registrar tus días de martes a viernes. Si no laboras uno de esos días, selecciona la casilla correspondiente."};'
index=rep(index,old,new,'validacion cuatro dias')

# 4) Contador simplificado: solo líneas restantes.
old='el.textContent=entries[i]?.status==="inhabil"?`Automático · ${m.used} líneas PDF`:`Líneas PDF: ${m.used}/${m.max} máximo dinámico`;'
new='const left=Math.max(0,m.max-m.used);el.textContent=entries[i]?.status==="inhabil"?"Automático":`Te queda${left===1?"":"n"} ${left} línea${left===1?"":"s"}`;'
index=rep(index,old,new,'contador lineas')
old='<div class="counter"><span class="line-budget" data-lines="${i}">Calculando líneas…</span><span>·</span><span data-count="${i}">${e.activity.length}</span>/${ACTIVITY_LIMIT} caracteres</div>'
new='<div class="counter"><span class="line-budget" data-lines="${i}">Calculando…</span></div>'
index=rep(index,old,new,'contador caracteres')

# Versión README.
readme=rep(readme,'Beta%200.44','Beta%200.45','badge README')
readme=rep(readme,'## Versión\n\n**Beta 0.44**','## Versión\n\n**Beta 0.45**','version README')
old='- Límite dinámico de líneas por jornada: el espacio disponible se recalcula con base en lo escrito en los otros días y bloquea contenido que haría rebasar una hoja.'
new='- Límite dinámico de líneas por jornada: el espacio disponible se recalcula con base en lo escrito en los otros días, bloquea contenido que haría rebasar una hoja y muestra únicamente cuántas líneas quedan.'
readme=rep(readme,old,new,'descripcion lineas README')
old='- Aviso no restrictivo para nombres de alumno o responsables con menos de 3 palabras.'
new='- Aviso no restrictivo cuando un nombre parece contener solo un nombre y un apellido o estar incompleto.'
readme=rep(readme,old,new,'descripcion nombres README')

# FAQ: versión y nota actual.
faq=rep(faq,'<section class="contribute"><span class="version-chip">Beta 0.44</span>','<section class="contribute"><span class="version-chip">Beta 0.45</span>','chip contribucion FAQ')
faq=rep(faq,'<p class="version-note"><strong>Beta 0.44</strong></p>','<p class="version-note"><strong>Beta 0.45</strong></p>','version contribucion FAQ')
old='<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.44</span><h2 id="releaseNotesTitle">Notas de actualización</h2><p class="release-intro">Cambios recientes del Generador de Bitácora Dual 2026.</p><article class="release-item"><div class="release-head"><strong>Beta 0.44</strong><span>Actual</span></div><ul><li>La semana exige exactamente 4 jornadas y cada actividad o justificación requiere al menos 4 palabras legibles.</li><li>El límite de líneas del PDF ahora es dinámico y bloquea escritura adicional cuando los cuatro días ya no cabrían en una sola hoja.</li><li>El grupo queda restringido a A, B, C o D.</li><li>El borrador se autoguarda localmente y se recupera al volver a abrir el generador en el mismo navegador y dispositivo.</li><li>Los nombres con menos de 3 palabras muestran una confirmación no restrictiva para revisar posibles apellidos faltantes.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list">'
new='<section class="release-notes" aria-labelledby="releaseNotesTitle"><span class="version-chip">Beta 0.45</span><h2 id="releaseNotesTitle">Notas de actualización</h2><p class="release-intro">Cambios recientes del Generador de Bitácora Dual 2026.</p><article class="release-item"><div class="release-head"><strong>Beta 0.45</strong><span>Actual</span></div><ul><li>El aviso de nombres cortos ahora usa una redacción más natural: indica que puede haber solo un nombre y un apellido o que el nombre esté incompleto.</li><li>Se retiró el bloque fijo de reglas de la sección Registra la semana para reducir ruido visual.</li><li>La alerta de cantidad de días recuerda registrar de martes a viernes y usar el estado correspondiente cuando no se labore.</li><li>El contador de actividad ahora muestra únicamente cuántas líneas quedan disponibles.</li></ul></article><details class="release-disclosure"><summary>Ver versiones anteriores</summary><div class="release-list"><article class="release-item"><div class="release-head"><strong>Beta 0.44</strong></div><ul><li>La semana exige exactamente 4 jornadas y cada actividad o justificación requiere al menos 4 palabras legibles.</li><li>El límite de líneas del PDF ahora es dinámico y bloquea escritura adicional cuando los cuatro días ya no cabrían en una sola hoja.</li><li>El grupo queda restringido a A, B, C o D.</li><li>El borrador se autoguarda localmente y se recupera al volver a abrir el generador en el mismo navegador y dispositivo.</li><li>Los nombres con menos de 3 palabras muestran una confirmación no restrictiva para revisar posibles apellidos faltantes.</li></ul></article>'
faq=rep(faq,old,new,'release FAQ')

# Validaciones simples del resultado.
assert 'Beta 0.45' in readme
assert 'Beta 0.45' in faq
assert 'La bitácora debe tener exactamente 4 días.' not in index
assert 'Líneas PDF:' not in index
assert '/${ACTIVITY_LIMIT} caracteres' not in index
assert 'Faltan o te pasaste de días' in index
assert 'Solo tienes 1 nombre y un apellido o está incompleto' in index

index_path.write_text(index,encoding='utf-8')
readme_path.write_text(readme,encoding='utf-8')
faq_path.write_text(faq,encoding='utf-8')
