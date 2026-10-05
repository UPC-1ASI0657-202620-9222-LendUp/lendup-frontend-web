import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTermsDocument } from '../lib/terms-document.ts';
test('terms keep numbered sections, paragraphs and bullet lists in order', () => {
  const sections = parseTermsDocument(
    'Términos y Condiciones de LendUp\n1. Qué es LendUp\nPrimer párrafo.\nSegundo párrafo.\n2. Registro\nResponsabilidades:\n• Una.\n• Dos.\nFin.\n',
  );
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, '1. Qué es LendUp');
  assert.deepEqual(
    sections[0].blocks.map((block) => block.lines[0]),
    ['Primer párrafo.', 'Segundo párrafo.'],
  );
  assert.deepEqual(sections[1].blocks[1], {
    list: true,
    lines: ['Una.', 'Dos.'],
  });
  assert.equal(sections[1].blocks[2].lines[0], 'Fin.');
});
test('empty documents do not create fake sections', () =>
  assert.deepEqual(parseTermsDocument(''), []));
