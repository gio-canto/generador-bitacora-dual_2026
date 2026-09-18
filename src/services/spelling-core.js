// Preserve offsets in the original text (including Markdown and accented letters).
export function nextMisspelling(text, spell, ignored = []) {
  const skip = new Set(ignored.map(word => word.toLocaleLowerCase('es')));
  const masked = text.replace(/https?:\/\/\S+|\b\S+@\S+\.\S+|`[^`]*`/g, match => ' '.repeat(match.length));
  for (const match of masked.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
    const word = match[0];
    if (word.length < 2 || word.length > 40 || skip.has(word.toLocaleLowerCase('es')) || /^[A-ZÁÉÍÓÚÜÑ]{2,}$/.test(word)) continue;
    if (!spell.correct(word) && !spell.correct(word.toLocaleLowerCase('es'))) {
      return {word, start: match.index, end: match.index + word.length, suggestions: spell.suggest(word).slice(0, 5)};
    }
  }
  return null;
}
export function replaceSpelling(text, issue, replacement) {
  if (text.slice(issue.start, issue.end) !== issue.word) return null;
  return text.slice(0, issue.start) + replacement + text.slice(issue.end);
}
