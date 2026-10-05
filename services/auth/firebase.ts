import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { firebasePublicConfig } from '@/config/app-config';

const required = [
  firebasePublicConfig.apiKey,
  firebasePublicConfig.authDomain,
  firebasePublicConfig.projectId,
  firebasePublicConfig.appId,
];

export const firebaseConfigured = required.every(Boolean);

const app = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebasePublicConfig)
  : null;

export const firebaseAuth = app ? getAuth(app) : null;

const emulatorUrl =
  import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL;
if (firebaseAuth && emulatorUrl && !firebaseAuth.emulatorConfig) {
  connectAuthEmulator(firebaseAuth, emulatorUrl, { disableWarnings: true });
}
