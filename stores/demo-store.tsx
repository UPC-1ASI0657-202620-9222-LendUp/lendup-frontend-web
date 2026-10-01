'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { appConfig } from '@/config/app-config';
import { createSeed } from '@/mocks/seed';
import { universities } from '@/mocks/catalog';
import {
  canCancelReservation,
  canManageListing,
  canOperate,
  canRequestListing,
  canRetryPayment,
  cancellationRefund,
  counterpartOf,
  economicBreakdown,
  extensionCost,
  guaranteeAfterReturn,
  hasReservationCollision,
  hasUnresolvedIncident,
  isInstitutionalEmail,
  isParticipant,
  isPaymentSettled,
  isPeriodAvailable,
  mayRateLoan,
  overlaps,
  releaseFutureAvailability,
  remainingGuarantee,
  removeOperationReminders,
  replaceReservedInterval,
  shouldMarkOverdue,
  statusAfterReturnConfirmation,
  updateReturnReminders,
  validPartialCapture,
} from '@/lib/business-rules';
import type { MessageKey } from '@/lib/i18n/types';
import { authProvider, AuthError } from '@/services/adapters/firebase-auth';
import {
  guaranteeStatusFromOutcome,
  paymentStatusFromOutcome,
} from '@/services/adapters/mercado-pago';
import {
  createTermsSnapshot,
  paymentsService,
} from '@/services/payments.service';
import { currentUserOf, termsAcceptedBy } from '@/stores/selectors';
import type {
  AppNotification,
  AvailabilitySlot,
  DemoState,
  Evidence,
  EvidenceAnalysis,
  Incident,
  IncidentDecision,
  Listing,
  ListingStatus,
  Loan,
  NotificationEvent,
  NotificationParams,
  PaymentTransaction,
  ProviderOutcome,
  Reminder,
  TimelineEvent,
  User,
} from '@/types/domain';

export interface ActionResult {
  ok: boolean;
  message: MessageKey;
  id?: string;
}

const success = (message: MessageKey, id?: string): ActionResult => ({
  ok: true,
  message,
  id,
});
const failure = (message: MessageKey): ActionResult => ({ ok: false, message });

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

const notice = (
  userId: string,
  event: NotificationEvent,
  href: string,
  params: NotificationParams = {},
): AppNotification => ({
  id: uid('notification'),
  userId,
  event,
  params,
  href,
  createdAt: now(),
  read: false,
});

const transaction = (
  value: Omit<
    PaymentTransaction,
    'id' | 'createdAt' | 'updatedAt' | 'currency' | 'providerReference'
  > & { providerReference?: string },
): PaymentTransaction => ({
  ...value,
  id: uid('tx'),
  createdAt: now(),
  updatedAt: now(),
  currency: 'PEN',
  providerReference:
    value.providerReference ??
    `MP-${value.type}-${Date.now().toString(36).toUpperCase()}`,
});

const timelineEvent = (
  event: TimelineEvent['event'],
  complete = true,
): TimelineEvent => ({
  id: uid('timeline'),
  event,
  at: complete ? now() : undefined,
  complete,
});

const reminder = (value: Omit<Reminder, 'id'>): Reminder => ({
  id: uid('reminder'),
  ...value,
});

export type NewListing = Omit<
  Listing,
  'id' | 'ownerId' | 'status' | 'createdAt'
>;
export type RegisterUser = Pick<
  User,
  | 'name'
  | 'email'
  | 'phone'
  | 'universityId'
  | 'campus'
  | 'career'
  | 'cycle'
  | 'password'
>;
export type ProfileUpdate = Partial<
  Pick<User, 'avatar' | 'career' | 'cycle' | 'campus' | 'phone'>
>;

interface DemoActions {
  login: (email: string, password: string) => Promise<ActionResult>;
  logout: () => void;
  switchUser: (id: string) => void;
  registerUser: (data: RegisterUser) => ActionResult;
  requestVerification: () => Promise<ActionResult>;
  completeVerification: (outcome: 'SUCCESS' | 'ERROR') => ActionResult;
  updateProfile: (data: ProfileUpdate) => ActionResult;
  acceptTerms: () => ActionResult;
  resetDemo: () => void;
  createListing: (listing: NewListing) => ActionResult;
  updateListing: (id: string, listing: Partial<NewListing>) => ActionResult;
  setListingStatus: (id: string, status: ListingStatus) => ActionResult;
  saveAvailability: (
    listingId: string,
    slots: AvailabilitySlot[],
  ) => ActionResult;
  createRequest: (
    listingId: string,
    startAt: string,
    endAt: string,
    message?: string,
  ) => ActionResult;
  cancelRequest: (id: string) => ActionResult;
  respondRequest: (id: string, accepted: boolean) => ActionResult;
  cancelReservation: (id: string, reason: string) => ActionResult;
  payRental: (
    id: string,
    methodId: string,
    outcome?: ProviderOutcome,
  ) => Promise<ActionResult>;
  holdGuarantee: (
    id: string,
    methodId: string,
    outcome?: ProviderOutcome,
  ) => Promise<ActionResult>;
  recordDelivery: (reservationId: string, evidence: Evidence[]) => ActionResult;
  confirmReceipt: (loanId: string) => ActionResult;
  requestExtension: (loanId: string, endAt: string) => ActionResult;
  respondExtension: (loanId: string, accepted: boolean) => ActionResult;
  payExtension: (
    loanId: string,
    methodId: string,
    outcome?: ProviderOutcome,
  ) => Promise<ActionResult>;
  proposeReschedule: (loanId: string, endAt: string) => ActionResult;
  respondReschedule: (loanId: string, accepted: boolean) => ActionResult;
  recordReturn: (
    loanId: string,
    early: boolean,
    notes: string,
    evidence: Evidence[],
  ) => ActionResult;
  confirmReturn: (loanId: string) => ActionResult;
  reportIncident: (
    loanId: string,
    type: Incident['type'],
    description: string,
    evidence: Evidence[],
  ) => ActionResult;
  submitCounterpartyStatement: (
    incidentId: string,
    statement: string,
  ) => ActionResult;
  startIncidentReview: (incidentId: string) => ActionResult;
  addIncidentAdminNote: (incidentId: string, text: string) => ActionResult;
  resolveIncident: (
    id: string,
    decision: IncidentDecision,
    amount: number,
    justification: string,
  ) => ActionResult;
  saveAnalysis: (analysis: EvidenceAnalysis) => void;
  rateLoan: (loanId: string, stars: number, comment: string) => ActionResult;
  markNotification: (id?: string) => void;
}

interface DemoContextValue extends DemoActions {
  state: DemoState;
  hydrated: boolean;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function loadStoredState(): DemoState | null {
  try {
    const stored = localStorage.getItem(appConfig.storageKeys.state);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as DemoState;
    return parsed.version === 4 ? parsed : null;
  } catch {
    return null;
  }
}

function refreshDerived(state: DemoState): DemoState {
  const moment = now();
  const overdue = state.loans.filter((loan) =>
    shouldMarkOverdue(loan.status, loan.currentReturnAt, moment),
  );
  if (!overdue.length) return state;
  const ids = new Set(overdue.map((loan) => loan.id));
  return {
    ...state,
    loans: state.loans.map((loan) =>
      ids.has(loan.id)
        ? {
            ...loan,
            status: 'OVERDUE',
            timeline: [...loan.timeline, timelineEvent('LOAN_OVERDUE')],
          }
        : loan,
    ),
    notifications: [
      ...overdue.flatMap((loan) => {
        const item = state.listings.find((l) => l.id === loan.listingId)?.title;
        return [loan.borrowerId, loan.lenderId].map((userId) =>
          notice(userId, 'LOAN_OVERDUE', `/loans/${loan.id}`, { item }),
        );
      }),
      ...state.notifications,
    ],
  };
}

function settleHold(
  transactions: PaymentTransaction[],
  reservationId: string,
  status: PaymentTransaction['status'],
) {
  return transactions.map((item) =>
    item.type === 'GUARANTEE_HOLD' &&
    item.reservationId === reservationId &&
    item.status === 'HELD'
      ? { ...item, status }
      : item,
  );
}

function persistState(state: DemoState) {
  try {
    localStorage.setItem(appConfig.storageKeys.state, JSON.stringify(state));
  } catch {
    return;
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createSeed);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);

  const commit = useCallback((next: DemoState) => {
    stateRef.current = next;
    setState(next);
    persistState(next);
  }, []);

  useEffect(() => {
    commit(refreshDerived(loadStoredState() ?? stateRef.current));
    setHydrated(true);
    const timer = setInterval(() => {
      const next = refreshDerived(stateRef.current);
      if (next !== stateRef.current) commit(next);
    }, 60_000);
    const syncTabs = (event: StorageEvent) => {
      if (event.key !== appConfig.storageKeys.state) return;
      const stored = loadStoredState();
      if (stored) {
        stateRef.current = stored;
        setState(stored);
      }
    };
    window.addEventListener('storage', syncTabs);
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', syncTabs);
    };
  }, [commit]);

  const read = () => stateRef.current;
  const me = () => currentUserOf(read());
  const listingTitle = (s: DemoState, listingId: string) =>
    s.listings.find((listing) => listing.id === listingId)?.title ?? '';
  const updateLoan = (
    s: DemoState,
    loanId: string,
    patch: (loan: Loan) => Loan,
  ) => s.loans.map((loan) => (loan.id === loanId ? patch(loan) : loan));

  const login = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      try {
        const session = await authProvider.signIn(
          email,
          password,
          read().users,
        );
        commit(
          refreshDerived({
            ...read(),
            currentUserId: session.uid,
            authenticated: true,
          }),
        );
        return success('results.auth.signedIn');
      } catch (error) {
        if (error instanceof AuthError)
          return failure(`auth.errors.${error.code}` as MessageKey);
        return failure('auth.errors.INVALID_CREDENTIALS');
      }
    },
    [commit],
  );

  const logout = useCallback(() => {
    authProvider.signOut();
    commit({ ...read(), authenticated: false });
  }, [commit]);

  const switchUser = useCallback(
    (id: string) =>
      commit({ ...read(), currentUserId: id, authenticated: true }),
    [commit],
  );

  const registerUser = useCallback(
    (data: RegisterUser): ActionResult => {
      const s = read();
      if (
        s.users.some(
          (user) => user.email.toLowerCase() === data.email.toLowerCase(),
        )
      )
        return failure('auth.errors.EMAIL_TAKEN');
      const university = universities.find(
        (item) => item.id === data.universityId,
      );
      if (!isInstitutionalEmail(data.email, university))
        return failure('auth.errors.EMAIL_NOT_INSTITUTIONAL');
      const id = uid('user');
      const initials = data.name
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      commit({
        ...s,
        currentUserId: id,
        authenticated: true,
        users: [
          ...s.users,
          {
            ...data,
            id,
            firstName: data.name.split(/\s+/)[0],
            initials,
            verified: false,
            verificationStatus: 'PENDING',
            role: 'STUDENT',
            accountStatus: 'ACTIVE',
          },
        ],
      });
      return success('results.auth.registered', id);
    },
    [commit],
  );

  const setVerification = useCallback(
    (status: User['verificationStatus'], verified?: boolean) => {
      const s = read();
      commit({
        ...s,
        users: s.users.map((user) =>
          user.id === s.currentUserId
            ? {
                ...user,
                verificationStatus: status,
                verified: verified ?? user.verified,
              }
            : user,
        ),
      });
    },
    [commit],
  );

  const requestVerification = useCallback(async (): Promise<ActionResult> => {
    const user = me();
    if (!user || user.verified)
      return failure('results.verification.notAllowed');
    setVerification('SENDING');
    await new Promise((resolve) => setTimeout(resolve, 600));
    setVerification('SENT');
    return success('results.verification.sent');
  }, [setVerification]);

  const completeVerification = useCallback(
    (outcome: 'SUCCESS' | 'ERROR'): ActionResult => {
      const user = me();
      if (!user) return failure('results.verification.notAllowed');
      const university = universities.find(
        (item) => item.id === user.universityId,
      );
      if (
        outcome === 'ERROR' ||
        !isInstitutionalEmail(user.email, university)
      ) {
        setVerification('ERROR', false);
        return failure('results.verification.failed');
      }
      setVerification('VERIFIED', true);
      return success('results.verification.verified');
    },
    [setVerification],
  );

  const updateProfile = useCallback(
    (data: ProfileUpdate): ActionResult => {
      const s = read();
      commit({
        ...s,
        users: s.users.map((user) =>
          user.id === s.currentUserId ? { ...user, ...data } : user,
        ),
      });
      return success('results.profile.saved');
    },
    [commit],
  );

  const acceptTerms = useCallback((): ActionResult => {
    const s = read();
    if (!s.authenticated) return failure('results.terms.loginRequired');
    commit({
      ...s,
      termsAcceptances: [
        ...s.termsAcceptances.filter((item) => item.userId !== s.currentUserId),
        {
          userId: s.currentUserId,
          version: appConfig.termsVersion,
          acceptedAt: now(),
        },
      ],
    });
    return success('results.terms.accepted');
  }, [commit]);

  const resetDemo = useCallback(() => {
    const fresh = {
      ...refreshDerived(createSeed()),
      authenticated: true,
      currentUserId: read().currentUserId,
    };
    commit(fresh);
  }, [commit]);

  const operationGate = (s: DemoState): ActionResult | null => {
    const user = currentUserOf(s);
    if (!user?.verified) return failure('results.gate.verificationRequired');
    if (!termsAcceptedBy(s, user.id))
      return failure('results.gate.termsRequired');
    if (!canOperate(user, true)) return failure('results.gate.forbidden');
    return null;
  };

  const createListing = useCallback(
    (listing: NewListing): ActionResult => {
      const s = read();
      const blocked = operationGate(s);
      if (blocked) return blocked;
      if (listing.dailyRate <= 0) return failure('results.listing.invalidRate');
      const id = uid('listing');
      commit({
        ...s,
        listings: [
          {
            ...listing,
            id,
            ownerId: s.currentUserId,
            status: 'ACTIVE',
            createdAt: now(),
          },
          ...s.listings,
        ],
      });
      return success('results.listing.published', id);
    },
    [commit],
  );

  const updateListing = useCallback(
    (id: string, patch: Partial<NewListing>): ActionResult => {
      const s = read();
      const listing = s.listings.find((item) => item.id === id);
      if (!canManageListing(listing, s.currentUserId))
        return failure('results.gate.forbidden');
      if (patch.dailyRate !== undefined && patch.dailyRate <= 0)
        return failure('results.listing.invalidRate');
      commit({
        ...s,
        listings: s.listings.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      });
      return success('results.listing.updated', id);
    },
    [commit],
  );

  const setListingStatus = useCallback(
    (id: string, status: ListingStatus): ActionResult => {
      const s = read();
      const listing = s.listings.find((item) => item.id === id);
      if (!listing || !canManageListing(listing, s.currentUserId))
        return failure('results.gate.forbidden');
      if (listing.status === 'ARCHIVED')
        return failure('results.listing.archivedLocked');
      commit({
        ...s,
        listings: s.listings.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      });
      const messages: Record<ListingStatus, MessageKey> = {
        ACTIVE: 'results.listing.reactivated',
        PAUSED: 'results.listing.paused',
        ARCHIVED: 'results.listing.archived',
      };
      return success(messages[status]);
    },
    [commit],
  );

  const saveAvailability = useCallback(
    (listingId: string, slots: AvailabilitySlot[]): ActionResult => {
      const s = read();
      const listing = s.listings.find((item) => item.id === listingId);
      if (!listing || !canManageListing(listing, s.currentUserId))
        return failure('results.gate.forbidden');
      const available = slots.filter((slot) => slot.status === 'AVAILABLE');
      if (
        available.some((slot) => new Date(slot.endAt) <= new Date(slot.startAt))
      )
        return failure('results.availability.invalidRange');
      const reserved = listing.availabilitySlots.filter(
        (slot) => slot.status === 'RESERVED',
      );
      if (
        available.some((slot) =>
          hasReservationCollision(reserved, slot.startAt, slot.endAt),
        )
      )
        return failure('results.availability.overlapsReservation');
      const overlapping = available.some((slot, index) =>
        available.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            overlaps(slot.startAt, slot.endAt, other.startAt, other.endAt),
        ),
      );
      if (overlapping) return failure('results.availability.overlapsItself');
      commit({
        ...s,
        listings: s.listings.map((item) =>
          item.id === listingId
            ? { ...item, availabilitySlots: [...reserved, ...available] }
            : item,
        ),
      });
      return success('results.availability.saved');
    },
    [commit],
  );

  const createRequest = useCallback(
    (
      listingId: string,
      startAt: string,
      endAt: string,
      message?: string,
    ): ActionResult => {
      const s = read();
      const listing = s.listings.find((item) => item.id === listingId);
      if (!listing || listing.status !== 'ACTIVE')
        return failure('results.request.listingUnavailable');
      if (!canRequestListing(listing, s.currentUserId))
        return failure('results.request.ownListing');
      const blocked = operationGate(s);
      if (blocked) return blocked;
      if (new Date(endAt) <= new Date(startAt))
        return failure('results.request.invalidRange');
      if (new Date(startAt) <= new Date())
        return failure('results.request.pastStart');
      if (!isPeriodAvailable(listing.availabilitySlots, startAt, endAt))
        return failure('results.request.periodUnavailable');
      const id = uid('request');
      commit({
        ...s,
        requests: [
          {
            id,
            listingId,
            borrowerId: s.currentUserId,
            lenderId: listing.ownerId,
            startAt,
            endAt,
            message: message?.trim() || undefined,
            status: 'PENDING',
            createdAt: now(),
            snapshot: createTermsSnapshot(listing, startAt, endAt),
          },
          ...s.requests,
        ],
        notifications: [
          notice(listing.ownerId, 'REQUEST_CREATED', '/requests', {
            item: listing.title,
          }),
          ...s.notifications,
        ],
      });
      return success('results.request.created', id);
    },
    [commit],
  );

  const cancelRequest = useCallback(
    (id: string): ActionResult => {
      const s = read();
      const request = s.requests.find((item) => item.id === id);
      if (
        !request ||
        request.status !== 'PENDING' ||
        request.borrowerId !== s.currentUserId
      )
        return failure('results.gate.forbidden');
      commit({
        ...s,
        requests: s.requests.map((item) =>
          item.id === id
            ? { ...item, status: 'CANCELLED', respondedAt: now() }
            : item,
        ),
        notifications: [
          notice(request.lenderId, 'REQUEST_CANCELLED', '/requests', {
            item: listingTitle(s, request.listingId),
          }),
          ...s.notifications,
        ],
      });
      return success('results.request.cancelled');
    },
    [commit],
  );

  const respondRequest = useCallback(
    (id: string, accepted: boolean): ActionResult => {
      const s = read();
      const request = s.requests.find((item) => item.id === id);
      if (
        !request ||
        request.status !== 'PENDING' ||
        request.lenderId !== s.currentUserId
      )
        return failure('results.gate.forbidden');
      const listing = s.listings.find((item) => item.id === request.listingId);
      const item = listing?.title ?? '';
      if (!accepted) {
        commit({
          ...s,
          requests: s.requests.map((r) =>
            r.id === id ? { ...r, status: 'REJECTED', respondedAt: now() } : r,
          ),
          notifications: [
            notice(request.borrowerId, 'REQUEST_REJECTED', '/requests', {
              item,
            }),
            ...s.notifications,
          ],
        });
        return success('results.request.rejected');
      }
      if (!listing) return failure('results.request.listingUnavailable');
      if (accepted && !termsAcceptedBy(s, s.currentUserId))
        return failure('results.gate.termsRequired');
      if (
        !isPeriodAvailable(
          listing.availabilitySlots,
          request.startAt,
          request.endAt,
        )
      )
        return failure('results.request.periodTaken');
      const reservationId = uid('reservation');
      const snapshot = { ...request.snapshot };
      commit({
        ...s,
        requests: s.requests.map((r) =>
          r.id === id ? { ...r, status: 'ACCEPTED', respondedAt: now() } : r,
        ),
        reservations: [
          {
            id: reservationId,
            requestId: id,
            listingId: request.listingId,
            borrowerId: request.borrowerId,
            lenderId: request.lenderId,
            status: 'CONFIRMED',
            paymentStatus: 'PENDING',
            guaranteeStatus:
              snapshot.guaranteeAmount > 0 ? 'PENDING' : 'NOT_REQUIRED',
            deliveryRecorded: false,
            createdAt: now(),
            snapshot,
          },
          ...s.reservations,
        ],
        listings: s.listings.map((l) =>
          l.id === request.listingId
            ? {
                ...l,
                availabilitySlots: replaceReservedInterval(
                  l.availabilitySlots,
                  reservationId,
                  request.startAt,
                  request.endAt,
                ),
              }
            : l,
        ),
        reminders: [
          reminder({
            userId: request.borrowerId,
            operationId: reservationId,
            listingId: request.listingId,
            kind: 'PAYMENT_DUE',
            dueAt: request.startAt,
            href: `/reservations/${reservationId}`,
          }),
          reminder({
            userId: request.lenderId,
            operationId: reservationId,
            listingId: request.listingId,
            kind: 'DELIVERY',
            dueAt: request.startAt,
            href: `/reservations/${reservationId}`,
          }),
          ...s.reminders,
        ],
        notifications: [
          notice(
            request.borrowerId,
            'REQUEST_ACCEPTED',
            `/reservations/${reservationId}`,
            { item },
          ),
          ...s.notifications,
        ],
      });
      return success('results.request.accepted', reservationId);
    },
    [commit],
  );

  const cancelReservation = useCallback(
    (id: string, reason: string): ActionResult => {
      const s = read();
      const reservation = s.reservations.find((item) => item.id === id);
      if (!reservation || !isParticipant(reservation, s.currentUserId))
        return failure('results.gate.forbidden');
      if (!canCancelReservation(reservation))
        return failure('results.reservation.cancelNotAllowed');
      if (!reason.trim()) return failure('results.reservation.reasonRequired');
      const actor =
        s.currentUserId === reservation.lenderId ? 'LENDER' : 'BORROWER';
      const refund = cancellationRefund(reservation, actor);
      const counterpart = counterpartOf(reservation, s.currentUserId);
      const item = listingTitle(s, reservation.listingId);
      const refunds: PaymentTransaction[] = [
        ...(refund.rentalRefund > 0
          ? [
              transaction({
                userId: reservation.borrowerId,
                reservationId: id,
                type: 'REFUND',
                amount: refund.rentalRefund,
                method: reservation.paymentMethod ?? '',
                status: 'REFUNDED',
              }),
            ]
          : []),
        ...(refund.guaranteeRelease > 0
          ? [
              transaction({
                userId: reservation.borrowerId,
                reservationId: id,
                type: 'GUARANTEE_RELEASE',
                amount: refund.guaranteeRelease,
                method: reservation.guaranteePaymentMethod ?? '',
                status: 'RELEASED',
              }),
            ]
          : []),
      ];
      commit({
        ...s,
        reservations: s.reservations.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'CANCELLED',
                paymentStatus:
                  refund.rentalRefund > 0
                    ? 'REFUNDED'
                    : r.paymentStatus === 'PENDING_RELEASE'
                      ? 'REFUNDED'
                      : 'CANCELLED',
                guaranteeStatus:
                  refund.guaranteeRelease > 0
                    ? 'RELEASED'
                    : r.guaranteeStatus === 'NOT_REQUIRED'
                      ? 'NOT_REQUIRED'
                      : 'CANCELLED',
                cancelledAt: now(),
                cancelledBy: s.currentUserId,
                cancellationReason: reason.trim(),
              }
            : r,
        ),
        listings: s.listings.map((l) =>
          l.id === reservation.listingId
            ? {
                ...l,
                availabilitySlots: l.availabilitySlots.filter(
                  (slot) => slot.reservationId !== id,
                ),
              }
            : l,
        ),
        transactions: refund.guaranteeRelease
          ? settleHold([...refunds, ...s.transactions], id, 'RELEASED')
          : [...refunds, ...s.transactions],
        reminders: removeOperationReminders(s.reminders, id),
        notifications: [
          notice(counterpart, 'RESERVATION_CANCELLED', `/reservations/${id}`, {
            item,
            reason: reason.trim(),
          }),
          ...s.notifications,
        ],
      });
      return success('results.reservation.cancelled');
    },
    [commit],
  );

  const payRental = useCallback(
    async (
      id: string,
      methodId: string,
      outcome?: ProviderOutcome,
    ): Promise<ActionResult> => {
      const initial = read().reservations.find((item) => item.id === id);
      if (
        !initial ||
        initial.borrowerId !== read().currentUserId ||
        initial.status !== 'CONFIRMED'
      )
        return failure('results.gate.forbidden');
      if (!canRetryPayment(initial.paymentStatus))
        return failure('results.payment.alreadyPaid');
      if (
        initial.snapshot.guaranteeAmount > 0 &&
        initial.guaranteeStatus !== 'HELD'
      )
        return failure('results.payment.guaranteeFirst');
      const charge = await paymentsService.charge('RENTAL', outcome);
      const s = read();
      const reservation = s.reservations.find((item) => item.id === id);
      if (!reservation || !canRetryPayment(reservation.paymentStatus))
        return failure('results.payment.alreadyPaid');
      const status = paymentStatusFromOutcome(charge.outcome);
      const amount = economicBreakdown(reservation.snapshot).rentalCharge;
      const approved = status === 'PENDING_RELEASE';
      const item = listingTitle(s, reservation.listingId);
      commit({
        ...s,
        reservations: s.reservations.map((r) =>
          r.id === id
            ? { ...r, paymentStatus: status, paymentMethod: methodId }
            : r,
        ),
        transactions: [
          transaction({
            userId: reservation.borrowerId,
            reservationId: id,
            type: 'RENTAL_PAYMENT',
            amount,
            method: methodId,
            status,
            providerReference: charge.reference,
          }),
          ...s.transactions,
        ],
        notifications: [
          approved
            ? notice(
                reservation.lenderId,
                'PAYMENT_CONFIRMED',
                `/reservations/${id}`,
                { item },
              )
            : notice(
                reservation.borrowerId,
                'PAYMENT_FAILED',
                `/reservations/${id}/checkout`,
                { item },
              ),
          ...s.notifications,
        ],
        reminders:
          approved &&
          isPaymentSettled({ ...reservation, paymentStatus: status })
            ? s.reminders.filter(
                (r) => !(r.operationId === id && r.kind === 'PAYMENT_DUE'),
              )
            : s.reminders,
      });
      return approved
        ? success('results.payment.approved')
        : failure(`results.payment.${charge.outcome}` as MessageKey);
    },
    [commit],
  );

  const holdGuarantee = useCallback(
    async (
      id: string,
      methodId: string,
      outcome?: ProviderOutcome,
    ): Promise<ActionResult> => {
      const initial = read().reservations.find((item) => item.id === id);
      if (
        !initial ||
        initial.borrowerId !== read().currentUserId ||
        initial.status !== 'CONFIRMED'
      )
        return failure('results.gate.forbidden');
      if (!['PENDING', 'FAILED', 'CANCELLED'].includes(initial.guaranteeStatus))
        return failure('results.payment.guaranteeAlreadyHeld');
      const charge = await paymentsService.charge('GUARANTEE', outcome);
      const s = read();
      const reservation = s.reservations.find((item) => item.id === id);
      if (!reservation) return failure('results.gate.forbidden');
      const status = guaranteeStatusFromOutcome(charge.outcome);
      const approved = status === 'HELD';
      const item = listingTitle(s, reservation.listingId);
      commit({
        ...s,
        reservations: s.reservations.map((r) =>
          r.id === id
            ? {
                ...r,
                guaranteeStatus: status,
                guaranteePaymentMethod: methodId,
              }
            : r,
        ),
        transactions: [
          transaction({
            userId: reservation.borrowerId,
            reservationId: id,
            type: 'GUARANTEE_HOLD',
            amount: reservation.snapshot.guaranteeAmount,
            method: methodId,
            status,
            providerReference: charge.reference,
          }),
          ...s.transactions,
        ],
        notifications: [
          approved
            ? notice(
                reservation.lenderId,
                'GUARANTEE_HELD',
                `/reservations/${id}`,
                { item },
              )
            : notice(
                reservation.borrowerId,
                'GUARANTEE_FAILED',
                `/reservations/${id}/checkout`,
                { item },
              ),
          ...s.notifications,
        ],
        reminders:
          approved &&
          isPaymentSettled({ ...reservation, guaranteeStatus: status })
            ? s.reminders.filter(
                (r) => !(r.operationId === id && r.kind === 'PAYMENT_DUE'),
              )
            : s.reminders,
      });
      return approved
        ? success('results.payment.guaranteeHeld')
        : failure(`results.payment.${charge.outcome}` as MessageKey);
    },
    [commit],
  );

  const recordDelivery = useCallback(
    (reservationId: string, evidence: Evidence[]): ActionResult => {
      const s = read();
      const reservation = s.reservations.find(
        (item) => item.id === reservationId,
      );
      if (!reservation || reservation.lenderId !== s.currentUserId)
        return failure('results.gate.forbidden');
      if (reservation.status !== 'CONFIRMED' || reservation.deliveryRecorded)
        return failure('results.delivery.notAllowed');
      if (reservation.paymentStatus !== 'PENDING_RELEASE')
        return failure('results.delivery.paymentRequired');
      if (!isPaymentSettled(reservation))
        return failure('results.delivery.guaranteeRequired');
      const loanId = uid('loan');
      const deliveredAt = now();
      const item = listingTitle(s, reservation.listingId);
      const loan: Loan = {
        id: loanId,
        reservationId,
        listingId: reservation.listingId,
        borrowerId: reservation.borrowerId,
        lenderId: reservation.lenderId,
        status: 'PENDING_RECEIPT',
        paymentStatus: reservation.paymentStatus,
        guaranteeStatus: reservation.guaranteeStatus,
        snapshot: { ...reservation.snapshot },
        deliveredAt,
        currentReturnAt: reservation.snapshot.endAt,
        originalReturnAt: reservation.snapshot.originalEndAt,
        extensions: [],
        reschedules: [],
        evidence: evidence.map((entry) => ({ ...entry, phase: 'INITIAL' })),
        timeline: [
          timelineEvent('DELIVERY_RECORDED'),
          timelineEvent('RECEIPT_PENDING', false),
        ],
        ratedBy: [],
      };
      commit({
        ...s,
        reservations: s.reservations.map((r) =>
          r.id === reservationId
            ? { ...r, deliveryRecorded: true, deliveredAt }
            : r,
        ),
        loans: [loan, ...s.loans],
        reminders: [
          reminder({
            userId: reservation.borrowerId,
            operationId: loanId,
            listingId: reservation.listingId,
            kind: 'RECEIPT',
            dueAt: deliveredAt,
            href: `/loans/${loanId}`,
          }),
          ...removeOperationReminders(s.reminders, reservationId),
        ],
        notifications: [
          notice(
            reservation.borrowerId,
            'DELIVERY_REGISTERED',
            `/loans/${loanId}`,
            { item },
          ),
          ...s.notifications,
        ],
      });
      return success('results.delivery.recorded', loanId);
    },
    [commit],
  );

  const confirmReceipt = useCallback(
    (loanId: string): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      if (
        !loan ||
        loan.status !== 'PENDING_RECEIPT' ||
        loan.borrowerId !== s.currentUserId
      )
        return failure('results.gate.forbidden');
      const confirmedAt = now();
      const amounts = economicBreakdown(loan.snapshot);
      const item = listingTitle(s, loan.listingId);
      commit({
        ...s,
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          status: 'ACTIVE',
          paymentStatus: 'RELEASED',
          receiptConfirmedAt: confirmedAt,
          timeline: [
            ...l.timeline.filter((event) => event.event !== 'RECEIPT_PENDING'),
            timelineEvent('RECEIPT_CONFIRMED'),
          ],
        })),
        reservations: s.reservations.map((r) =>
          r.id === loan.reservationId
            ? {
                ...r,
                status: 'ACTIVATED',
                paymentStatus: 'RELEASED',
                receiptConfirmedAt: confirmedAt,
              }
            : r,
        ),
        transactions: [
          transaction({
            userId: loan.lenderId,
            loanId,
            reservationId: loan.reservationId,
            type: 'RENTAL_RELEASE',
            amount: amounts.lenderPayout,
            method: 'account_money',
            status: 'RELEASED',
          }),
          ...s.transactions.map((tx) =>
            tx.reservationId === loan.reservationId &&
            tx.type === 'RENTAL_PAYMENT' &&
            tx.status === 'PENDING_RELEASE'
              ? {
                  ...tx,
                  status: 'RELEASED' as const,
                  updatedAt: confirmedAt,
                  loanId,
                }
              : tx,
          ),
        ],
        reminders: [
          reminder({
            userId: loan.borrowerId,
            operationId: loanId,
            listingId: loan.listingId,
            kind: 'RETURN',
            dueAt: loan.currentReturnAt,
            href: `/loans/${loanId}`,
          }),
          reminder({
            userId: loan.lenderId,
            operationId: loanId,
            listingId: loan.listingId,
            kind: 'RETURN_RECEIPT',
            dueAt: loan.currentReturnAt,
            href: `/loans/${loanId}`,
          }),
          ...s.reminders.filter(
            (r) => !(r.operationId === loanId && r.kind === 'RECEIPT'),
          ),
        ],
        notifications: [
          notice(loan.lenderId, 'RECEIPT_CONFIRMED', `/loans/${loanId}`, {
            item,
          }),
          notice(loan.lenderId, 'RENTAL_RELEASED', '/transactions', { item }),
          ...s.notifications,
        ],
      });
      return success('results.loan.receiptConfirmed');
    },
    [commit],
  );

  const otherReservationCollision = (
    s: DemoState,
    loan: Loan,
    endAt: string,
  ) => {
    const listing = s.listings.find((item) => item.id === loan.listingId);
    return (
      !listing ||
      hasReservationCollision(
        listing.availabilitySlots,
        loan.snapshot.startAt,
        endAt,
        loan.reservationId,
      )
    );
  };

  const applyReturnDate = (
    s: DemoState,
    loan: Loan,
    endAt: string,
  ): Partial<DemoState> => ({
    listings: s.listings.map((listing) =>
      listing.id === loan.listingId
        ? {
            ...listing,
            availabilitySlots: replaceReservedInterval(
              listing.availabilitySlots,
              loan.reservationId,
              loan.snapshot.startAt,
              endAt,
            ),
          }
        : listing,
    ),
    reminders: updateReturnReminders(s.reminders, loan.id, endAt),
  });

  const requestExtension = useCallback(
    (loanId: string, endAt: string): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      if (!loan || loan.borrowerId !== s.currentUserId)
        return failure('results.gate.forbidden');
      if (
        loan.status !== 'ACTIVE' ||
        new Date(loan.currentReturnAt) <= new Date()
      )
        return failure('results.extension.notActive');
      if (
        loan.extensions.some((ext) =>
          ['PENDING', 'PAYMENT_PENDING'].includes(ext.status),
        )
      )
        return failure('results.extension.alreadyPending');
      if (new Date(endAt) <= new Date(loan.currentReturnAt))
        return failure('results.extension.mustBeLater');
      if (otherReservationCollision(s, loan, endAt))
        return failure('results.extension.overlaps');
      commit({
        ...s,
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          extensions: [
            ...l.extensions,
            {
              id: uid('extension'),
              requesterId: l.borrowerId,
              requestedAt: now(),
              originalReturnAt: l.currentReturnAt,
              proposedReturnAt: endAt,
              additionalCost: extensionCost(
                l.currentReturnAt,
                endAt,
                l.snapshot.dailyRate,
              ),
              status: 'PENDING',
            },
          ],
        })),
        notifications: [
          notice(loan.lenderId, 'EXTENSION_REQUESTED', `/loans/${loanId}`, {
            item: listingTitle(s, loan.listingId),
          }),
          ...s.notifications,
        ],
      });
      return success('results.extension.requested');
    },
    [commit],
  );

  const respondExtension = useCallback(
    (loanId: string, accepted: boolean): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      const pending = loan?.extensions.find((ext) => ext.status === 'PENDING');
      if (!loan || !pending || loan.lenderId !== s.currentUserId)
        return failure('results.gate.forbidden');
      if (
        accepted &&
        otherReservationCollision(s, loan, pending.proposedReturnAt)
      )
        return failure('results.extension.overlaps');
      const status = !accepted
        ? 'REJECTED'
        : pending.additionalCost > 0
          ? 'PAYMENT_PENDING'
          : 'ACCEPTED';
      const applyNow = status === 'ACCEPTED';
      const event: NotificationEvent =
        status === 'REJECTED'
          ? 'EXTENSION_REJECTED'
          : status === 'PAYMENT_PENDING'
            ? 'EXTENSION_ACCEPTED_PAYMENT_PENDING'
            : 'EXTENSION_ACCEPTED';
      commit({
        ...s,
        ...(applyNow ? applyReturnDate(s, loan, pending.proposedReturnAt) : {}),
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          currentReturnAt: applyNow
            ? pending.proposedReturnAt
            : l.currentReturnAt,
          extensions: l.extensions.map((ext) =>
            ext.id === pending.id
              ? {
                  ...ext,
                  status,
                  respondedAt: now(),
                  paymentStatus:
                    status === 'PAYMENT_PENDING' ? 'PENDING' : undefined,
                  resultingReturnAt:
                    status === 'REJECTED'
                      ? l.currentReturnAt
                      : applyNow
                        ? ext.proposedReturnAt
                        : undefined,
                }
              : ext,
          ),
        })),
        notifications: [
          notice(loan.borrowerId, event, `/loans/${loanId}`, {
            item: listingTitle(s, loan.listingId),
          }),
          ...s.notifications,
        ],
      });
      return success(
        status === 'REJECTED'
          ? 'results.extension.rejected'
          : status === 'PAYMENT_PENDING'
            ? 'results.extension.acceptedPaymentPending'
            : 'results.extension.accepted',
      );
    },
    [commit],
  );

  const payExtension = useCallback(
    async (
      loanId: string,
      methodId: string,
      outcome?: ProviderOutcome,
    ): Promise<ActionResult> => {
      const initial = read().loans.find((item) => item.id === loanId);
      if (!initial || initial.borrowerId !== read().currentUserId)
        return failure('results.gate.forbidden');
      const charge = await paymentsService.charge('EXTENSION', outcome);
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      const payable = loan?.extensions.find(
        (ext) => ext.status === 'PAYMENT_PENDING',
      );
      if (!loan || !payable) return failure('results.extension.nothingToPay');
      if (otherReservationCollision(s, loan, payable.proposedReturnAt))
        return failure('results.extension.overlaps');
      const approved = charge.outcome === 'APPROVED';
      const paymentTx = transaction({
        userId: loan.borrowerId,
        loanId,
        reservationId: loan.reservationId,
        type: 'EXTENSION_PAYMENT',
        amount: payable.additionalCost,
        method: methodId,
        status: approved
          ? 'RELEASED'
          : paymentStatusFromOutcome(charge.outcome),
        providerReference: charge.reference,
      });
      if (!approved) {
        commit({
          ...s,
          loans: updateLoan(s, loanId, (l) => ({
            ...l,
            extensions: l.extensions.map((ext) =>
              ext.id === payable.id
                ? {
                    ...ext,
                    paymentStatus: paymentStatusFromOutcome(charge.outcome),
                    paymentMethod: methodId,
                  }
                : ext,
            ),
          })),
          transactions: [paymentTx, ...s.transactions],
        });
        return failure(`results.payment.${charge.outcome}` as MessageKey);
      }
      commit({
        ...s,
        ...applyReturnDate(s, loan, payable.proposedReturnAt),
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          currentReturnAt: payable.proposedReturnAt,
          extensions: l.extensions.map((ext) =>
            ext.id === payable.id
              ? {
                  ...ext,
                  status: 'ACCEPTED',
                  paymentStatus: 'RELEASED',
                  paymentMethod: methodId,
                  resultingReturnAt: ext.proposedReturnAt,
                }
              : ext,
          ),
        })),
        transactions: [paymentTx, ...s.transactions],
        notifications: [
          notice(
            loan.lenderId,
            'EXTENSION_PAYMENT_CONFIRMED',
            `/loans/${loanId}`,
            { item: listingTitle(s, loan.listingId) },
          ),
          ...s.notifications,
        ],
      });
      return success('results.extension.paid');
    },
    [commit],
  );

  const proposeReschedule = useCallback(
    (loanId: string, endAt: string): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      if (!loan || loan.lenderId !== s.currentUserId)
        return failure('results.gate.forbidden');
      if (
        loan.status !== 'ACTIVE' ||
        new Date(loan.currentReturnAt) <= new Date()
      )
        return failure('results.reschedule.notActive');
      if (loan.reschedules.some((item) => item.status === 'PENDING'))
        return failure('results.reschedule.alreadyPending');
      if (new Date(endAt) <= new Date())
        return failure('results.reschedule.mustBeFuture');
      if (
        new Date(endAt).getTime() === new Date(loan.currentReturnAt).getTime()
      )
        return failure('results.reschedule.sameDate');
      if (otherReservationCollision(s, loan, endAt))
        return failure('results.reschedule.overlaps');
      commit({
        ...s,
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          reschedules: [
            ...l.reschedules,
            {
              id: uid('reschedule'),
              proposerId: l.lenderId,
              proposedAt: now(),
              originalReturnAt: l.currentReturnAt,
              proposedReturnAt: endAt,
              status: 'PENDING',
            },
          ],
        })),
        notifications: [
          notice(loan.borrowerId, 'RESCHEDULE_PROPOSED', `/loans/${loanId}`, {
            item: listingTitle(s, loan.listingId),
          }),
          ...s.notifications,
        ],
      });
      return success('results.reschedule.proposed');
    },
    [commit],
  );

  const respondReschedule = useCallback(
    (loanId: string, accepted: boolean): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      const pending = loan?.reschedules.find(
        (item) => item.status === 'PENDING',
      );
      if (!loan || !pending || loan.borrowerId !== s.currentUserId)
        return failure('results.gate.forbidden');
      if (
        accepted &&
        otherReservationCollision(s, loan, pending.proposedReturnAt)
      )
        return failure('results.reschedule.overlaps');
      commit({
        ...s,
        ...(accepted ? applyReturnDate(s, loan, pending.proposedReturnAt) : {}),
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          currentReturnAt: accepted
            ? pending.proposedReturnAt
            : l.currentReturnAt,
          reschedules: l.reschedules.map((item) =>
            item.id === pending.id
              ? {
                  ...item,
                  status: accepted ? 'ACCEPTED' : 'REJECTED',
                  respondedAt: now(),
                  resultingReturnAt: accepted
                    ? item.proposedReturnAt
                    : l.currentReturnAt,
                }
              : item,
          ),
        })),
        notifications: [
          notice(
            loan.lenderId,
            accepted ? 'RESCHEDULE_ACCEPTED' : 'RESCHEDULE_REJECTED',
            `/loans/${loanId}`,
            { item: listingTitle(s, loan.listingId) },
          ),
          ...s.notifications,
        ],
      });
      return success(
        accepted
          ? 'results.reschedule.accepted'
          : 'results.reschedule.rejected',
      );
    },
    [commit],
  );

  const recordReturn = useCallback(
    (
      loanId: string,
      early: boolean,
      notes: string,
      evidence: Evidence[],
    ): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      if (!loan || loan.borrowerId !== s.currentUserId)
        return failure('results.gate.forbidden');
      if (!['ACTIVE', 'OVERDUE'].includes(loan.status))
        return failure('results.return.notAllowed');
      if (notes.trim().length < 10)
        return failure('results.return.notesRequired');
      if (!evidence.length) return failure('results.return.evidenceRequired');
      const registeredAt = now();
      commit({
        ...s,
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          status: 'RETURN_RECORDED',
          earlyReturn: early,
          actualReturnAt: registeredAt,
          returnRecord: { registeredAt, early, notes: notes.trim() },
          evidence: [
            ...l.evidence,
            ...evidence.map((entry) => ({ ...entry, phase: 'FINAL' as const })),
          ],
          timeline: [
            ...l.timeline,
            timelineEvent(early ? 'EARLY_RETURN_RECORDED' : 'RETURN_RECORDED'),
            timelineEvent('RETURN_CONFIRMATION_PENDING', false),
          ],
        })),
        reminders: s.reminders.filter(
          (r) => !(r.operationId === loanId && r.kind === 'RETURN'),
        ),
        notifications: [
          notice(
            loan.lenderId,
            early ? 'EARLY_RETURN_REGISTERED' : 'RETURN_REGISTERED',
            `/loans/${loanId}`,
            { item: listingTitle(s, loan.listingId) },
          ),
          ...s.notifications,
        ],
      });
      return success('results.return.recorded');
    },
    [commit],
  );

  const finalizeGuarantee = (s: DemoState, loan: Loan, incidentId?: string) => {
    const available = remainingGuarantee(s.incidents, loan);
    const captured = loan.snapshot.guaranteeAmount - available;
    const status =
      loan.snapshot.guaranteeAmount === 0
        ? ('NOT_REQUIRED' as const)
        : captured === 0
          ? ('RELEASED' as const)
          : available === 0
            ? ('CAPTURED' as const)
            : ('PARTIALLY_CAPTURED' as const);
    const releaseTx =
      available > 0
        ? [
            transaction({
              userId: loan.borrowerId,
              loanId: loan.id,
              reservationId: loan.reservationId,
              incidentId,
              type: 'GUARANTEE_RELEASE',
              amount: available,
              method:
                s.reservations.find((r) => r.id === loan.reservationId)
                  ?.guaranteePaymentMethod ?? '',
              status: 'RELEASED',
            }),
          ]
        : [];
    return { status, releaseTx, released: available };
  };

  const completeLoan = (
    s: DemoState,
    loan: Loan,
    confirmedAt: string,
    incidentId?: string,
  ): DemoState => {
    const guarantee = finalizeGuarantee(s, loan, incidentId);
    const item = listingTitle(s, loan.listingId);
    return {
      ...s,
      loans: updateLoan(s, loan.id, (l) => ({
        ...l,
        status: 'COMPLETED',
        completedAt: confirmedAt,
        guaranteeStatus: guarantee.status,
        timeline: [
          ...l.timeline.map((event) => ({
            ...event,
            complete: true,
            at: event.at ?? confirmedAt,
          })),
          timelineEvent('LOAN_COMPLETED'),
        ],
      })),
      reservations: s.reservations.map((r) =>
        r.id === loan.reservationId
          ? { ...r, status: 'COMPLETED', guaranteeStatus: guarantee.status }
          : r,
      ),
      listings: s.listings.map((listing) =>
        listing.id === loan.listingId
          ? {
              ...listing,
              availabilitySlots: releaseFutureAvailability(
                listing.availabilitySlots,
                loan,
                confirmedAt,
              ),
            }
          : listing,
      ),
      transactions: settleHold(
        [...guarantee.releaseTx, ...s.transactions],
        loan.reservationId,
        guarantee.status,
      ),
      reminders: removeOperationReminders(s.reminders, loan.id),
      notifications: [
        notice(loan.borrowerId, 'LOAN_COMPLETED', `/loans/${loan.id}`, {
          item,
        }),
        notice(loan.lenderId, 'LOAN_COMPLETED', `/loans/${loan.id}`, { item }),
        ...s.notifications,
      ],
    };
  };

  const confirmReturn = useCallback(
    (loanId: string): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      if (
        !loan ||
        loan.status !== 'RETURN_RECORDED' ||
        loan.lenderId !== s.currentUserId
      )
        return failure('results.gate.forbidden');
      const unresolved = hasUnresolvedIncident(
        s.incidents
          .filter((incident) => incident.loanId === loanId)
          .map((incident) => incident.status),
      );
      const confirmedAt = now();
      const withConfirmation: DemoState = {
        ...s,
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          returnRecord: l.returnRecord
            ? { ...l.returnRecord, confirmedAt }
            : l.returnRecord,
          timeline: l.timeline.filter(
            (event) => event.event !== 'RETURN_CONFIRMATION_PENDING',
          ),
        })),
      };
      if (!unresolved) {
        const confirmedLoan = withConfirmation.loans.find(
          (item) => item.id === loanId,
        ) as Loan;
        commit(completeLoan(withConfirmation, confirmedLoan, confirmedAt));
        return success('results.return.confirmedCompleted');
      }
      commit({
        ...withConfirmation,
        loans: updateLoan(withConfirmation, loanId, (l) => ({
          ...l,
          status: statusAfterReturnConfirmation(true),
          guaranteeStatus: guaranteeAfterReturn(
            true,
            l.snapshot.guaranteeAmount,
          ),
          timeline: [
            ...l.timeline,
            timelineEvent('RETURN_CONFIRMED_PENDING_INCIDENT'),
          ],
        })),
        reminders: removeOperationReminders(s.reminders, loanId),
        notifications: [
          notice(
            loan.borrowerId,
            'RETURN_CONFIRMED_PENDING_INCIDENT',
            `/loans/${loanId}`,
            { item: listingTitle(s, loan.listingId) },
          ),
          ...s.notifications,
        ],
      });
      return success('results.return.confirmedPendingIncident');
    },
    [commit],
  );

  const reportIncident = useCallback(
    (
      loanId: string,
      type: Incident['type'],
      description: string,
      evidence: Evidence[],
    ): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      if (!loan || !isParticipant(loan, s.currentUserId))
        return failure('results.gate.forbidden');
      if (loan.status === 'COMPLETED')
        return failure('results.incident.loanClosed');
      if (description.trim().length < 20)
        return failure('results.incident.descriptionRequired');
      const id = `INC-${Math.floor(1000 + Math.random() * 8999)}`;
      const other = counterpartOf(loan, s.currentUserId);
      const admins = s.users.filter((user) => user.role === 'ADMIN');
      commit({
        ...s,
        incidents: [
          {
            id,
            loanId,
            type,
            description: description.trim(),
            evidence: evidence.map((entry) => ({
              ...entry,
              phase: 'INCIDENT' as const,
            })),
            reportedBy: s.currentUserId,
            status: 'OPEN',
            createdAt: now(),
            adminNotes: [],
            guaranteeAmount: loan.snapshot.guaranteeAmount,
          },
          ...s.incidents,
        ],
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          guaranteeStatus:
            l.snapshot.guaranteeAmount > 0 ? 'HELD' : l.guaranteeStatus,
        })),
        notifications: [
          notice(other, 'INCIDENT_CREATED', `/incidents/${id}`, {
            incidentId: id,
            item: listingTitle(s, loan.listingId),
          }),
          ...admins.map((admin) =>
            notice(admin.id, 'INCIDENT_ADMIN_NEW', `/admin/incidents/${id}`, {
              incidentId: id,
            }),
          ),
          ...s.notifications,
        ],
      });
      return success('results.incident.reported', id);
    },
    [commit],
  );

  const submitCounterpartyStatement = useCallback(
    (incidentId: string, statement: string): ActionResult => {
      const s = read();
      const incident = s.incidents.find((item) => item.id === incidentId);
      const loan = s.loans.find((item) => item.id === incident?.loanId);
      if (
        !incident ||
        !loan ||
        incident.status === 'RESOLVED' ||
        incident.reportedBy === s.currentUserId ||
        !isParticipant(loan, s.currentUserId)
      )
        return failure('results.gate.forbidden');
      if (statement.trim().length < 20)
        return failure('results.incident.statementRequired');
      commit({
        ...s,
        incidents: s.incidents.map((item) =>
          item.id === incidentId
            ? {
                ...item,
                counterpartyStatement: statement.trim(),
                counterpartyStatementAt: now(),
              }
            : item,
        ),
      });
      return success('results.incident.statementSaved');
    },
    [commit],
  );

  const isAdmin = (s: DemoState) => currentUserOf(s)?.role === 'ADMIN';

  const startIncidentReview = useCallback(
    (incidentId: string): ActionResult => {
      const s = read();
      const incident = s.incidents.find((item) => item.id === incidentId);
      const loan = s.loans.find((item) => item.id === incident?.loanId);
      if (!isAdmin(s) || incident?.status !== 'OPEN' || !loan)
        return failure('results.gate.forbidden');
      commit({
        ...s,
        incidents: s.incidents.map((item) =>
          item.id === incidentId
            ? {
                ...item,
                status: 'UNDER_REVIEW',
                reviewStartedAt: now(),
                reviewedBy: s.currentUserId,
              }
            : item,
        ),
        notifications: [
          ...[loan.borrowerId, loan.lenderId].map((userId) =>
            notice(
              userId,
              'INCIDENT_UNDER_REVIEW',
              `/incidents/${incidentId}`,
              { incidentId },
            ),
          ),
          ...s.notifications,
        ],
      });
      return success('results.incident.reviewStarted');
    },
    [commit],
  );

  const addIncidentAdminNote = useCallback(
    (incidentId: string, text: string): ActionResult => {
      const s = read();
      const incident = s.incidents.find((item) => item.id === incidentId);
      if (!isAdmin(s) || incident?.status !== 'UNDER_REVIEW')
        return failure('results.gate.forbidden');
      if (text.trim().length < 5)
        return failure('results.incident.noteRequired');
      commit({
        ...s,
        incidents: s.incidents.map((item) =>
          item.id === incidentId
            ? {
                ...item,
                adminNotes: [
                  ...item.adminNotes,
                  {
                    id: uid('admin-note'),
                    adminId: s.currentUserId,
                    text: text.trim(),
                    createdAt: now(),
                  },
                ],
              }
            : item,
        ),
      });
      return success('results.incident.noteSaved');
    },
    [commit],
  );

  const resolveIncident = useCallback(
    (
      id: string,
      decision: IncidentDecision,
      amount: number,
      justification: string,
    ): ActionResult => {
      const s = read();
      const incident = s.incidents.find((item) => item.id === id);
      const loan = s.loans.find((item) => item.id === incident?.loanId);
      if (!incident || !loan || !isAdmin(s))
        return failure('results.gate.forbidden');
      if (incident.status !== 'UNDER_REVIEW')
        return failure('results.incident.reviewRequired');
      if (justification.trim().length < 20)
        return failure('results.incident.justificationRequired');
      const available = remainingGuarantee(s.incidents, loan, id);
      if (decision === 'PARTIAL' && !validPartialCapture(amount, available))
        return failure('results.incident.invalidAmount');
      const captured =
        decision === 'TOTAL' ? available : decision === 'PARTIAL' ? amount : 0;
      const resolvedAt = now();
      const captureTx =
        captured > 0
          ? [
              transaction({
                userId: loan.borrowerId,
                loanId: loan.id,
                reservationId: loan.reservationId,
                incidentId: id,
                type:
                  captured >= available
                    ? 'GUARANTEE_CAPTURE'
                    : 'GUARANTEE_PARTIAL_CAPTURE',
                amount: captured,
                method:
                  s.reservations.find((r) => r.id === loan.reservationId)
                    ?.guaranteePaymentMethod ?? '',
                status:
                  captured >= available ? 'CAPTURED' : 'PARTIALLY_CAPTURED',
              }),
            ]
          : [];
      let next: DemoState = {
        ...s,
        incidents: s.incidents.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'RESOLVED',
                resolution: {
                  decision,
                  amount: captured,
                  refundedAmount: Math.max(0, available - captured),
                  justification: justification.trim(),
                  resolvedAt,
                  resolvedBy: s.currentUserId,
                },
              }
            : item,
        ),
        transactions: [...captureTx, ...s.transactions],
        notifications: [
          ...[loan.borrowerId, loan.lenderId].map((userId) =>
            notice(userId, 'INCIDENT_RESOLVED', `/incidents/${id}`, {
              incidentId: id,
            }),
          ),
          ...s.notifications,
        ],
      };
      const othersOpen = next.incidents.some(
        (item) => item.loanId === loan.id && item.status !== 'RESOLVED',
      );
      const objectLost =
        decision === 'TOTAL' && ['LOSS', 'NON_RETURN'].includes(incident.type);
      if (
        !othersOpen &&
        (loan.status === 'RETURN_CONFIRMED_PENDING_INCIDENT' || objectLost)
      ) {
        const current = next.loans.find((item) => item.id === loan.id) as Loan;
        next = completeLoan(next, current, resolvedAt, id);
      }
      commit(next);
      return success('results.incident.resolved');
    },
    [commit],
  );

  const saveAnalysis = useCallback(
    (analysis: EvidenceAnalysis) => {
      const s = read();
      commit({
        ...s,
        analyses: [
          ...s.analyses.filter((item) => item.loanId !== analysis.loanId),
          analysis,
        ],
      });
    },
    [commit],
  );

  const rateLoan = useCallback(
    (loanId: string, stars: number, comment: string): ActionResult => {
      const s = read();
      const loan = s.loans.find((item) => item.id === loanId);
      if (!loan) return failure('results.gate.forbidden');
      if (stars < 1 || stars > 5) return failure('results.rating.invalidStars');
      if (!mayRateLoan(loan, s.currentUserId))
        return failure(
          loan.ratedBy.includes(s.currentUserId)
            ? 'results.rating.alreadyRated'
            : 'results.rating.notAllowed',
        );
      const targetUserId = counterpartOf(loan, s.currentUserId);
      commit({
        ...s,
        ratings: [
          ...s.ratings,
          {
            id: uid('rating'),
            stars,
            comment: comment.trim(),
            authorId: s.currentUserId,
            targetUserId,
            loanId,
            createdAt: now(),
          },
        ],
        loans: updateLoan(s, loanId, (l) => ({
          ...l,
          ratedBy: [...l.ratedBy, s.currentUserId],
        })),
        notifications: [
          notice(targetUserId, 'RATING_RECEIVED', `/users/${targetUserId}`, {
            item: listingTitle(s, loan.listingId),
          }),
          ...s.notifications,
        ],
      });
      return success('results.rating.saved');
    },
    [commit],
  );

  const markNotification = useCallback(
    (id?: string) => {
      const s = read();
      commit({
        ...s,
        notifications: s.notifications.map((item) =>
          (!id || item.id === id) && item.userId === s.currentUserId
            ? { ...item, read: true }
            : item,
        ),
      });
    },
    [commit],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      hydrated,
      login,
      logout,
      switchUser,
      registerUser,
      requestVerification,
      completeVerification,
      updateProfile,
      acceptTerms,
      resetDemo,
      createListing,
      updateListing,
      setListingStatus,
      saveAvailability,
      createRequest,
      cancelRequest,
      respondRequest,
      cancelReservation,
      payRental,
      holdGuarantee,
      recordDelivery,
      confirmReceipt,
      requestExtension,
      respondExtension,
      payExtension,
      proposeReschedule,
      respondReschedule,
      recordReturn,
      confirmReturn,
      reportIncident,
      submitCounterpartyStatement,
      startIncidentReview,
      addIncidentAdminNote,
      resolveIncident,
      saveAnalysis,
      rateLoan,
      markNotification,
    }),
    [
      state,
      hydrated,
      login,
      logout,
      switchUser,
      registerUser,
      requestVerification,
      completeVerification,
      updateProfile,
      acceptTerms,
      resetDemo,
      createListing,
      updateListing,
      setListingStatus,
      saveAvailability,
      createRequest,
      cancelRequest,
      respondRequest,
      cancelReservation,
      payRental,
      holdGuarantee,
      recordDelivery,
      confirmReceipt,
      requestExtension,
      respondExtension,
      payExtension,
      proposeReschedule,
      respondReschedule,
      recordReturn,
      confirmReturn,
      reportIncident,
      submitCounterpartyStatement,
      startIncidentReview,
      addIncidentAdminNote,
      resolveIncident,
      saveAnalysis,
      rateLoan,
      markNotification,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}

export function useCurrentUser() {
  const { state } = useDemo();
  return currentUserOf(state);
}
