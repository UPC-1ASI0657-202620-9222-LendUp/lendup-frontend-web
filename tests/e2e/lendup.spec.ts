import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import {
  emailOf,
  ensureUser,
  gateway,
  publish,
  type Person,
} from './support/api';
import { testPassword } from './support/env';

const CAPTURES = 'tests/e2e/reportes/capturas';
const run = Date.now().toString(36);
const lender: Person = {
  uid: 'e2e-prestamista',
  email: emailOf('e2e-prestamista'),
  name: 'Prestamista E2E',
  phone: '999111222',
};
const borrower: Person = {
  uid: 'e2e-prestatario',
  email: emailOf('e2e-prestatario'),
  name: 'Prestatario E2E',
  phone: '999333444',
};
// Título único por ejecución: evita confundirse con datos de corridas anteriores.
const title = `Calculadora E2E ${run}`;
let listingId = '';
let requestId = '';

async function shot(page: Page, name: string) {
  mkdirSync(CAPTURES, { recursive: true });
  await page.screenshot({ path: `${CAPTURES}/${name}.png`, fullPage: true });
}

async function login(page: Page, person: Person) {
  await page.goto('/login');
  await page.getByLabel(/correo/i).fill(person.email);
  await page.getByLabel(/contraseña/i).fill(testPassword());
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  await ensureUser(lender);
  await ensureUser(borrower);
  listingId = await publish(lender, title);
});

test('1. Iniciar sesión con el emulador de Firebase', async ({ page }) => {
  await page.goto('/login');
  await shot(page, '01-login-formulario');
  await login(page, borrower);
  await expect(page).toHaveURL(/\/app|\/explore|\/$/);
  await expect(page.getByText(/error|no se pudo/i)).toHaveCount(0);
  await shot(page, '02-sesion-iniciada');
});

test('2. Explorar publicaciones y usar un filtro', async ({ page }) => {
  await login(page, borrower);
  await page.goto('/explore');
  const card = page.getByText(title).first();
  await expect(card).toBeVisible();
  await shot(page, '03-explorar-todas');

  await page
    .getByRole('searchbox', { name: /por nombre o descripción/i })
    .fill(title);
  await expect(page.getByText(title).first()).toBeVisible();
  await expect(page.locator('output.result-count')).toContainText('1');
  await shot(page, '04-explorar-filtro-nombre');

  await page
    .getByRole('searchbox', { name: /por nombre o descripción/i })
    .fill(`no-existe-${run}`);
  await expect(page.getByText(title)).toHaveCount(0);
  await shot(page, '05-explorar-sin-resultados');
});

test('3. Crear una solicitud como prestatario', async ({ page }) => {
  await login(page, borrower);
  await page.goto(`/objects/${listingId}`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page
    .getByRole('button', { name: /solicitar préstamo/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByText(/periodo disponible|disponible/i).first(),
  ).toBeVisible();
  await shot(page, '06-solicitud-dialogo');
  await dialog.getByRole('checkbox').check();
  const created = page.waitForResponse(
    (response) =>
      response.url().endsWith('/solicitudes') &&
      response.request().method() === 'POST',
  );
  await dialog.getByRole('button', { name: /enviar solicitud/i }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  // El frontend debe enviar el snapshot leído de Catálogo.
  const body = response.request().postDataJSON();
  expect(body.aceptacion_condiciones).toMatchObject({ aceptada: true });
  expect(body.aceptacion_condiciones.snapshot_id).toMatch(/^snp_/);
  expect(body.aceptacion_condiciones.snapshot_hash).toMatch(/^[0-9a-f]{64}$/);
  requestId = (await response.json()).id;
  await expect(page).toHaveURL(/\/requests/);
  await expect(page.getByText(title).first()).toBeVisible();
  await shot(page, '07-solicitud-enviada');
});

test('4. Aceptar la solicitud como prestamista', async ({ page }) => {
  expect(requestId).not.toBe('');
  await login(page, lender);
  await page.goto('/requests?tab=received');
  await expect(page.getByText(title).first()).toBeVisible();
  await shot(page, '08-solicitud-recibida');
  await page
    .getByRole('button', { name: /^aceptar$/i })
    .first()
    .click();
  const accepted = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/solicitudes/${requestId}/aceptacion`) &&
      response.request().method() === 'POST',
  );
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /aceptar y reservar/i })
    .click();
  expect((await accepted).status()).toBe(201);
  await shot(page, '09-solicitud-aceptada');
});

test('5. Ver el préstamo y el calendario', async ({ page }) => {
  // Préstamos crea el préstamo al recibir reservas.confirmada.v1 (asíncrono).
  await expect
    .poll(
      async () => {
        const loans = await gateway<{ id: string; estado: string }[]>(
          'GET',
          '/prestamos',
          borrower,
        );
        return loans.body.length;
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);
  await login(page, borrower);
  await page.goto('/loans');
  // Recién aceptado, el préstamo está RESERVADO: aparece en "Por iniciar".
  await page.getByRole('tab', { name: /por iniciar/i }).click();
  await expect(page.getByText(title).first()).toBeVisible();
  await shot(page, '10-prestamos');
  await page
    .getByText(/abrir préstamo/i)
    .first()
    .click();
  await expect(page).toHaveURL(/\/loans\/.+/);
  await shot(page, '11-prestamo-detalle');
  await page.goto('/calendar');
  await expect(
    page.getByRole('heading', { name: /calendario/i }).first(),
  ).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();
  await shot(page, '12-calendario');
});
