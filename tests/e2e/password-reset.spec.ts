import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { EMULATOR_URL, FIREBASE_PROJECT } from './support/env';

const CAPTURES = 'tests/e2e/reportes/capturas';
// Cuenta propia de esta prueba: cambiarle la contraseña no afecta a los demás flujos.
const email = `e2e-olvido-${Date.now().toString(36)}@upc.edu.pe`;
const password = () => `Lendup-${randomBytes(9).toString('hex')}`;

async function identityToolkit(path: string, body: unknown) {
  const response = await fetch(
    `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1${path}?key=emulador`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return { status: response.status, body: await response.json() };
}

/** Enlaces que el emulador "envió" por correo (no salen a internet). */
async function resetCodesFor(address: string): Promise<string[]> {
  const response = await fetch(
    `${EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT}/oobCodes`,
  );
  const { oobCodes = [] } = (await response.json()) as {
    oobCodes?: { email: string; requestType: string; oobCode: string }[];
  };
  return oobCodes
    .filter(
      (code) => code.email === address && code.requestType === 'PASSWORD_RESET',
    )
    .map((code) => code.oobCode);
}

test('6. Recuperar la contraseña con "¿Olvidaste tu contraseña?"', async ({
  page,
}) => {
  const created = await identityToolkit('/accounts:signUp', {
    email,
    password: password(),
  });
  expect(created.status).toBe(200);

  await page.goto('/login');
  await page.getByRole('link', { name: /olvidaste tu contraseña/i }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(
    page.getByRole('heading', { name: /recupera tu contraseña/i }),
  ).toBeVisible();
  // Se llena cuando la página ya terminó de cargar; si no, el valor se pierde al hidratar.
  await expect(async () => {
    await page.getByLabel(/correo/i).fill(email);
    await expect(page.getByLabel(/correo/i)).toHaveValue(email);
  }).toPass();
  await page.getByRole('button', { name: /enviar enlace/i }).click();
  await expect(page.getByRole('status')).toContainText(
    /te enviamos un enlace/i,
  );
  mkdirSync(CAPTURES, { recursive: true });
  await page.screenshot({
    path: `${CAPTURES}/13-recuperar-contrasena.png`,
    fullPage: true,
  });

  // Firebase emitió el enlace y con él se puede fijar una contraseña nueva.
  const [code] = await resetCodesFor(email);
  expect(code).toBeTruthy();
  const newPassword = password();
  const reset = await identityToolkit('/accounts:resetPassword', {
    oobCode: code,
    newPassword,
  });
  expect(reset.status).toBe(200);
  const signIn = await identityToolkit('/accounts:signInWithPassword', {
    email,
    password: newPassword,
    returnSecureToken: true,
  });
  expect(signIn.status).toBe(200);
});

test('7. Un correo no registrado recibe la misma respuesta', async ({
  page,
}) => {
  const unknown = `e2e-no-existe-${Date.now().toString(36)}@upc.edu.pe`;
  await page.goto('/forgot-password');
  await expect(async () => {
    await page.getByLabel(/correo/i).fill(unknown);
    await expect(page.getByLabel(/correo/i)).toHaveValue(unknown);
  }).toPass();
  await page.getByRole('button', { name: /enviar enlace/i }).click();
  await expect(page.getByRole('status')).toContainText(
    /te enviamos un enlace/i,
  );
  expect(await resetCodesFor(unknown)).toHaveLength(0);
});
