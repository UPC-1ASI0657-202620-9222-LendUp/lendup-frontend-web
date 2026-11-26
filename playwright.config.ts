import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const gatewayUrl =
  process.env.E2E_GATEWAY_URL ?? 'http://localhost:8090/api/v1';
const emulatorUrl = process.env.E2E_EMULATOR_URL ?? 'http://localhost:9099';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './tests/e2e/reportes/artefactos',
  // Los flujos comparten datos (publicación → solicitud → préstamo): van en orden.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/e2e/reportes/html', open: 'never' }],
    ['json', { outputFile: 'tests/e2e/reportes/resultados.json' }],
    ['./tests/e2e/support/markdown-reporter.ts'],
  ],
  use: {
    baseURL,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    // BROWSER_PATH permite usar un Chrome/Chromium del sistema en vez del de Playwright.
    launchOptions: process.env.BROWSER_PATH
      ? { executablePath: process.env.BROWSER_PATH }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    // Perfil local de lendup-e2e; las variables del shell tienen prioridad sobre .env.local.
    env: {
      VITE_API_GATEWAY_URL: gatewayUrl,
      VITE_FIREBASE_AUTH_EMULATOR_URL: emulatorUrl,
      VITE_FIREBASE_API_KEY: 'emulador',
      VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
      VITE_FIREBASE_PROJECT_ID: 'lendup-desarrollo',
      VITE_FIREBASE_APP_ID: 'local',
    },
  },
});
