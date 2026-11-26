import assert from 'node:assert/strict';
import test from 'node:test';
import { passwordResetOutcome } from '../lib/password-reset.ts';

test('a sent reset link reports success', () => {
  assert.deepEqual(passwordResetOutcome(), {
    ok: true,
    message: 'results.auth.resetSent',
  });
});

test('an unknown email answers like a sent link, so accounts cannot be discovered', () => {
  assert.deepEqual(passwordResetOutcome('auth/user-not-found'), {
    ok: true,
    message: 'results.auth.resetSent',
  });
});

test('known Firebase errors get their own message', () => {
  assert.deepEqual(passwordResetOutcome('auth/invalid-email'), {
    ok: false,
    message: 'auth.reset.errors.invalidEmail',
  });
  assert.deepEqual(passwordResetOutcome('auth/too-many-requests'), {
    ok: false,
    message: 'auth.reset.errors.tooManyRequests',
  });
  assert.deepEqual(passwordResetOutcome('auth/network-request-failed'), {
    ok: false,
    message: 'auth.reset.errors.network',
  });
});

test('any other error falls back to the generic failure', () => {
  assert.deepEqual(passwordResetOutcome('auth/internal-error'), {
    ok: false,
    message: 'common.requestFailed',
  });
});
