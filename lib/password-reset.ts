/**
 * Translates the result of Firebase's password reset request into the message shown on the
 * "forgot password" page. An unknown email answers like a sent link, so the form cannot be used
 * to find out which accounts exist.
 */
export type PasswordResetOutcome = {
  ok: boolean;
  message:
    | 'results.auth.resetSent'
    | 'auth.reset.errors.invalidEmail'
    | 'auth.reset.errors.tooManyRequests'
    | 'auth.reset.errors.network'
    | 'common.requestFailed';
};

const errors: Record<string, PasswordResetOutcome['message']> = {
  'auth/invalid-email': 'auth.reset.errors.invalidEmail',
  'auth/too-many-requests': 'auth.reset.errors.tooManyRequests',
  'auth/network-request-failed': 'auth.reset.errors.network',
};

export function passwordResetOutcome(errorCode?: string): PasswordResetOutcome {
  if (!errorCode || errorCode === 'auth/user-not-found') {
    return { ok: true, message: 'results.auth.resetSent' };
  }
  return { ok: false, message: errors[errorCode] ?? 'common.requestFailed' };
}
