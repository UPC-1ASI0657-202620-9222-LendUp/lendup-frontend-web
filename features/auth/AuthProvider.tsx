'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/services/auth/auth.service';

interface AuthContextValue {
  user: FirebaseUser | null;
  ready: boolean;
  emailVerified: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(() =>
    authService.currentUser(),
  );
  const [emailVerified, setEmailVerified] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      authService.subscribe((next) => {
        setUser(next);
        setEmailVerified(Boolean(next?.emailVerified));
        setReady(true);
      }),
    [],
  );

  const value = useMemo(
    () => ({ user, ready, emailVerified }),
    [user, ready, emailVerified],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
