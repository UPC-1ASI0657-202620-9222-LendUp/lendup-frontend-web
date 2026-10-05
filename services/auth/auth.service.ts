import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification,
  reload,
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
    return onIdTokenChanged(firebaseAuth, listener);
  },
  login: async (email: string, password: string) =>
    (await signInWithEmailAndPassword(auth(), email, password)).user,
  register: async (email: string, password: string) =>
    (await createUserWithEmailAndPassword(auth(), email, password)).user,
  sendVerification: async () => {
    const user = auth().currentUser;
    if (!user) throw new Error('No active session');
    if (!user.emailVerified)
      await sendEmailVerification(user, {
        url: window.location.origin + '/verify-email',
      });
  },
  refreshVerification: async () => {
    const user = auth().currentUser;
    if (!user) return false;
    await reload(user);
    await user.getIdToken(true);
    return user.emailVerified;
  },
  logout: async () => signOut(auth()),
  idToken: async (forceRefresh = false) =>
    firebaseAuth?.currentUser?.getIdToken(forceRefresh) ?? null,
};
