import assert from 'node:assert/strict';
import test from 'node:test';
import { isMissingProfile } from '../lib/profile-recovery.ts';

test('only the missing-profile response enables registration recovery', () => {
  assert.equal(
    isMissingProfile({ status: 403, message: 'Registra tu perfil en LendUp' }),
    true,
  );
  assert.equal(
    isMissingProfile({ status: 403, message: 'Operación no permitida' }),
    false,
  );
  assert.equal(
    isMissingProfile({ status: 401, message: 'Registra tu perfil en LendUp' }),
    false,
  );
  assert.equal(
    isMissingProfile({ status: 500, message: 'Error interno' }),
    false,
  );
  assert.equal(isMissingProfile(null), false);
});
