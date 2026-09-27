'use client';

import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/lendup/AppShell';
import { DemoProvider } from '@/stores/demo-store';
import {
  LandingPage,
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
import { EmptyState } from '@/components/lendup/shared';
import { ShieldCheck } from 'lucide-react';
import { WebMcpTools } from '@/features/app/WebMcpTools';
import {
  AdminRoute,
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/features/app/RouteGuards';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1500, retry: 1 } },
});

export function LendUpApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted)
    return (
      <div className="app-loader">
        <span className="brand-mark">
          <ShieldCheck />
        </span>
        <strong>LendUp</strong>
        <div />
      </div>
    );
  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>
        <BrowserRouter>
          <WebMcpTools />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/app" element={<DashboardPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/objects/:id" element={<ObjectDetailPage />} />
                <Route path="/my-items" element={<MyItemsPage />} />
                <Route path="/my-items/new" element={<ListingFormPage />} />
                <Route
                  path="/my-items/:id/edit"
                  element={<ListingFormPage edit />}
                />
                <Route
                  path="/my-items/:id/availability"
                  element={<AvailabilityPage />}
                />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/reservations" element={<ReservationsPage />} />
                <Route
                  path="/reservations/:id"
                  element={<ReservationDetailPage />}
                />
                <Route
                  path="/reservations/:id/checkout"
                  element={<CheckoutPage />}
                />
                <Route path="/loans" element={<LoansPage />} />
                <Route path="/loans/:id" element={<LoanDetailPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/incidents/:id" element={<IncidentDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/users/:id" element={<PublicProfilePage />} />
                <Route element={<AdminRoute />}>
                  <Route
                    path="/admin/incidents"
                    element={<AdminIncidentsPage />}
                  />
                  <Route
                    path="/admin/incidents/:id"
                    element={<AdminIncidentDetailPage />}
                  />
                </Route>
                <Route
                  path="/404"
                  element={
                    <EmptyState
                      title="Página no encontrada"
                      description="La dirección que abriste no existe."
                      action="Volver al inicio"
                      href="/app"
                    />
                  }
                />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </DemoProvider>
    </QueryClientProvider>
  );
}
