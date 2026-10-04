type EnvRecord = Partial<Record<string, string>>;

const env: EnvRecord =
  (import.meta as ImportMeta & { env?: EnvRecord }).env ?? {};

export type Locale = 'es' | 'en';
export const supportedLocales: readonly Locale[] = ['es', 'en'];

export const appConfig = {
  apiGatewayUrl:
    env.VITE_API_GATEWAY_URL ?? 'https://lendup-backend.onrender.com/api/v1',
  defaultLocale: (env.VITE_DEFAULT_LOCALE === 'en' ? 'en' : 'es') as Locale,
  currency: 'PEN',
  timeZone: env.VITE_TIME_ZONE ?? 'America/Lima',
  googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  storageKeys: {
    locale: 'lendup-locale',
  },
} as const;

export const firebasePublicConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
} as const;
