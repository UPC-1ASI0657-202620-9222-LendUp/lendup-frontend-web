'use client';

import type { ReactNode } from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ErrorState, LoadingSkeleton } from '@/components/lendup/shared';
import {
  canManageListing,
  canViewIncident,
  canViewLoan,
  canViewReservation,
} from '@/lib/business-rules';
import { useLendUp } from '@/hooks/use-lendup';
import { currentUserOf } from '@/stores/selectors';
import type { Role } from '@/types/domain';

export function ProtectedRoute() {
  const { state, hydrated, profileMissing, profileError, retryProfile } =
    useLendUp();
  const location = useLocation();
  if (!hydrated) return <LoadingSkeleton />;
  if (profileError) return <ErrorState onRetry={() => void retryProfile()} />;
  if (profileMissing) return <Navigate to="/register" replace />;
  return state.authenticated && currentUserOf(state) ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: `${location.pathname}${location.search}` }}
    />
  );
}

function RoleRoute({ allowed }: { allowed: Role }) {
  const { state } = useLendUp();
  return currentUserOf(state)?.role === allowed ? (
    <Outlet />
  ) : (
    <Navigate to="/app" replace />
  );
}

export const AdminRoute = () => <RoleRoute allowed="ADMIN" />;
export const StudentRoute = () => <RoleRoute allowed="STUDENT" />;

export function PublicOnlyRoute() {
  const { state, hydrated, profileMissing, profileError, retryProfile } =
    useLendUp();
  const location = useLocation();
  if (!hydrated) return <LoadingSkeleton />;
  if (profileError) return <ErrorState onRetry={() => void retryProfile()} />;
  if (
    !state.authenticated ||
    (profileMissing && location.pathname === '/register')
  )
    return <Outlet />;
  const user = currentUserOf(state);
  const registered = location.pathname === '/register';
  const from = (location.state as { from?: string } | null)?.from;
  if (registered && user && !user.verified)
    return <Navigate to="/verify-email" replace state={{ registered }} />;
  return <Navigate to={from ?? '/app'} replace />;
}

export function RootRedirect() {
  const { state, hydrated, profileMissing, profileError, retryProfile } =
    useLendUp();
  if (!hydrated) return <LoadingSkeleton />;
  if (profileError) return <ErrorState onRetry={() => void retryProfile()} />;
  return (
    <Navigate
      to={
        profileMissing ? '/register' : state.authenticated ? '/app' : '/login'
      }
      replace
    />
  );
}

export function OperationAccessGuard({
  kind,
  children,
}: {
  kind: 'reservation' | 'loan' | 'incident';
  children: ReactNode;
}) {
  const { id = '' } = useParams();
  const { state, dataLoading } = useLendUp();
  if (dataLoading) return <LoadingSkeleton />;
  const allowed =
    kind === 'reservation'
      ? canViewReservation(state, id, state.currentUserId)
      : kind === 'loan'
        ? canViewLoan(state, id, state.currentUserId)
        : canViewIncident(
            state,
            state.incidents.find((item) => item.id === id),
            state.currentUserId,
          );
  return allowed ? children : <Navigate to="/404" replace />;
}

export function OwnershipGuard({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const { state, dataLoading } = useLendUp();
  if (dataLoading) return <LoadingSkeleton />;
  const listing = state.listings.find((item) => item.id === id);
  return canManageListing(listing, state.currentUserId) ? (
    children
  ) : (
    <Navigate to="/404" replace />
  );
}

export function CheckoutGuard({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const { state, dataLoading } = useLendUp();
  if (dataLoading) return <LoadingSkeleton />;
  const reservation = state.reservations.find((item) => item.id === id);
  return reservation?.borrowerId === state.currentUserId ? (
    children
  ) : (
    <Navigate to="/404" replace />
  );
}

export function DeliveryGuard({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const { state, dataLoading } = useLendUp();
  if (dataLoading) return <LoadingSkeleton />;
  const reservation = state.reservations.find(
    (item) => item.id === params.get('reservation'),
  );
  return reservation?.lenderId === state.currentUserId ? (
    children
  ) : (
    <Navigate to="/404" replace />
  );
}
