import { chromium } from 'playwright-core';

const baseURL = process.env.LOCAL_URL ?? 'http://localhost:3000';
const executablePath =
  process.env.BROWSER_PATH ??
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const failures = [];
let passed = 0;
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const run = async (name, task) => {
  try {
    await task();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(
      `${name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.log(`FAIL ${name}`);
  }
};
const expectText = async (text) => {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: 'visible', timeout: 5000 });
};
const switchUser = async (id) => {
  await page.getByLabel('Ver como').selectOption(id);
  await page.waitForTimeout(120);
};
const demoFile = {
  name: 'evidencia-demo.png',
  mimeType: 'image/png',
  buffer: Buffer.from('lendup-demo'),
};

await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
await page
  .getByLabel('Correo institucional')
  .fill('alexandra.ruiz@pucp.edu.pe');
await page.getByLabel('Contraseña').fill('lendup123');
await page.getByRole('button', { name: 'Iniciar sesión' }).click();
await page.waitForURL('**/app');

let dynamicReservationId = '';
let dynamicLoanId = '';

await run('Flujo A · solicitar objeto', async () => {
  await page.goto(`${baseURL}/objects/l2`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Solicitar préstamo/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('He leído y acepto las condiciones.').check();
  await dialog.getByRole('button', { name: 'Enviar solicitud' }).click();
  await page.waitForURL('**/requests');
  await expectText('Calculadora Casio ClassWiz');
});

await run('Flujo A · prestamista acepta y crea reserva', async () => {
  await switchUser('carlos');
  await page.goto(`${baseURL}/requests`, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Recibidas' }).click();
  const card = page
    .locator('.operation-card')
    .filter({ hasText: 'Calculadora Casio ClassWiz' })
    .first();
  await card.getByRole('button', { name: 'Aceptar' }).click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  dynamicReservationId =
    state.reservations.find(
      (item) => item.listingId === 'l2' && item.requestId !== 'rq-old',
    )?.id ?? '';
  if (!dynamicReservationId) throw new Error('No se creó la reserva');
});

await run('Flujo A · pago y garantía', async () => {
  await switchUser('alexandra');
  await page.goto(`${baseURL}/reservations/${dynamicReservationId}/checkout`, {
    waitUntil: 'networkidle',
  });
  await page
    .locator('.payment-methods')
    .first()
    .getByText('Plin', { exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirmar pago y garantía' }).click();
  await page.waitForURL(`**/reservations/${dynamicReservationId}`);
  await expectText('Pendiente de liberación');
  await expectText('Retenida');
});

await run('Flujo B · entrega con evidencias', async () => {
  await switchUser('carlos');
  await page.goto(`${baseURL}/loans/new?delivery=${dynamicReservationId}`, {
    waitUntil: 'networkidle',
  });
  await page.locator('input[type=file]').setInputFiles(demoFile);
  await page.getByRole('button', { name: 'Confirmar entrega' }).click();
  await page.waitForURL('**/loans');
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  dynamicLoanId =
    state.loans.find((item) => item.reservationId === dynamicReservationId)
      ?.id ?? '';
  if (!dynamicLoanId) throw new Error('No se creó el préstamo');
});

await run('Flujo A · recepción y préstamo activo', async () => {
  await switchUser('alexandra');
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar', exact: true })
    .click();
  await expectText('Activo');
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  if (
    !state.transactions.some(
      (item) => item.loanId === dynamicLoanId && item.type === 'RENTAL_RELEASE',
    )
  )
    throw new Error('Falta RENTAL_RELEASE');
});

await run('Flujo F · reprogramación del prestamista', async () => {
  await switchUser('carlos');
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Proponer nueva fecha' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nueva fecha y hora').fill('2026-10-20T18:00');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await switchUser('alexandra');
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Aceptar reprogramación' }).click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  const item = state.loans.find((loan) => loan.id === dynamicLoanId);
  if (
    item.reschedules.at(-1)?.status !== 'ACCEPTED' ||
    item.reschedules.at(-1)?.additionalCost !== 0
  )
    throw new Error('La reprogramación no quedó aceptada sin costo');
});

await run('Flujo A · extensión con costo', async () => {
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Solicitar extensión' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nueva fecha y hora').fill('2026-10-23T18:00');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await switchUser('carlos');
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Aceptar extensión' }).click();
  const beforePayment = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  const pendingLoan = beforePayment.loans.find(
    (loan) => loan.id === dynamicLoanId,
  );
  if (
    pendingLoan.currentReturnAt.includes('10-23') ||
    pendingLoan.extensions.at(-1)?.status !== 'PAYMENT_PENDING'
  )
    throw new Error('La extensión cambió la fecha antes del pago');
  await switchUser('alexandra');
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: /Pagar extensión/ }).click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  if (
    !state.transactions.some(
      (item) =>
        item.loanId === dynamicLoanId && item.type === 'EXTENSION_PAYMENT',
    )
  )
    throw new Error('Falta EXTENSION_PAYMENT');
  if (
    !state.loans
      .find((loan) => loan.id === dynamicLoanId)
      .currentReturnAt.includes('10-23')
  )
    throw new Error('El pago de extensión no actualizó la fecha');
});

await run('Flujo C · cancelación antes de recepción', async () => {
  await switchUser('alexandra');
  await page.goto(`${baseURL}/reservations/rs1`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Cancelar reserva' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar cancelación' })
    .click();
  await expectText('Cancelada');
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  if (
    !state.transactions.some(
      (item) => item.reservationId === 'rs1' && item.type === 'REFUND',
    )
  )
    throw new Error('Falta el reembolso');
});

await run('Flujo D · devolución anticipada', async () => {
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Devolver antes de tiempo' }).click();
  const dialog = page.getByRole('dialog');
  await expectText('no genera automáticamente un reembolso proporcional');
  await dialog.locator('input[type=file]').setInputFiles(demoFile);
  await dialog
    .getByLabel('Estado, funcionamiento y observaciones')
    .fill('Objeto completo y funcionando correctamente.');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await switchUser('carlos');
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Confirmar devolución' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar', exact: true })
    .click();
  await expectText('Finalizado');
});

await run('Flujo A · calificación única', async () => {
  await switchUser('alexandra');
  await page.goto(`${baseURL}/loans/${dynamicLoanId}`, {
    waitUntil: 'networkidle',
  });
  await page.getByRole('button', { name: 'Calificar experiencia' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '5 estrellas' }).click();
  await dialog
    .getByLabel('Comentario')
    .fill('Excelente coordinación y objeto en buen estado.');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expectText('Ya calificaste esta operación');
});

await run('Flujo E · resolución parcial de incidencia', async () => {
  await switchUser('admin');
  await page.goto(`${baseURL}/admin/incidents/INC-1042`, {
    waitUntil: 'networkidle',
  });
  await page.getByLabel('Afectación parcial').check();
  await page.getByLabel(/Monto de afectación/).fill('20');
  await page
    .getByLabel('Justificación')
    .fill(
      'La evidencia respalda una afectación parcial y el saldo debe liberarse.',
    );
  await page.getByRole('button', { name: 'Resolver incidencia' }).click();
  await page.waitForURL('**/admin/incidents');
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lendup-demo-state-v2')),
  );
  const loan = state.loans.find((item) => item.id === 'ln3');
  if (loan.guaranteeStatus !== 'PARTIALLY_CAPTURED')
    throw new Error('La garantía no quedó parcialmente afectada');
  if (
    !state.transactions.some(
      (item) => item.loanId === 'ln3' && item.type === 'GUARANTEE_RELEASE',
    )
  )
    throw new Error('No se liberó el saldo de garantía');
});

await run('Flujo B · publicar y definir disponibilidad', async () => {
  await switchUser('carlos');
  await page.goto(`${baseURL}/my-items/new`, { waitUntil: 'networkidle' });
  await page.getByLabel('Título').fill('Multímetro digital de laboratorio');
  await page
    .getByLabel('Descripción')
    .fill(
      'Multímetro digital completo para prácticas universitarias y mediciones de laboratorio.',
    );
  await page.getByLabel('Distrito').fill('Santiago de Surco');
  await page
    .getByLabel('Lugar de intercambio')
    .fill('Hall principal UPC Monterrico');
  await page.locator('#listing-media').setInputFiles(demoFile);
  await page
    .getByRole('button', { name: 'Guardar y definir disponibilidad' })
    .click();
  await page.waitForURL('**/availability');
  await page.getByRole('button', { name: 'Agregar intervalo' }).click();
  await page.getByRole('button', { name: 'Guardar disponibilidad' }).click();
  await expectText('Disponibilidad guardada');
});

if (consoleErrors.length)
  failures.push(`Consola: ${consoleErrors.join(' | ')}`);
await browser.close();
console.log(JSON.stringify({ passed, failures }, null, 2));
if (failures.length) process.exitCode = 1;
