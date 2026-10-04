import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
