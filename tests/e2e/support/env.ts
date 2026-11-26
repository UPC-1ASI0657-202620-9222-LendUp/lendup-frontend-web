import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const GATEWAY_URL =
  process.env.E2E_GATEWAY_URL ?? 'http://localhost:8090/api/v1';
export const EMULATOR_URL =
  process.env.E2E_EMULATOR_URL ?? 'http://localhost:9099';
export const FIREBASE_PROJECT =
  process.env.E2E_FIREBASE_PROJECT ?? 'lendup-desarrollo';

/**
 * Contraseña de las cuentas de prueba. Sale de E2E_USER_PASSWORD o del .env que
 * `node scripts/setup.mjs` genera en lendup-e2e (nunca se guarda en este repo).
 */
export function testPassword(): string {
  if (process.env.E2E_USER_PASSWORD) return process.env.E2E_USER_PASSWORD;
  const file = resolve(process.env.E2E_ENV_FILE ?? '../lendup-e2e/.env');
  if (existsSync(file)) {
    const line = readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.startsWith('E2E_USER_PASSWORD='));
    if (line) return line.slice('E2E_USER_PASSWORD='.length);
  }
  throw new Error(
    'Define E2E_USER_PASSWORD o E2E_ENV_FILE (el .env de lendup-e2e).',
  );
}
