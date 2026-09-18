import {beforeAll, expect, it} from 'vitest';
import nspell from 'nspell';
import {readFileSync} from 'node:fs';
import {nextMisspelling, replaceSpelling} from '../src/services/spelling-core.js';
let spell;
beforeAll(() => {
  spell = nspell(readFileSync('node_modules/dictionary-es/index.aff','utf8'), readFileSync('node_modules/dictionary-es/index.dic','utf8'));
});
it('detecta una falta real en español y propone la palabra con tilde', () => {
  const issue = nextMisspelling('Revisé la **bitacora**.', spell);
  expect(issue.word).toBe('bitacora');
  expect(issue.suggestions).toContain('bitácora');
  expect(replaceSpelling('Revisé la **bitacora**.', issue, 'bitácora')).toBe('Revisé la **bitácora**.');
});
it('omite siglas, código, enlaces y palabras que el usuario acepta', () => {
  expect(nextMisspelling('COCYTIEG `codigoxyz` https://ejemplo.com/errror Palabrainventada', spell, ['Palabrainventada'])).toBeNull();
});
it('no modifica otra aparición ni un texto que ya cambió', () => {
  const issue = nextMisspelling('bitacora y bitacora', spell);
  expect(replaceSpelling('bitacora y bitacora', issue, 'bitácora')).toBe('bitácora y bitacora');
  expect(replaceSpelling('actividad nueva', issue, 'bitácora')).toBeNull();
});
it('acepta frases correctas y conserva caracteres combinados', () => {
  expect(nextMisspelling('Realicé actividades de programación y revisión.', spell)).toBeNull();
});
