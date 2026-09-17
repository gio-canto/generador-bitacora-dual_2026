from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
needle='\\n<script>\\n(()=>{\\n  "use strict";\\n  const AUDIO_SRC="Assets/Asset_vt_in_nocy.mp3";'
pos=s.rfind(needle)
assert pos!=-1, 'No se encontro el bloque escapado'
end=s.find('</body>',pos)
assert end!=-1
block=s[pos:end]
block=block.replace('\\n','\n')
s=s[:pos]+block+s[end:]
p.write_text(s,encoding='utf-8')
assert '\\n<script>\\n(()=>{' not in s
