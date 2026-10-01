import { chromium } from 'playwright-core';

const baseURL = process.env.LOCAL_URL ?? 'http://localhost:3000';
const executablePath = process.env.BROWSER_PATH ?? '/opt/pw-browsers/chromium';
const password = process.env.DEMO_PASSWORD ?? 'lendup123';
const limaOffsetHours = -5;

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'es-PE',
});
const page = await context.newPage();
const failures = [];
const consoleErrors = [];
let passed = 0;
page.setDefaultTimeout(8000);

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const photo = {
  name: 'evidencia.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  ),
};

const localInput = (daysFromNow, hour) => {
  const date = new Date(Date.now() + daysFromNow * 86_400_000);
  const lima = new Date(date.getTime() + limaOffsetHours * 3_600_000);
  lima.setUTCHours(hour, 0, 0, 0);
  return lima.toISOString().slice(0, 16);
};

const run = async (name, task) => {
  try {
    await task();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.split('\n').slice(0, 3).join(' ')
        : String(error);
    failures.push(`${name} @ ${new URL(page.url()).pathname}: ${message}`);
    console.log(`FAIL ${name}`);
    if (process.env.QA_SHOTS)
      await page.screenshot({
        path: `${process.env.QA_SHOTS}/${passed + failures.length}.png`,
        fullPage: true,
      });
  }
};
const go = (path) =>
  page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
const expectText = (text, scope = page) =>
  scope
    .getByText(text, { exact: false })
    .first()
    .waitFor({ state: 'visible', timeout: 6000 });
const dialog = () => page.getByRole('dialog');
const switchUser = async (id) => {
  await page.getByLabel('Ver como').first().selectOption(id);
  await page.waitForURL('**/app');
};
const uploadEvidence = async (scope = page) => {
  await scope.locator('input[type=file]').first().setInputFiles(photo);
  await scope.locator('.evidence-previews li').first().waitFor();
};

await go('/login');
await page.evaluate(() => localStorage.clear());

await run('Registro, verificación y términos (US01, US03, US47)', async () => {
  await go('/register');
  await page.getByLabel('Nombres y apellidos').fill('Valeria Torres Quispe');
  await page.getByLabel('Universidad').selectOption('UPC');
  await page.getByLabel('Sede o campus').selectOption('Monterrico');
  await page.getByLabel('Carrera').fill('Ingeniería de Software');
  await page.getByLabel('Ciclo').fill('5');
  await page
    .getByLabel('Correo institucional')
    .fill('valeria.torres@gmail.com');
  await page.getByLabel('Teléfono').fill('987 111 222');
  await page
    .getByLabel('Contraseña', { exact: false })
    .first()
    .fill('Lendup2026');
  await page.getByLabel('Confirmar contraseña').fill('Lendup2026');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expectText('correo institucional de la universidad');
  await page
    .getByLabel('Correo institucional')
    .fill('valeria.torres@upc.edu.pe');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await page.waitForURL('**/verify-email');
  await expectText('¡Tu cuenta fue creada!');
  await page
    .getByRole('button', { name: 'Enviar enlace de verificación' })
    .click();
  await page.getByRole('button', { name: 'Simular enlace inválido' }).click();
  await page.getByRole('button', { name: 'Reenviar enlace' }).click();
  await page.getByRole('button', { name: 'Simular enlace válido' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL(/\/terms/);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aceptar y continuar' }).click();
  await page.waitForURL('**/app');
});

await run('Cambio de idioma persistente (i18n ES/EN)', async () => {
  await page
    .getByRole('button', { name: /English|Inglés/ })
    .first()
    .click();
  await expectText('Hi, Valeria');
  await page.reload({ waitUntil: 'networkidle' });
  await expectText('Hi, Valeria');
  await page
    .getByRole('button', { name: /Spanish|Español/ })
    .first()
    .click();
  await expectText('Hola, Valeria');
});

await run(
  'Publicar objeto, tarifa y disponibilidad (US05, US06, US15, US31)',
  async () => {
    await go('/my-items/new');
    await page.getByLabel('Título').fill('Proyector portátil Epson');
    await page.getByLabel('Categoría').selectOption('ELECTRONICS');
    await page.getByLabel('Condición').selectOption('VERY_GOOD');
    await page
      .getByLabel('Descripción')
      .fill('Proyector HD con cable HDMI y control remoto incluido.');
    await page
      .getByLabel('Lugar de intercambio')
      .fill('Cafetería del pabellón A');
    await page
      .getByLabel('Condiciones de uso')
      .fill('Solo para exposiciones académicas.');
    await page
      .getByLabel('Condiciones de entrega')
      .fill('Se prueba el equipo al entregarlo.');
    await page
      .getByLabel('Condiciones de devolución')
      .fill('Devolver con todos sus cables.');
    await page
      .getByLabel('Condiciones de cancelación')
      .fill('Sin penalidad antes de la entrega.');
    await page.getByLabel('Tarifa diaria (S/)').fill('0');
    await page
      .getByRole('button', { name: 'Publicar y definir disponibilidad' })
      .click();
    await expectText('mayor que cero');
    await page.getByLabel('Tarifa diaria (S/)').fill('15');
    await page.locator('#listing-media').setInputFiles(photo);
    await page.locator('.media-previews li').first().waitFor();
    await page
      .getByRole('button', { name: 'Publicar y definir disponibilidad' })
      .click();
    await page.waitForURL(/availability\?new=1/);
    await page.getByRole('button', { name: 'Agregar periodo' }).click();
    await page.getByRole('button', { name: 'Guardar disponibilidad' }).click();
    await expectText('Disponibilidad guardada');
  },
);

let reservationId = '';
let loanId = '';
const start = localInput(20, 10);
const end = localInput(23, 10);

await run(
  'Solicitar préstamo con costo total (US10, US11, US16, US32)',
  async () => {
    await go('/login');
    await page.evaluate(() => localStorage.clear());
    await go('/login');
    await page
      .getByLabel('Correo institucional')
      .fill('alexandra.ruiz@pucp.edu.pe');
    await page.getByLabel('Contraseña').fill(password);
    await page.locator('form button[type=submit]').click();
    await page.waitForURL('**/app');
    await go('/objects/l1');
    await page.getByRole('button', { name: 'Solicitar préstamo' }).click();
    await dialog().getByLabel('Desde').fill(start);
    await dialog().getByLabel('Hasta').fill(end);
    await expectText('Comisión de LendUp', dialog());
    await dialog().getByRole('checkbox').check();
    await dialog().getByRole('button', { name: 'Enviar solicitud' }).click();
    await page.waitForURL('**/requests');
    await expectText('Pendiente');
  },
);

await run('Prestamista acepta la solicitud (US12, US13)', async () => {
  await switchUser('carlos');
  await go('/requests?tab=received');
  const card = page
    .locator('.operation-card', { hasText: 'Cámara Sony' })
    .filter({ hasText: 'Pendiente' });
  await card.getByRole('button', { name: 'Aceptar' }).click();
  await dialog().getByRole('button', { name: 'Aceptar y reservar' }).click();
  await expectText('Solicitud aceptada');
  const link = page
    .locator('.operation-card', { hasText: 'Cámara Sony' })
    .locator('a[href^="/reservations/"]')
    .first();
  reservationId = (await link.getAttribute('href')).split('/').pop();
});

await run('Garantía y pago con Mercado Pago (US17, US33, US34)', async () => {
  await switchUser('alexandra');
  await go(`/reservations/${reservationId}/checkout`);
  const guarantee = page.locator('.payment-step').first();
  const rental = page.locator('.payment-step').nth(1);
  await expectText('Disponible cuando la garantía esté constituida', rental);
  await guarantee
    .getByLabel('Respuesta simulada del proveedor')
    .selectOption('REJECTED');
  await guarantee.getByRole('button', { name: /Pagar/ }).click();
  await expectText('rechaz', guarantee);
  await guarantee
    .getByLabel('Respuesta simulada del proveedor')
    .selectOption('APPROVED');
  await guarantee.getByRole('button', { name: /Pagar/ }).click();
  await expectText('Garantía constituida correctamente');
  await rental.getByRole('button', { name: /Pagar/ }).click();
  await expectText('Listo: el pago y la garantía están confirmados');
});

await run('Entrega con evidencias iniciales (US18, US26)', async () => {
  await switchUser('carlos');
  await go(`/delivery?reservation=${reservationId}`);
  await uploadEvidence();
  await page.getByRole('button', { name: 'Confirmar entrega' }).click();
  await dialog().getByRole('button', { name: 'Confirmar entrega' }).click();
  await page.waitForURL(/\/loans\/.+/);
  loanId = page.url().split('/').pop();
  await expectText('Entregado · por confirmar');
});

await run('Recepción activa el préstamo (US19, US20, US35)', async () => {
  await switchUser('alexandra');
  await go(`/loans/${loanId}`);
  await page.getByRole('button', { name: 'Confirmar recepción' }).click();
  await dialog().getByRole('button', { name: 'Confirmar recepción' }).click();
  await expectText('Un préstamo activo ya no puede cancelarse');
});

await run('Extensión aceptada y pagada (US21, US22, US42)', async () => {
  await page.getByRole('button', { name: 'Solicitar extensión' }).click();
  await dialog()
    .getByLabel('Nueva fecha y hora de devolución')
    .fill(localInput(25, 10));
  await dialog().getByRole('button', { name: 'Enviar solicitud' }).click();
  await switchUser('carlos');
  await go(`/loans/${loanId}`);
  await page.getByRole('button', { name: 'Revisar extensión' }).click();
  await dialog().getByRole('button', { name: 'Aceptar' }).click();
  await switchUser('alexandra');
  await go(`/loans/${loanId}`);
  await page.getByRole('button', { name: /Pagar extensión/ }).click();
  await dialog().getByRole('button', { name: /Pagar/ }).click();
  await dialog().waitFor({ state: 'detached' });
  await page
    .locator('.history-list .status-badge', { hasText: /^Aceptada$/ })
    .waitFor();
});

await run('Reprogramación del prestamista (US43)', async () => {
  await switchUser('carlos');
  await go(`/loans/${loanId}`);
  await page.getByRole('button', { name: 'Proponer nueva fecha' }).click();
  await dialog()
    .getByLabel('Nueva fecha y hora de devolución')
    .fill(localInput(24, 18));
  await dialog().getByRole('button', { name: 'Enviar propuesta' }).click();
  await switchUser('alexandra');
  await go(`/loans/${loanId}`);
  await page.getByRole('button', { name: 'Revisar nueva fecha' }).click();
  await dialog().getByRole('button', { name: 'Aceptar' }).click();
  await expectText('Reprogramación');
});

await run('Devolución y confirmación (US23, US24, US36)', async () => {
  await page.getByRole('button', { name: 'Registrar devolución' }).click();
  await uploadEvidence(dialog());
  await dialog()
    .getByLabel('Estado, funcionamiento y observaciones')
    .fill('Cámara devuelta completa y funcionando.');
  await dialog().getByRole('button', { name: 'Registrar devolución' }).click();
  await expectText('Devuelto · por confirmar');
  await switchUser('carlos');
  await go(`/loans/${loanId}`);
  await page.getByRole('button', { name: 'Confirmar devolución' }).click();
  await dialog().getByRole('button', { name: 'Confirmar devolución' }).click();
  await expectText('Finalizado');
});

await run('Calificación única al finalizar (US29, US30)', async () => {
  await page.getByRole('button', { name: 'Calificar experiencia' }).click();
  await dialog()
    .getByRole('button', { name: /5 estrella/ })
    .click();
  await dialog()
    .getByLabel('Comentario (opcional)')
    .fill('Cuidó muy bien la cámara.');
  await dialog().getByRole('button', { name: 'Enviar calificación' }).click();
  await expectText('Calificaste con 5 estrella(s)');
  const again = await page
    .getByRole('button', { name: 'Calificar experiencia' })
    .count();
  if (again) throw new Error('rating still available');
});

await run('Cancelar reserva antes de la entrega (US14, US41)', async () => {
  await switchUser('alexandra');
  await go('/reservations/rs1');
  await page.getByRole('button', { name: 'Cancelar reserva' }).click();
  await dialog()
    .getByLabel('Motivo de la cancelación')
    .fill('Cambio de fecha del proyecto');
  await dialog().getByRole('button', { name: 'Confirmar cancelación' }).click();
  await expectText('Cancelada por');
});

await run('Prestamista cancela una reserva (US45)', async () => {
  await switchUser('carlos');
  await go('/requests?tab=received');
  const card = page
    .locator('.operation-card', { hasText: 'Calculadora' })
    .filter({ hasText: 'Pendiente' });
  await card.getByRole('button', { name: 'Aceptar' }).click();
  await dialog().getByRole('button', { name: 'Aceptar y reservar' }).click();
  await page
    .locator('.operation-card', { hasText: 'Calculadora' })
    .locator('a[href^="/reservations/"]')
    .first()
    .click();
  await page.getByRole('button', { name: 'Cancelar reserva' }).click();
  await dialog()
    .getByLabel('Motivo de la cancelación')
    .fill('El objeto necesita mantenimiento');
  await dialog().getByRole('button', { name: 'Confirmar cancelación' }).click();
  await expectText('Cancelada por Carlos');
  await switchUser('alexandra');
});

await run('Reportar incidencia (US28)', async () => {
  await go('/incidents?loan=ln1');
  await page.getByLabel('Tipo de incidencia').selectOption('DAMAGE');
  await page
    .getByLabel('Describe lo ocurrido')
    .fill('Una de las puntas del kit llegó doblada al recibirlo.');
  await page.getByRole('button', { name: 'Registrar incidencia' }).click();
  await page.waitForURL(/\/incidents\/INC-/);
  await expectText('La garantía permanece retenida');
});

await run('Administrador revisa y resuelve (US37, US38, US39)', async () => {
  await switchUser('admin');
  await go('/admin/incidents');
  await page.getByRole('button', { name: /^Pendiente/ }).click();
  await page
    .locator('tbody tr')
    .first()
    .locator('a[href^="/admin/incidents/"]')
    .click();
  await page.getByRole('button', { name: 'Iniciar revisión' }).click();
  await page
    .getByLabel('Nueva nota')
    .fill('Se solicitó evidencia adicional a ambas partes.');
  await page.getByRole('button', { name: 'Agregar nota' }).click();
  await page.getByText('Afectación parcial').click();
  await page.getByLabel(/Monto a aplicar/).fill('20');
  await page
    .getByLabel('Justificación de la decisión')
    .fill('La evidencia muestra un daño menor atribuible al uso.');
  await page.getByRole('button', { name: 'Resolver incidencia' }).click();
  await dialog().getByRole('button', { name: 'Resolver incidencia' }).click();
  await page.waitForURL('**/admin/incidents');
});

await run('Historial de transacciones y CSV (US40)', async () => {
  await switchUser('alexandra');
  await go('/transactions');
  const table = page.locator('tbody');
  await expectText('Pago de extensión', table);
  await expectText('Afectación parcial', table);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar CSV' }).click();
  const file = await download;
  if (!file.suggestedFilename().endsWith('.csv'))
    throw new Error('csv not downloaded');
});

await browser.close();
const relevantErrors = consoleErrors.filter(
  (text) => !text.includes('Failed to load resource'),
);
console.log(`\n${passed} passed, ${failures.length} failed`);
failures.forEach((item) => console.log(`  - ${item}`));
if (relevantErrors.length)
  console.log('Console errors:\n' + relevantErrors.join('\n'));
if (failures.length || relevantErrors.length) process.exitCode = 1;
