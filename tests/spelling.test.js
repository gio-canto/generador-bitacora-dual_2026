import {beforeAll, expect, it} from 'vitest';
import nspell from 'nspell';
import {readFileSync} from 'node:fs';
import {nextMisspelling, replaceSpelling} from '../src/services/spelling-core.js';
import {
  applyProjectDictionary,
  PROJECT_DICTIONARY_WORDS,
} from '../src/services/spelling-dictionary.js';
let spell;
beforeAll(() => {
  spell = nspell(readFileSync('node_modules/dictionary-es/index.aff','utf8'), readFileSync('node_modules/dictionary-es/index.dic','utf8'));
  applyProjectDictionary(spell);
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

it('acepta nombres y términos procedentes de los catálogos institucionales', () => {
  expect(PROJECT_DICTIONARY_WORDS).toContain('Vepsania');
  expect(PROJECT_DICTIONARY_WORDS).toContain('COCyTEG');
  expect(PROJECT_DICTIONARY_WORDS).toContain('UAGro');
  expect(PROJECT_DICTIONARY_WORDS).toContain('Chilpancingo');
  expect(nextMisspelling('Vepsania colaboró con COCyTEG y UAGro en Chilpancingo.', spell)).toBeNull();
});

it('acepta vocabulario técnico de las áreas soportadas sin ocultar faltas reales', () => {
  expect(
    nextMisspelling(
      'Configuré React TypeScript Docker PostgreSQL frontend backend onboarding ecommerce chatbot dataset Shopify GitHub.',
      spell,
    ),
  ).toBeNull();
  const issue = nextMisspelling('Configuré React y después escrivi el reporte.', spell);
  expect(issue?.word).toBe('escrivi');
});

it('mantiene un diccionario de proyecto amplio y deduplicado', () => {
  expect(PROJECT_DICTIONARY_WORDS.length).toBeGreaterThan(250);
  expect(new Set(PROJECT_DICTIONARY_WORDS).size).toBe(PROJECT_DICTIONARY_WORDS.length);
});
