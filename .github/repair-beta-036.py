from pathlib import Path

index_path=Path('index.html')
index=index_path.read_text(encoding='utf-8')
old='<div class="delivery-item"><b>4</b><div><strong>¿Todavía no tienes una firma?</strong><p>Si tú aún no tienes una firma definida, puedes escribir tu nombre completo en el espacio de firma.</p></div><div class="delivery-item"><b>5</b><div><strong>Solo firmas autógrafas</strong><p>No se permiten firmas digitales. Las firmas de la bitácora deben realizarse de forma autógrafa en el documento impreso.</p></div></div></div><div class="delivery-note">'
new='<div class="delivery-item"><b>4</b><div><strong>¿Todavía no tienes una firma?</strong><p>Si tú aún no tienes una firma definida, puedes escribir tu nombre completo en el espacio de firma.</p></div></div><div class="delivery-item"><b>5</b><div><strong>Solo firmas autógrafas</strong><p>No se permiten firmas digitales. Las firmas de la bitácora deben realizarse de forma autógrafa en el documento impreso.</p></div></div></div><div class="delivery-note">'
if old not in index:
    raise SystemExit('delivery structure pattern not found')
index=index.replace(old,new,1)
index_path.write_text(index,encoding='utf-8')

faq_path=Path('faq/index.html')
faq=faq_path.read_text(encoding='utf-8')
faq=faq.replace('Desde la <strong>Beta 0.36</strong>, el generador ajusta automáticamente la entrada, la salida y, cuando corresponde, el área predeterminada según la empresa seleccionada.','Desde la <strong>Beta 0.35</strong>, el generador ajusta automáticamente la entrada, la salida y, cuando corresponde, el área predeterminada según la empresa seleccionada.',1)
faq_path.write_text(faq,encoding='utf-8')
