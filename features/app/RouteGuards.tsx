'use client';

import type { ReactNode } from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { LoadingSkeleton } from '@/components/lendup/shared';
import {
  canManageListing,
  canViewIncident,
  canViewLoan,
  canViewReservation,
} from '@/lib/business-rules';
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

export function StudentRoute() {
  const { state, hydrated } = useDemo();
  const user = state.users.find(
    (candidate) => candidate.id === state.currentUserId,
  );
  if (!hydrated) return <LoadingSkeleton />;
  if (!state.authenticated) return <Navigate to="/login" replace />;
  return user?.role === 'STUDENT' ? <Outlet /> : <Navigate to="/app" replace />;
}

export function PublicOnlyRoute() {
  const { state, hydrated } = useDemo();
  if (!hydrated) return <LoadingSkeleton />;
  return state.authenticated ? <Navigate to="/app" replace /> : <Outlet />;
}

export function RootRedirect() {
  const { state, hydrated } = useDemo();
  if (!hydrated) return <LoadingSkeleton />;
  return <Navigate to={state.authenticated ? '/app' : '/login'} replace />;
}

export function OperationAccessGuard({
  kind,
  children,
}: {
  kind: 'reservation' | 'loan' | 'incident';
  children: ReactNode;
}) {
  const { id } = useParams();
  const { state } = useDemo();
  const allowed =
    kind === 'reservation'
      ? canViewReservation(state, id ?? '', state.currentUserId)
      : kind === 'loan'
        ? canViewLoan(state, id ?? '', state.currentUserId)
        : canViewIncident(
            state,
            state.incidents.find((item) => item.id === id),
            state.currentUserId,
          );
  return allowed ? children : <Navigate to="/404" replace />;
}

export function OwnershipGuard({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const { state } = useDemo();
  const listing = state.listings.find((item) => item.id === id);
  return canManageListing(listing, state.currentUserId) ? (
    children
  ) : (
    <Navigate to="/404" replace />
  );
}

export function CheckoutGuard({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const { state } = useDemo();
  const reservation = state.reservations.find((item) => item.id === id);
  return reservation?.borrowerId === state.currentUserId ? (
    children
  ) : (
    <Navigate to="/404" replace />
  );
}

export function LoanAccessGuard({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state } = useDemo();
  if (id !== 'new')
    return canViewLoan(state, id ?? '', state.currentUserId) ? (
      children
    ) : (
      <Navigate to="/404" replace />
    );
  const reservation = state.reservations.find(
    (item) => item.id === params.get('delivery'),
  );
  return reservation?.lenderId === state.currentUserId ? (
    children
  ) : (
    <Navigate to="/404" replace />
  );
}
