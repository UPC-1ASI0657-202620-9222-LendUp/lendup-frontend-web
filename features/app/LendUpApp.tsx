'use client';

import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/lendup/AppShell';
import { LogoStacked } from '@/components/lendup/Brand';
import { NotFound } from '@/components/lendup/shared';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { AuthProvider } from '@/features/auth/AuthProvider';
import {
  LoginPage,
  RegisterPage,
  TermsPage,
  VerifyEmailPage,
} from '@/features/public/PublicPages';
import {
  CalendarPage,
  DashboardPage,
  NotificationsPage,
  ProfilePage,
  PublicProfilePage,
  TransactionsPage,
} from '@/features/dashboard/DashboardPages';
import {
  AvailabilityPage,
  ExplorePage,
  ListingFormPage,
  MyItemsPage,
  ObjectDetailPage,
} from '@/features/listings/ListingPages';
import {
  CheckoutPage,
  DeliveryPage,
  LoanDetailPage,
  LoansPage,
  RequestsPage,
  ReservationDetailPage,
  ReservationsPage,
} from '@/features/operations/OperationPages';
import {
  AdminIncidentDetailPage,
  AdminIncidentsPage,
  IncidentDetailPage,
  IncidentsPage,
} from '@/features/incidents/IncidentPages';
import {
  AdminRoute,
  CheckoutGuard,
  DeliveryGuard,
  OperationAccessGuard,
  OwnershipGuard,
  ProtectedRoute,
  PublicOnlyRoute,
  RootRedirect,
  StudentRoute,
} from '@/features/app/RouteGuards';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1500, retry: 1 } },
});

function PageNotFound() {
  const { t } = useI18n();
  return (
    <NotFound
      title={t('errors.notFound.title')}
      description={t('errors.notFound.description')}
    />
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<DashboardPage />} />
            <Route element={<StudentRoute />}>
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/objects/:id" element={<ObjectDetailPage />} />
              <Route path="/my-items" element={<MyItemsPage />} />
              <Route path="/my-items/new" element={<ListingFormPage />} />
              <Route
                path="/my-items/:id/edit"
                element={
                  <OwnershipGuard>
                    <ListingFormPage edit />
                  </OwnershipGuard>
                }
              />
              <Route
                path="/my-items/:id/availability"
                element={
                  <OwnershipGuard>
                    <AvailabilityPage />
                  </OwnershipGuard>
                }
              />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/reservations" element={<ReservationsPage />} />
              <Route
                path="/reservations/:id"
                element={
                  <OperationAccessGuard kind="reservation">
                    <ReservationDetailPage />
                  </OperationAccessGuard>
                }
              />
              <Route
                path="/reservations/:id/checkout"
                element={
                  <CheckoutGuard>
                    <CheckoutPage />
                  </CheckoutGuard>
                }
              />
              <Route
                path="/delivery"
                element={
                  <DeliveryGuard>
                    <DeliveryPage />
                  </DeliveryGuard>
                }
              />
              <Route path="/loans" element={<LoansPage />} />
              <Route
                path="/loans/:id"
                element={
                  <OperationAccessGuard kind="loan">
                    <LoanDetailPage />
                  </OperationAccessGuard>
                }
              />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route
                path="/incidents/:id"
                element={
                  <OperationAccessGuard kind="incident">
                    <IncidentDetailPage />
                  </OperationAccessGuard>
                }
              />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
            </Route>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users/:id" element={<PublicProfilePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
              <Route
                path="/admin/incidents/:id"
                element={<AdminIncidentDetailPage />}
              />
            </Route>
            <Route path="/404" element={<PageNotFound />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export function LendUpApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted)
    return (
      <div className="app-loader" aria-hidden="true">
        <LogoStacked />
      </div>
    );
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
