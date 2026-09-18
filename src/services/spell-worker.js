import nspell from 'nspell';
import aff from '../../node_modules/dictionary-es/index.aff?raw';
import dic from '../../node_modules/dictionary-es/index.dic?raw';
import {nextMisspelling} from './spelling-core.js';
let spell;
self.onmessage = ({data}) => {
  try {
    spell ||= nspell(aff, dic);
    self.postMessage({issue: nextMisspelling(data.text, spell, data.ignored)});
  } catch {
    self.postMessage({error: true});
  }
};
