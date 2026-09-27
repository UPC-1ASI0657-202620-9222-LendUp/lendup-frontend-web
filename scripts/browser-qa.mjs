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
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('requestfailed', (request) =>
  failedRequests.push(
    `${request.method()} ${request.url()} · ${request.failure()?.errorText}`,
  ),
);

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  if (!ok) process.exitCode = 1;
};
const routeCheck = async (path, expected = path) => {
  const response = await page.goto(`${baseURL}${path}`, {
    waitUntil: 'networkidle',
  });
  const current = new URL(page.url()).pathname;
  const heading = await page
    .locator('h1')
    .first()
    .textContent()
    .catch(() => '');
  record(
    `route ${path}`,
    response?.ok() === true && current === expected && Boolean(heading?.trim()),
    `${response?.status()} · ${current} · ${heading?.trim()}`,
  );
  const brokenImages = await page
    .locator('img')
    .evaluateAll((images) =>
      images
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.getAttribute('src')),
    );
  record(`images ${path}`, brokenImages.length === 0, brokenImages.join(', '));
  const deadLinks = await page
    .locator('a')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute('href'))
        .filter(
          (href) => !href || href === '#' || href.startsWith('javascript:'),
        ),
    );
  record(`links ${path}`, deadLinks.length === 0, deadLinks.join(', '));
};

await page.goto(baseURL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.goto(baseURL, { waitUntil: 'networkidle' });
record(
  'root redirige a login sin sesión',
  new URL(page.url()).pathname === '/login',
  page.url(),
);
await page.goto(`${baseURL}/app`, { waitUntil: 'networkidle' });
record(
  'guard privado sin sesión',
  new URL(page.url()).pathname === '/login',
  page.url(),
);
await page
  .getByLabel('Correo institucional')
  .fill('alexandra.ruiz@pucp.edu.pe');
await page.getByLabel('Contraseña').fill('lendup123');
await page.getByRole('button', { name: 'Iniciar sesión' }).click();
await page.waitForURL('**/app');
record('login válido', new URL(page.url()).pathname === '/app');

await page.goto(`${baseURL}/my-items/l1/edit`, { waitUntil: 'networkidle' });
record(
  'guard de ownership por URL directa',
  new URL(page.url()).pathname === '/404',
  page.url(),
);
await page.goto(`${baseURL}/loans/new?delivery=rs1`, {
  waitUntil: 'networkidle',
});
record(
  'guard de delivery exclusivo del lender',
  new URL(page.url()).pathname === '/404',
  page.url(),
);

const studentRoutes = [
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
  '/incidents',
  '/incidents/INC-1042',
  '/calendar',
  '/notifications',
  '/transactions',
  '/profile',
  '/users/carlos',
];
for (const path of studentRoutes) await routeCheck(path);

await page.goto(`${baseURL}/admin/incidents`, { waitUntil: 'networkidle' });
record(
  'guard admin para estudiante',
  new URL(page.url()).pathname === '/app',
  page.url(),
);
const demoSelect = page.getByLabel('Ver como');
record(
  'selector demo en desarrollo',
  await demoSelect.isVisible().catch(() => false),
);
await demoSelect.selectOption('admin');
await page.waitForURL('**/admin/incidents');
await routeCheck('/admin/incidents');
await routeCheck('/admin/incidents/INC-1042');
await page.goto(`${baseURL}/loans/ln1`, { waitUntil: 'networkidle' });
record(
  'guard de loan para usuario unrelated',
  new URL(page.url()).pathname === '/app',
  page.url(),
);
await page.goto(`${baseURL}/reservations/rs1`, { waitUntil: 'networkidle' });
record(
  'guard de reservation para usuario unrelated',
  new URL(page.url()).pathname === '/app',
  page.url(),
);
await page.goto(`${baseURL}/incidents/INC-1042`, { waitUntil: 'networkidle' });
record(
  'admin usa exclusivamente la ruta administrativa de incident',
  new URL(page.url()).pathname === '/app',
  page.url(),
);
await page.goto(`${baseURL}/admin/incidents`, { waitUntil: 'networkidle' });

const responsiveRoutes = [
  { path: '/admin/incidents', user: 'admin' },
  { path: '/calendar', user: 'alexandra' },
  { path: '/transactions', user: 'alexandra' },
  { path: '/my-items/new', user: 'alexandra' },
  { path: '/reservations/rs1', user: 'alexandra' },
  { path: '/reservations/rs1/checkout', user: 'alexandra' },
  { path: '/loans/ln1', user: 'alexandra' },
  { path: '/incidents/INC-1042', user: 'alexandra' },
];
for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  for (const route of responsiveRoutes) {
    await page.getByLabel('Ver como').selectOption(route.user, { force: true });
    await page.goto(`${baseURL}${route.path}`, { waitUntil: 'networkidle' });
    const layout = await page.evaluate(() => {
      const overflow =
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth;
      const wideElements = Array.from(
        document.querySelectorAll('body *'),
      ).filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.right > document.documentElement.clientWidth + 2 ||
          rect.left < -2
        );
      });
      const unmanaged = wideElements.filter(
        (element) => !element.closest('.responsive-table'),
      );
      const scrollRegionsAreSafe = Array.from(
        document.querySelectorAll('.responsive-table'),
      ).every((element) => {
        const style = getComputedStyle(element);
        return (
          ['auto', 'scroll'].includes(style.overflowX) &&
          element.clientWidth <= document.documentElement.clientWidth
        );
      });
      return {
        overflow,
        safe: unmanaged.length === 0 && scrollRegionsAreSafe,
        culprits: wideElements
          .slice(0, 8)
          .map(
            (element) =>
              `${element.tagName.toLowerCase()}.${element.className || ''} (${Math.round(element.getBoundingClientRect().left)}..${Math.round(element.getBoundingClientRect().right)} / ${Math.round(element.getBoundingClientRect().width)}px)`,
          ),
      };
    });
    record(
      `${viewport.name} ${route.path}`,
      layout.safe,
      `overflow ${layout.overflow}px${layout.culprits.length ? ` · ${layout.culprits.join(', ')}` : ''}`,
    );
  }
}

await page.setViewportSize({ width: 390, height: 844 });
await page.getByLabel('Ver como').selectOption('alexandra', { force: true });
await page.goto(`${baseURL}/app`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Menú' }).click();
record(
  'drawer móvil contiene navegación secundaria',
  await page.getByRole('link', { name: 'Transacciones' }).isVisible(),
);

record(
  'sin errores de consola',
  consoleErrors.length === 0,
  consoleErrors.join(' | '),
);
record(
  'sin errores de página',
  pageErrors.length === 0,
  pageErrors.join(' | '),
);
record(
  'sin solicitudes fallidas',
  failedRequests.length === 0,
  failedRequests.join(' | '),
);

await browser.close();
console.log(
  JSON.stringify(
    {
      passed: results.filter((item) => item.ok).length,
      failed: results.filter((item) => !item.ok),
      results,
    },
    null,
    2,
  ),
);
