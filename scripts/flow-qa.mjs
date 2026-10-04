import { chromium } from 'playwright-core';

const baseURL = process.env.LOCAL_URL ?? 'http://localhost:3000';
const executablePath = process.env.BROWSER_PATH ?? '/opt/pw-browsers/chromium';
const email = process.env.QA_EMAIL;
const password = process.env.QA_PASSWORD;

if (!email || !password) {
  throw new Error(
    'QA_EMAIL and QA_PASSWORD are required. Flow QA never targets production or creates provider outcomes.',
  );
}

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: 'es-PE',
});
await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
await page.getByLabel(/correo|email/i).fill(email);
await page.getByLabel(/contraseña|password/i).fill(password);
await page.getByRole('button', { name: /iniciar|sign in/i }).click();
await page.waitForURL((url) => !url.pathname.endsWith('/login'));

// Read-only coverage. Mutating integrations belong in a local/dev backend environment.
for (const route of [
  '/app',
  '/explore',
  '/requests',
  '/reservations',
  '/loans',
  '/calendar',
]) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  await page.locator('main').waitFor();
}

await browser.close();
console.log('Read-only authenticated flow QA passed.');
