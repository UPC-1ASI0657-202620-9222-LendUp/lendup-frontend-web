import { chromium } from 'playwright-core';

const baseURL = process.env.LOCAL_URL ?? 'http://localhost:3000';
const executablePath = process.env.BROWSER_PATH ?? '/opt/pw-browsers/chromium';
const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;

if (!email || !password) {
  throw new Error(
    'QA_EMAIL and QA_PASSWORD are required. Use a non-production Firebase test account.',
  );
}

const browser = await chromium.launch({ executablePath, headless: true });
const failures = [];
for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', (error) =>
    failures.push(`${viewport.name}: ${error.message}`),
  );
  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole('button', { name: /iniciar|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
  for (const route of [
    '/app',
    '/explore',
    '/loans',
    '/notifications',
    '/profile',
  ]) {
    await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    if (overflow)
      failures.push(`${viewport.name}: horizontal overflow at ${route}`);
  }
  await page.close();
}
await browser.close();
if (failures.length) throw new Error(failures.join('\n'));
console.log('Authenticated browser smoke QA passed.');
