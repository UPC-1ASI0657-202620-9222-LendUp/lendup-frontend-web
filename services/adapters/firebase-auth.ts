import type { User } from '@/types/domain';

export type AuthErrorCode =
  | 'USER_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_SUSPENDED';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
  }
}

export interface AuthSession {
  uid: string;
  idToken: string;
}

export interface AuthProvider {
  signIn(
    email: string,
    password: string,
    directory: User[],
  ): Promise<AuthSession>;
  signOut(): Promise<void>;
  getIdToken(): Promise<string | null>;
}

const latency = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let currentSession: AuthSession | null = null;

export const authProvider: AuthProvider = {
  async signIn(email, password, directory) {
    await latency(250);
    const user = directory.find(
      (candidate) =>
        candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user) throw new AuthError('USER_NOT_FOUND');
    if (user.password !== password) throw new AuthError('INVALID_CREDENTIALS');
    if (user.accountStatus === 'SUSPENDED')
      throw new AuthError('ACCOUNT_SUSPENDED');
    currentSession = {
      uid: user.id,
      idToken: `demo-token-${user.id}-${Date.now().toString(36)}`,
    };
    return currentSession;
  },
  async signOut() {
    currentSession = null;
  },
  async getIdToken() {
    return currentSession?.idToken ?? null;
  },
};
