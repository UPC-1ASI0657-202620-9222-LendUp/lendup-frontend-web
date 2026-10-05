'use client';

import { useMemo } from 'react';
import { isMissingProfile } from '@/lib/profile-recovery';
import { reconcileReservationsWithLoans } from '@/lib/business-rules';
import { categoryIds } from '@/config/reference-data';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/features/auth/AuthProvider';
import { authService } from '@/services/auth/auth.service';
import { backendCatalogService } from '@/services/catalog-api.service';
import { evidenceService } from '@/services/evidence.service';
import { identityService } from '@/services/identity.service';
import { loansService } from '@/services/loans.service';
import { notificationsService } from '@/services/notifications.service';
import { backendPaymentsService } from '@/services/payments-api.service';
import { reputationService } from '@/services/reputation.service';
import { requestsService } from '@/services/requests.service';
import { reservationsService } from '@/services/reservations.service';
import { DomainError } from '@/services/api/http-client';
import {
  mapCurrentStudent,
  mapIncident,
  mapListing,
  mapLoan,
  mapNotification,
  mapPublicStudent,
  mapRating,
  mapRequest,
  mapReservation,
  mapTransaction,
} from '@/services/api/mappers/domain';
import type {
  BackendRow,
  CreatePublicationRequestDto,
} from '@/services/api/dto/backend';
import type { MessageKey } from '@/lib/i18n/types';
import type {
  AppState,
  Evidence,
  Incident,
  IncidentDecision,
  Listing,
  ListingStatus,
  User,
} from '@/types/domain';

export interface ActionResult {
  ok: boolean;
  message: MessageKey;
  id?: string;
  detail?: string;
}

export type NewListing = Omit<
  Listing,
  'id' | 'ownerId' | 'status' | 'createdAt'
>;
export interface RegisterUser {
  name: string;
  email: string;
  phone: string;
  universityId: string;
  campus: string;
  career: string;
  cycle: string;
  password: string;
}
export type ProfileUpdate = Partial<
  Pick<User, 'avatar' | 'career' | 'cycle' | 'campus' | 'phone'>
>;

const success = (message: MessageKey, id?: string): ActionResult => ({
  ok: true,
  message,
  id,
});
const failure = (
  message: MessageKey = 'common.requestFailed',
  detail?: string,
): ActionResult => ({ ok: false, message, detail });
const failureFrom = (reason: unknown): ActionResult => {
  if (!(reason instanceof DomainError)) return failure();
  const message = `httpErrors.${reason.code}` as MessageKey;
  const detail = reason.message !== reason.code ? reason.message : undefined;
  return { ok: false, message, detail };
};
const unsupported = (..._args: unknown[]) =>
  Promise.resolve(failure('common.backendGap'));

const queryKeys = {
  me: ['me'] as const,
  listings: ['listings'] as const,
  requests: ['requests'] as const,
  reservations: ['reservations'] as const,
  loans: ['loans'] as const,
  incidents: ['incidents'] as const,
  notifications: ['notifications'] as const,
  terms: ['terms'] as const,
};

function publicationBody(
  listing: Partial<NewListing>,
): Partial<CreatePublicationRequestDto> {
  return {
    ...(listing.category
      ? { categoria_id: categoryIds[listing.category] }
      : {}),
    ...(listing.title ? { titulo: listing.title } : {}),
    ...(listing.description ? { descripcion: listing.description } : {}),
    ...(listing.condition ? { condicion_objeto: listing.condition } : {}),
    ...(listing.universityId ? { universidad: listing.universityId } : {}),
    ...(listing.campus ? { campus: listing.campus } : {}),
    ...(listing.location ? { ubicacion: listing.location } : {}),
    ...(listing.exchangePlace
      ? { lugar_intercambio: listing.exchangePlace }
      : {}),
    ...(listing.dailyRate !== undefined
      ? { tarifa_diaria: listing.dailyRate }
      : {}),
    ...(listing.guaranteeAmount !== undefined
      ? { garantia_monetaria: listing.guaranteeAmount }
      : {}),
    moneda: 'PEN',
    ...(listing.terms?.usage ? { condiciones_uso: listing.terms.usage } : {}),
    ...(listing.terms?.delivery
      ? { condiciones_entrega: listing.terms.delivery }
      : {}),
    ...(listing.terms?.returnPolicy
      ? { condiciones_devolucion: listing.terms.returnPolicy }
      : {}),
    ...(listing.terms?.cancellation
      ? { condiciones_cancelacion: listing.terms.cancellation }
      : {}),
  };
}

const incidentType = (type: Incident['type']) =>
  ({
    DAMAGE: 'DANIO',
    LOSS: 'PERDIDA',
    LATE_RETURN: 'RETRASO',
    NON_RETURN: 'NO_DEVOLUCION',
    OTHER: 'OTRO',
  })[type];

export function useLendUp() {
  const { user: firebaseUser, ready, emailVerified } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: [...queryKeys.me, firebaseUser?.uid],
    queryFn: ({ signal }) => identityService.me(signal),
    enabled: Boolean(firebaseUser),
    retry: false,
  });
  const currentUser = meQuery.data
    ? mapCurrentStudent(meQuery.data)
    : undefined;
  const enabled = Boolean(currentUser) && emailVerified;

  const listingsQuery = useQuery({
    queryKey: queryKeys.listings,
    queryFn: ({ signal }) => backendCatalogService.search({}, signal),
    enabled,
  });
  const requestsQuery = useQuery({
    queryKey: queryKeys.requests,
    queryFn: ({ signal }) => requestsService.list({}, signal),
    enabled,
  });
  const reservationsQuery = useQuery({
    queryKey: queryKeys.reservations,
    queryFn: ({ signal }) => reservationsService.list(undefined, signal),
    enabled,
  });
  const loansQuery = useQuery({
    queryKey: queryKeys.loans,
    queryFn: ({ signal }) => loansService.list(undefined, signal),
    enabled,
  });
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ signal }) => notificationsService.list(signal),
    enabled,
  });
  const termsQuery = useQuery({
    queryKey: queryKeys.terms,
    queryFn: ({ signal }) => backendCatalogService.terms(signal),
    enabled: true,
    staleTime: 60_000,
  });
  const adminIncidentsQuery = useQuery({
    queryKey: [...queryKeys.incidents, currentUser?.id, currentUser?.role],
    queryFn: ({ signal }) =>
      currentUser?.role === 'ADMIN'
        ? evidenceService.adminIncidents({}, signal)
        : evidenceService.list(signal),
    enabled,
  });
  const incidentRouteId = location.pathname.match(
    /^\/(?:admin\/)?incidents\/([^/]+)$/,
  )?.[1];
  const incidentDetailQuery = useQuery({
    queryKey: ['incident', incidentRouteId, currentUser?.id],
    queryFn: ({ signal }) => evidenceService.incident(incidentRouteId!, signal),
    enabled: enabled && Boolean(incidentRouteId),
  });

  const incidentRows = [
    ...(incidentDetailQuery.data ? [incidentDetailQuery.data] : []),
    ...(adminIncidentsQuery.data ?? []),
  ].filter(
    (row, index, rows) =>
      rows.findIndex((candidate) => candidate.id === row.id) === index,
  );
  const uniqueRows = (rows: BackendRow[]) =>
    rows.filter(
      (row, index) =>
        rows.findIndex((candidate) => candidate.id === row.id) === index,
    );
  const listings = (listingsQuery.data ?? []).map(mapListing);
  const requests = (requestsQuery.data ?? []).map(mapRequest);
  const mappedReservations = uniqueRows([
    ...(reservationsQuery.data ?? []),
    ...incidentRows.flatMap((row) =>
      row.reserva ? [row.reserva as BackendRow] : [],
    ),
  ]).map((row) =>
    mapReservation(
      row,
      requests.find((request) => request.id === String(row.solicitud_id ?? '')),
    ),
  );
  const loans = uniqueRows([
    ...incidentRows.flatMap((row) =>
      row.prestamo ? [row.prestamo as BackendRow] : [],
    ),
    ...(loansQuery.data ?? []),
  ]).map((row) =>
    mapLoan(
      row,
      mappedReservations.find(
        (reservation) => reservation.id === String(row.reserva_id ?? ''),
      ),
    ),
  );
  const reservations = reconcileReservationsWithLoans(
    mappedReservations,
    loans,
  );
  const incidents = incidentRows.map(mapIncident);

  const publicProfileRouteId =
    location.pathname.match(/^\/users\/([^/]+)$/)?.[1];
  const relatedUserIds = Array.from(
    new Set(
      [
        ...listings.map((item) => item.ownerId),
        ...requests.flatMap((item) => [item.borrowerId, item.lenderId]),
        ...loans.flatMap((item) => [item.borrowerId, item.lenderId]),
        ...incidents.map((item) => item.reportedBy),
        ...(publicProfileRouteId ? [publicProfileRouteId] : []),
      ].filter((id) => id && id !== currentUser?.id),
    ),
  );
  const publicUserQueries = useQueries({
    queries: relatedUserIds.map((id) => ({
      queryKey: ['student', id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        identityService.student(id, signal),
      enabled,
      staleTime: 30_000,
    })),
  });
  const reputationQueries = useQueries({
    queries: [currentUser?.id, ...relatedUserIds].filter(Boolean).map((id) => ({
      queryKey: ['reputation', id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        reputationService.get(id!, signal),
      enabled,
      staleTime: 30_000,
    })),
  });
  const transactionQueries = useQueries({
    queries: loans.map((loan) => ({
      queryKey: ['transactions', loan.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        backendPaymentsService.transactions(loan.id, signal),
      enabled,
    })),
  });

  const users = [
    ...(currentUser ? [currentUser] : []),
    ...publicUserQueries.flatMap((query) =>
      query.data ? [mapPublicStudent(query.data)] : [],
    ),
  ];
  const ratings = reputationQueries.flatMap(
    (query) => query.data?.calificaciones.map(mapRating) ?? [],
  );
  const transactions = transactionQueries.flatMap((query) =>
    (query.data ?? []).map((row) => mapTransaction(row, currentUser?.id ?? '')),
  );
  const termsAccepted = Boolean(
    termsQuery.data?.version_terminos &&
    termsQuery.data?.version_descargo &&
    meQuery.data?.usuario.version_terminos_aceptada ===
      termsQuery.data.version_terminos &&
    meQuery.data?.usuario.version_descargo_aceptada ===
      termsQuery.data.version_descargo,
  );
  const termsAvailable = Boolean(
    termsQuery.data?.version_terminos &&
    termsQuery.data?.version_descargo &&
    termsQuery.data?.contenido,
  );

  const state: AppState = useMemo(
    () => ({
      currentUserId: currentUser?.id ?? '',
      authenticated: Boolean(firebaseUser),
      termsAcceptances:
        termsAccepted && currentUser
          ? [
              {
                userId: currentUser.id,
                version: String(
                  meQuery.data?.usuario.version_terminos_aceptada,
                ),
                acceptedAt: String(meQuery.data?.usuario.aceptados_en ?? ''),
              },
            ]
          : [],
      users,
      listings,
      requests,
      reservations,
      loans,
      incidents,
      analyses: [],
      ratings,
      notifications: (notificationsQuery.data ?? [])
        .filter((row) => row.estado === 'DISPONIBLE' || row.estado === 'LEIDA')
        .map(mapNotification),
      reminders: [],
      transactions,
    }),
    [
      currentUser,
      firebaseUser,
      termsAccepted,
      meQuery.data,
      users,
      listings,
      requests,
      reservations,
      loans,
      incidents,
      ratings,
      notificationsQuery.data,
      transactions,
    ],
  );

  const invalidate = async (...keys: readonly (readonly string[])[]) =>
    Promise.all(
      keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
  const action = async (
    operation: () => Promise<unknown>,
    message: MessageKey,
    keys: readonly (readonly string[])[] = [],
  ) => {
    try {
      const result = (await operation()) as BackendRow | undefined;
      await invalidate(...keys);
      return success(message, result?.id ? String(result.id) : undefined);
    } catch (reason) {
      return failureFrom(reason);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      await queryClient.invalidateQueries();
      return success('results.auth.signedIn');
    } catch (reason) {
      return reason instanceof FirebaseError &&
        [
          'auth/invalid-credential',
          'auth/user-not-found',
          'auth/wrong-password',
        ].includes(reason.code)
        ? failure('auth.errors.INVALID_CREDENTIALS')
        : failure();
    }
  };
  const logout = async () => {
    await authService.logout();
    queryClient.clear();
  };
  const registerUser = async (data: RegisterUser) => {
    try {
      const activeUser = authService.currentUser();
      if (
        activeUser?.email &&
        activeUser.email.toLowerCase() !== data.email.trim().toLowerCase()
      ) {
        return failure('auth.errors.SESSION_EMAIL_MISMATCH');
      }
      if (!activeUser) await authService.register(data.email, data.password);
      const result = await identityService.register({
        correo_institucional: data.email,
        nombre: data.name,
        universidad: data.universityId,
        campus: data.campus,
        carrera: data.career,
        ciclo: Number(data.cycle),
        telefono: data.phone,
      });
      if (!authService.currentUser()?.emailVerified) {
        await authService.sendVerification().catch(() => undefined);
      }
      await invalidate(queryKeys.me);
      return success('results.auth.registered', String(result.id ?? ''));
    } catch (reason) {
      if (
        reason instanceof FirebaseError &&
        reason.code === 'auth/email-already-in-use'
      )
        return failure('auth.errors.EMAIL_TAKEN');
      return failureFrom(reason);
    }
  };
  const requestVerification = (reference: string) => {
    if (!firebaseUser)
      return Promise.resolve(failure('results.verification.notAllowed'));
    if (!reference.trim())
      return Promise.resolve(failure('common.requestFailed'));
    return action(
      () => identityService.requestVerification(reference.trim()),
      'results.verification.sent',
      [queryKeys.me],
    );
  };
  const updateProfile = (data: ProfileUpdate) =>
    action(
      () =>
        identityService.updateMe({
          telefono: data.phone,
          campus: data.campus,
          carrera: data.career,
          ciclo: data.cycle ? Number(data.cycle) : undefined,
          foto_url: data.avatar,
        }),
      'results.profile.saved',
      [queryKeys.me],
    );
  const acceptTerms = () => {
    const terms = termsQuery.data;
    const termsVersion = String(terms?.version_terminos ?? '');
    const disclaimerVersion = String(terms?.version_descargo ?? '');
    if (!termsVersion || !disclaimerVersion) return unsupported();
    return action(
      () => identityService.acceptTerms(termsVersion, disclaimerVersion),
      'results.terms.accepted',
      [queryKeys.me],
    );
  };
  const createListing = async (listing: NewListing) => {
    try {
      const row = await backendCatalogService.create(
        publicationBody(listing) as CreatePublicationRequestDto,
      );
      await invalidate(queryKeys.listings);
      return success('results.listing.published', String(row.id ?? ''));
    } catch (reason) {
      return failureFrom(reason);
    }
  };
  const updateListing = (id: string, listing: Partial<NewListing>) =>
    action(
      () => backendCatalogService.update(id, publicationBody(listing)),
      'results.listing.updated',
      [queryKeys.listings],
    );
  const setListingStatus = (id: string, status: ListingStatus) =>
    action(
      () =>
        backendCatalogService.changeStatus(
          id,
          {
            ACTIVE: 'ACTIVA',
            PAUSED: 'PAUSADA',
            ARCHIVED: 'DADA_DE_BAJA',
          }[status] as 'ACTIVA' | 'PAUSADA' | 'DADA_DE_BAJA',
        ),
      'results.listing.updated',
      [queryKeys.listings],
    );
  const createAvailability = (id: string, startAt: string, endAt: string) =>
    action(
      () => backendCatalogService.createAvailability(id, startAt, endAt),
      'results.availability.created',
      [queryKeys.listings],
    );
  const updateAvailability = (
    id: string,
    slotId: string,
    startAt: string,
    endAt: string,
  ) =>
    action(
      () =>
        backendCatalogService.updateAvailability(id, slotId, startAt, endAt),
      'results.availability.updated',
      [queryKeys.listings],
    );
  const deleteAvailability = (id: string, slotId: string) =>
    action(
      () => backendCatalogService.deleteAvailability(id, slotId),
      'results.availability.deleted',
      [queryKeys.listings],
    );
  const createRequest = (
    listingId: string,
    startAt: string,
    endAt: string,
    _message?: string,
  ) =>
    action(
      () => requestsService.create(listingId, startAt, endAt),
      'results.request.created',
      [queryKeys.requests],
    );
  const cancelRequest = (id: string) =>
    action(() => requestsService.cancel(id), 'results.request.cancelled', [
      queryKeys.requests,
    ]);
  const respondRequest = (id: string, accepted: boolean) =>
    action(
      () =>
        accepted ? requestsService.accept(id) : requestsService.reject(id),
      accepted ? 'results.request.accepted' : 'results.request.rejected',
      [
        queryKeys.requests,
        queryKeys.reservations,
        queryKeys.loans,
        queryKeys.notifications,
      ],
    );
  const cancelReservation = (id: string, reason: string) =>
    action(
      () => reservationsService.cancel(id, reason),
      'results.reservation.cancelled',
      [queryKeys.reservations, queryKeys.loans],
    );
  const holdGuarantee = async (reservationId: string, methodId: string) => {
    const loan = loans.find((item) => item.reservationId === reservationId);
    if (!loan) return failure();
    return action(
      () =>
        backendPaymentsService.guarantee(
          loan.id,
          methodId,
          crypto.randomUUID(),
        ),
      'results.payment.guaranteePending',
      [queryKeys.loans, ['transactions']],
    );
  };
  const recordDelivery = async (
    reservationId: string,
    evidence: Evidence[],
  ) => {
    const loan = loans.find((item) => item.reservationId === reservationId);
    if (!loan) return failure();
    try {
      for (const item of evidence.filter(
        (entry) => entry.type === 'NOTE' && entry.description.trim(),
      )) {
        await evidenceService.create(loan.id, {
          etapa: 'ENTREGA',
          tipo: 'OBSERVACION',
          observacion: item.description,
        });
      }
      await loansService.delivery(loan.id);
      await invalidate(queryKeys.loans);
      return success('results.delivery.recorded', loan.id);
    } catch (reason) {
      return failureFrom(reason);
    }
  };
  const confirmReceipt = (loanId: string) =>
    action(
      () => loansService.receipt(loanId),
      'results.loan.receiptConfirmed',
      [queryKeys.loans],
    );
  const proposeReschedule = (loanId: string, endAt: string) =>
    action(
      () => loansService.proposeReschedule(loanId, endAt),
      'results.reschedule.proposed',
      [queryKeys.loans, queryKeys.notifications],
    );
  const recordReturn = async (
    loanId: string,
    _early: boolean,
    notes: string,
    evidence: Evidence[],
  ) => {
    try {
      if (notes.trim()) {
        await evidenceService.create(loanId, {
          etapa: 'DEVOLUCION',
          tipo: 'OBSERVACION',
          observacion: notes,
        });
      }
      for (const item of evidence.filter(
        (entry) => entry.type === 'NOTE' && entry.description.trim(),
      )) {
        await evidenceService.create(loanId, {
          etapa: 'DEVOLUCION',
          tipo: 'OBSERVACION',
          observacion: item.description,
        });
      }
      await loansService.returnLoan(loanId);
      await invalidate(queryKeys.loans);
      return success('results.return.recorded');
    } catch (reason) {
      return failureFrom(reason);
    }
  };
  const confirmReturn = (loanId: string) =>
    action(
      () => loansService.confirmReturn(loanId),
      'results.return.confirmedCompleted',
      [queryKeys.loans],
    );
  const reportIncident = (
    loanId: string,
    type: Incident['type'],
    description: string,
    evidence: Evidence[] = [],
    photos: File[] = [],
    requestId?: string,
  ) =>
    action(
      () =>
        evidenceService.reportIncident(
          loanId,
          incidentType(type),
          description,
          evidence
            .filter((item) => item.type === 'NOTE')
            .map((item) => item.description),
          photos,
          requestId,
        ),
      'results.incident.reported',
      [queryKeys.incidents, queryKeys.loans],
    );
  const incidentAction = (id: string, operation: () => Promise<BackendRow>) =>
    action(operation, 'results.incident.updated', [
      queryKeys.incidents,
      ['incident', id],
      queryKeys.loans,
      queryKeys.notifications,
    ]);
  const submitIncidentStatement = (id: string, content: string) =>
    incidentAction(id, () => evidenceService.statement(id, content));
  const startIncidentReview = (id: string) =>
    incidentAction(id, () => evidenceService.review(id));
  const addIncidentNote = (id: string, content: string) =>
    incidentAction(id, () => evidenceService.note(id, content));
  const resolveIncident = (
    id: string,
    decision: IncidentDecision,
    amount: number,
    justification: string,
  ) => {
    const incident = incidents.find((item) => item.id === id);
    const loan = loans.find((item) => item.id === incident?.loanId);
    const previouslyCaptured = incidents
      .filter((item) => item.loanId === incident?.loanId && item.id !== id)
      .reduce((total, item) => total + (item.resolution?.amount ?? 0), 0);
    const availableGuarantee = Math.max(
      0,
      (loan?.snapshot.guaranteeAmount ?? 0) - previouslyCaptured,
    );
    return action(
      () =>
        evidenceService.resolve(id, {
          justificacion_resolucion: justification,
          decision_garantia: {
            NO_IMPACT: 'SIN_AFECTACION',
            PARTIAL: 'AFECTACION_PARCIAL',
            TOTAL: 'AFECTACION_TOTAL',
          }[decision] as
            | 'SIN_AFECTACION'
            | 'AFECTACION_PARCIAL'
            | 'AFECTACION_TOTAL',
          monto_garantia_afectado: amount,
          saldo_garantia_previsto: Math.max(0, availableGuarantee - amount),
          moneda: 'PEN',
        }),
      'results.incident.resolved',
      [
        queryKeys.incidents,
        ['incident', id],
        queryKeys.loans,
        queryKeys.notifications,
      ],
    );
  };
  const rateLoan = (loanId: string, stars: number, comment: string) =>
    action(
      () => reputationService.rate(loanId, stars, comment),
      'results.rating.saved',
      [['reputation']],
    );
  const markNotification = async (id?: string) => {
    const unread = state.notifications.filter(
      (item) => !item.read && (!id || item.id === id),
    );
    await Promise.all(
      unread.map((item) => notificationsService.markRead(item.id)),
    );
    await invalidate(queryKeys.notifications);
  };

  return {
    firebaseUser,
    emailVerified,
    authReady: ready,
    state,
    hydrated: ready && (!firebaseUser || !meQuery.isLoading),
    dataLoading:
      enabled &&
      [
        listingsQuery,
        requestsQuery,
        reservationsQuery,
        loansQuery,
        adminIncidentsQuery,
        incidentDetailQuery,
        ...transactionQueries,
      ].some((query) => query.isLoading),
    profileMissing: Boolean(firebaseUser && isMissingProfile(meQuery.error)),
    profileError: Boolean(
      firebaseUser && meQuery.isError && !isMissingProfile(meQuery.error),
    ),
    retryProfile: () => meQuery.refetch(),
    termsAvailable,
    termsDocument: termsQuery.data,
    termsLoading: termsQuery.isLoading,
    termsError: termsQuery.isError,
    retryTerms: () => termsQuery.refetch(),
    login,
    logout,
    registerUser,
    requestVerification,
    updateProfile,
    acceptTerms,
    createListing,
    updateListing,
    setListingStatus,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    createRequest,
    cancelRequest,
    respondRequest,
    cancelReservation,
    holdGuarantee,
    recordDelivery,
    confirmReceipt,
    requestExtension: unsupported,
    respondExtension: unsupported,
    payExtension: unsupported,
    proposeReschedule,
    respondReschedule: unsupported,
    recordReturn,
    confirmReturn,
    incidentDetailError:
      incidentDetailQuery.isError &&
      !(
        incidentDetailQuery.error instanceof DomainError &&
        ['NOT_FOUND', 'FORBIDDEN'].includes(incidentDetailQuery.error.code)
      ),
    retryIncidentDetail: () => incidentDetailQuery.refetch(),
    incidentsLoading: adminIncidentsQuery.isLoading,
    incidentsError: adminIncidentsQuery.isError,
    retryIncidents: () => adminIncidentsQuery.refetch(),
    submitIncidentStatement,
    startIncidentReview,
    addIncidentNote,
    reportIncident,
    resolveIncident,
    rateLoan,
    markNotification,
  };
}

export function useCurrentUser() {
  const { state } = useLendUp();
  return state.users.find((user) => user.id === state.currentUserId);
}
