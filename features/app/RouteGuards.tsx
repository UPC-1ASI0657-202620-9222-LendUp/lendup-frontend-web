'use client';

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingSkeleton } from '@/components/lendup/shared';
import { useDemo } from '@/stores/demo-store';

export function ProtectedRoute() {
  const { state, hydrated } = useDemo();
  const location = useLocation();
  if (!hydrated) return <LoadingSkeleton />;
  return state.authenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}

export function AdminRoute() {
  const { state, hydrated } = useDemo();
  const user = state.users.find(
    (candidate) => candidate.id === state.currentUserId,
  );
  if (!hydrated) return <LoadingSkeleton />;
  if (!state.authenticated) return <Navigate to="/login" replace />;
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/app" replace />;
}

export function PublicOnlyRoute() {
  const { state, hydrated } = useDemo();
  if (!hydrated) return <LoadingSkeleton />;
  return state.authenticated ? <Navigate to="/app" replace /> : <Outlet />;
}
