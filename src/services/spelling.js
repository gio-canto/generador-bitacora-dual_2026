import {replaceSpelling} from './spelling-core.js';

export function startSpelling() {
  const dialog = document.createElement('dialog');
  dialog.className = 'spelling-dialog';
  dialog.setAttribute('aria-labelledby', 'spellingTitle');
  dialog.innerHTML = '<h2 id="spellingTitle">Revisar ortografía</h2><p>Revisión en español. Tú decides los cambios; los nombres y términos técnicos pueden ser correctos.</p><div class="spelling-result" aria-live="polite"></div><button type="button" class="btn spelling-close">Cerrar</button>';
  document.body.append(dialog);
  const result = dialog.querySelector('.spelling-result');
  let worker, timer, field, snapshot, ignored;
  const stop = () => { clearTimeout(timer); worker?.terminate(); worker = null; };
  const error = () => {
    stop();
    result.textContent = 'No pudimos cargar el corrector. Puedes seguir escribiendo y volver a intentarlo con conexión.';
  };
  const button = (label, action) => {
    const element = document.createElement('button');
    element.type = 'button'; element.className = 'btn'; element.textContent = label;
    element.addEventListener('click', action);
    return element;
  };
  const check = () => {
    if (!field?.isConnected || field.disabled) { dialog.close(); return; }
    snapshot = field.value;
    if (snapshot.length > 10000) { result.textContent = 'Revisa un texto de hasta 10 000 caracteres.'; return; }
    result.textContent = 'Revisando…';
    clearTimeout(timer);
    timer = setTimeout(error, 20000);
    worker.postMessage({text: snapshot, ignored});
  };
  dialog.querySelector('.spelling-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { stop(); if (field?.isConnected) field.focus(); });
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-spellcheck]');
    if (!trigger) return;
    field = trigger.closest('.field')?.querySelector('textarea');
    if (!field || field.disabled) return;
    ignored = [];
    stop();
    dialog.showModal();
    try {
      worker = new Worker(new URL('./spell-worker.js', import.meta.url), {type: 'module'});
      worker.onerror = error;
      worker.onmessage = ({data}) => {
        clearTimeout(timer);
        if (data.error) { error(); return; }
        if (field.value !== snapshot) { check(); return; }
        const issue = data.issue;
        result.replaceChildren();
        if (!issue) { result.textContent = 'Revisión terminada. No encontramos más posibles errores de ortografía.'; return; }
        const word = document.createElement('strong'); word.textContent = issue.word;
        const context = document.createElement('p');
        context.textContent = '…' + snapshot.slice(Math.max(0, issue.start - 45), issue.end + 45) + '…';
        const choices = document.createElement('div'); choices.className = 'spelling-choices';
        for (const suggestion of issue.suggestions) choices.append(button(suggestion, () => {
          if (field.value !== snapshot) { check(); return; }
          const corrected = replaceSpelling(snapshot, issue, suggestion);
          if (corrected === null) { check(); return; }
          field.value = corrected;
          field.dispatchEvent(new Event('input', {bubbles: true}));
          // The editor may reject a replacement that exceeds the PDF's space limit.
          if (field.value !== corrected) {
            result.replaceChildren(document.createTextNode('Ese cambio no cabe en la hoja. Reduce el texto antes de volver a revisar.'));
            return;
          }
          check();
        }));
        if (!issue.suggestions.length) choices.append(document.createTextNode('Sin sugerencias para esta palabra.'));
        choices.append(button('Omitir palabra', () => { ignored.push(issue.word); check(); }));
        result.append(word, context, choices);
      };
      check();
    } catch { error(); }
  });
}
