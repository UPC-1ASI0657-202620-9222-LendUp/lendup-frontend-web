import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth, firebaseConfigured } from '@/services/auth/firebase';

export class AuthConfigurationError extends Error {
  constructor() {
    super('Firebase no está configurado para este entorno.');
  }
}

function auth() {
  if (!firebaseConfigured || !firebaseAuth) throw new AuthConfigurationError();
  return firebaseAuth;
}

export const authService = {
  currentUser: (): FirebaseUser | null => firebaseAuth?.currentUser ?? null,
  subscribe: (listener: (user: FirebaseUser | null) => void) => {
    if (!firebaseAuth) {
      listener(null);
      return () => undefined;
    }
    return onAuthStateChanged(firebaseAuth, listener);
  },
  login: async (email: string, password: string) =>
    (await signInWithEmailAndPassword(auth(), email, password)).user,
  register: async (email: string, password: string) =>
    (await createUserWithEmailAndPassword(auth(), email, password)).user,
  logout: async () => signOut(auth()),
  idToken: async (forceRefresh = false) =>
    firebaseAuth?.currentUser?.getIdToken(forceRefresh) ?? null,
};
