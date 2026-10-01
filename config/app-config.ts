type EnvRecord = Partial<Record<string, string>>;

const env: EnvRecord =
  (import.meta as ImportMeta & { env?: EnvRecord }).env ?? {};

const numberFrom = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(parsed)
    ? parsed
    : fallback;
};

export type Locale = 'es' | 'en';
export const supportedLocales: readonly Locale[] = ['es', 'en'];

export const appConfig = {
  demoMode: env.VITE_DEMO_MODE !== 'false',
  apiGatewayUrl: env.VITE_API_GATEWAY_URL ?? '/api/v1',
  defaultLocale: (env.VITE_DEFAULT_LOCALE === 'en' ? 'en' : 'es') as Locale,
  currency: 'PEN',
  timeZone: env.VITE_TIME_ZONE ?? 'America/Lima',
  termsVersion: env.VITE_TERMS_VERSION ?? '1.0',
  termsPublishedAt: env.VITE_TERMS_PUBLISHED_AT ?? '2026-09-01',
  lendupCommissionRate: numberFrom(env.VITE_LENDUP_COMMISSION_RATE, 0.1),
  providerFeeRate: numberFrom(env.VITE_PAYMENT_PROVIDER_FEE_RATE, 0),
  maxUploadBytes: numberFrom(env.VITE_MAX_UPLOAD_MB, 2) * 1_000_000,
  evidenceAnalysisTimeoutMs: numberFrom(
    env.VITE_EVIDENCE_ANALYSIS_TIMEOUT_MS,
    20_000,
  ),
  reminderLeadHours: numberFrom(env.VITE_REMINDER_LEAD_HOURS, 24),
  googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  storageKeys: {
    state: 'lendup-demo-state-v4',
    locale: 'lendup-locale',
  },
} as const;
