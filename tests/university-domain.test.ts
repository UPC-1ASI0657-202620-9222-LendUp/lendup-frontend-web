import assert from 'node:assert/strict';
import test from 'node:test';
import { universityForEmail } from '../lib/university-domain.ts';
const universities = [{ id: 'PUCP', emailDomains: ['pucp.edu.pe', 'pucp.pe'] }];
test('university detection normalizes email and accepts exact domain aliases', () => {
  assert.equal(
    universityForEmail(' Student@PUCP.PE ', universities)?.id,
    'PUCP',
  );
  assert.equal(
    universityForEmail('student@pucp.edu.pe', universities)?.id,
    'PUCP',
  );
});
test('unknown, malformed and lookalike domains are not recognized', () => {
  for (const email of [
    'student@gmail.com',
    'student@sub.pucp.pe',
    'student@pucp.pe.evil.test',
    'student@evilpucp.pe',
    'student@@pucp.pe',
    '@pucp.pe',
    'student',
  ])
    assert.equal(universityForEmail(email, universities), undefined);
});
