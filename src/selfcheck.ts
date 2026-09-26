import assert from 'node:assert/strict';
import { normalizeDictionaryApi } from './dictionary.js';

const sample = [{
  word: 'hello',
  phonetic: 'həˈləʊ',
  phonetics: [{ text: 'həˈləʊ', audio: '//ssl.gstatic.com/dictionary/hello.mp3' }],
  origin: 'early 19th century: variant of earlier hollo.',
  meanings: [
    {
      partOfSpeech: 'exclamation',
      definitions: [
        { definition: 'used as a greeting', example: 'hello there', synonyms: ['hi'], antonyms: [] },
        { definition: 'used as a greeting' },
      ],
    },
    { partOfSpeech: 'noun', definitions: [{ definition: 'an utterance of hello' }] },
  ],
  sourceUrls: ['https://en.wiktionary.org/wiki/hello'],
}];

const e = normalizeDictionaryApi(sample, 'hello');
assert.equal(e.word, 'hello');
assert.equal(e.phonetic, 'həˈləʊ');
assert.equal(e.audioUrl, 'https://ssl.gstatic.com/dictionary/hello.mp3');
assert.ok(e.origin?.includes('19th century'));
assert.equal(e.meanings.length, 2);
assert.equal(e.meanings[0].definitions.length, 1); // duplicate definition deduped
assert.equal(e.meanings[1].partOfSpeech, 'noun');
assert.deepEqual(e.sourceUrls, ['https://en.wiktionary.org/wiki/hello']);

if (process.argv.includes('--live')) {
  const { fetchWord, suggest, WordNotFound } = await import('./dictionary.js');
  const w = await fetchWord('hello');
  assert.ok(w.meanings.length > 0);
  assert.ok((await suggest('hel')).includes('hello'));
  try {
    await fetchWord('xyzqqqnotaword');
    assert.fail('expected WordNotFound');
  } catch (err) {
    assert.ok(err instanceof WordNotFound);
  }
  console.log('live checks ok');
}

console.log('selfcheck ok');
