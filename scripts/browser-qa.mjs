import { chromium } from 'playwright-core';

const baseURL = process.env.LOCAL_URL ?? 'http://localhost:3000';
const executablePath = process.env.BROWSER_PATH ?? '/opt/pw-browsers/chromium';
const password = process.env.DEMO_PASSWORD ?? 'lendup123';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const accounts = [
  {
    email: 'alexandra.ruiz@pucp.edu.pe',
    routes: [
      '/app',
      '/explore',
      '/objects/l1',
      '/my-items',
      '/my-items/new',
      '/my-items/l3/edit',
      '/my-items/l3/availability',
      '/requests',
      '/reservations',
      '/reservations/rs1',
      '/reservations/rs1/checkout',
      '/loans',
      '/loans/ln1',
      '/loans/ln4',
      '/calendar',
      '/transactions',
      '/incidents',
      '/incidents/INC-1042',
      '/notifications',
      '/profile',
      '/users/carlos',
      '/terms',
    ],
    forbidden: ['/admin/incidents', '/my-items/l1/edit'],
  },
  {
    email: 'admin@lendup.pe',
    routes: [
      '/app',
      '/admin/incidents',
      '/admin/incidents/INC-1042',
      '/notifications',
      '/profile',
    ],
    forbidden: ['/explore', '/loans'],
  },
];

const publicRoutes = ['/login', '/register', '/terms'];

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  if (!ok) process.exitCode = 1;
};

async function audit(page, label, path, errors) {
  await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  const info = await page.evaluate(() => ({
    path: location.pathname,
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    lang: document.documentElement.lang,
    unlabeled: [...document.querySelectorAll('input, select, textarea')]
      .filter((element) => element.type !== 'hidden')
      .filter(
        (element) =>
          !element.closest('label') &&
          !element.getAttribute('aria-label') &&
          !(element.id && document.querySelector(`label[for="${element.id}"]`)),
      ).length,
  }));
  const ok =
    info.path === path.split('?')[0] &&
    info.h1.length > 0 &&
    info.overflow <= 1 &&
    info.unlabeled === 0 &&
    errors.length === 0;
  record(
    `${label} ${path}`,
    ok,
    ok ? '' : JSON.stringify({ ...info, errors: errors.splice(0) }),
  );
  errors.length = 0;
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, locale: 'es-PE' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().includes('Failed to load resource')
    )
      errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  for (const path of publicRoutes)
    await audit(page, `${viewport.name} public`, path, errors);

  for (const account of accounts) {
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('lendup-demo-state-v4'));
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    await page.getByLabel('Correo institucional').fill(account.email);
    await page.getByLabel('Contraseña').fill(password);
    await page.locator('form button[type=submit]').click();
    await page.waitForURL('**/app');
    for (const path of account.routes)
      await audit(page, `${viewport.name} ${account.email}`, path, errors);
    for (const path of account.forbidden) {
      await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
      record(
        `${viewport.name} ${account.email} blocks ${path}`,
        new URL(page.url()).pathname !== path,
        page.url(),
      );
    }
  }
  await context.close();
}

await browser.close();
const failed = results.filter((item) => !item.ok);
for (const item of failed) console.log(`FAIL ${item.name} ${item.detail}`);
console.log(
  `${results.length - failed.length}/${results.length} checks passed`,
);
