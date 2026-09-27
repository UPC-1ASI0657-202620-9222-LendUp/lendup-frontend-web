'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSeed } from '@/mocks/seed';
import { authService } from '@/services/domain-services';
import {
  canCancelReservation,
  economicBreakdown,
  extensionCost,
  hasUnresolvedIncident,
  isPeriodAvailable,
  releaseFutureAvailability,
} from '@/lib/business-rules';
import type {
  AvailabilitySlot,
  DemoState,
  Evidence,
  EvidenceAnalysis,
  Incident,
  IncidentDecision,
  Listing,
  Rating,
  TermsSnapshot,
  User,
} from '@/types/domain';

const STORAGE_KEY = 'lendup-demo-state-v2';
const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

type NewListing = Omit<Listing, 'id' | 'ownerId' | 'status'>;
const persistentEvidence = (evidence: Evidence[]) =>
  evidence.map((item) =>
    item.url?.startsWith('blob:')
      ? {
          ...item,
          url: item.type === 'PHOTO' ? '/images/camera.png' : undefined,
        }
      : item,
  );
const persistentListing = <T extends Partial<NewListing>>(listing: T): T => ({
  ...listing,
  ...(listing.image?.startsWith('blob:')
    ? { image: '/images/calculator.webp' }
    : {}),
  ...(listing.media
    ? {
        media: listing.media.map((item) => ({
          ...item,
          url: item.url.startsWith('blob:')
            ? item.type === 'PHOTO'
              ? '/images/calculator.webp'
              : '/images/camera.png'
            : item.url,
        })),
      }
    : {}),
});
type RegisterUser = Pick<
  User,
  | 'name'
  | 'email'
  | 'phone'
  | 'university'
  | 'campus'
  | 'career'
  | 'cycle'
  | 'password'
>;

interface DemoActions {
  switchUser: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerUser: (data: RegisterUser) => string;
  verifyCurrentUser: () => void;
  updateProfile: (
    data: Partial<
      Pick<User, 'avatar' | 'career' | 'cycle' | 'campus' | 'phone'>
    >,
  ) => void;
  acceptTerms: () => void;
  resetDemo: () => void;
  toggleListing: (id: string) => void;
  archiveListing: (id: string) => void;
  addListing: (listing: NewListing) => string;
  updateListing: (id: string, listing: Partial<NewListing>) => void;
  saveAvailability: (listingId: string, slots: AvailabilitySlot[]) => void;
  createRequest: (
    listingId: string,
    startAt: string,
    endAt: string,
  ) => { ok: boolean; id?: string; message?: string };
  cancelRequest: (id: string) => void;
  respondRequest: (id: string, accepted: boolean) => void;
  cancelReservation: (
    id: string,
    reason?: string,
  ) => { ok: boolean; message: string };
  payReservation: (id: string, method?: string) => void;
  holdGuarantee: (id: string) => void;
  recordDelivery: (
    id: string,
    evidence?: Evidence[],
  ) => { ok: boolean; message: string };
  confirmReceipt: (loanId: string) => void;
  requestExtension: (
    loanId: string,
    endAt: string,
  ) => { ok: boolean; message: string };
  respondExtension: (loanId: string, accepted: boolean) => void;
  proposeReschedule: (
    loanId: string,
    endAt: string,
  ) => { ok: boolean; message: string };
  respondReschedule: (loanId: string, accepted: boolean) => void;
  recordReturn: (
    loanId: string,
    early: boolean,
    notes: string,
    evidence?: Evidence[],
  ) => void;
  confirmReturn: (loanId: string) => void;
  reportIncident: (
    loanId: string,
    type: Incident['type'],
    description: string,
    evidence?: Evidence[],
  ) => string;
  saveAnalysis: (analysis: EvidenceAnalysis) => void;
  resolveIncident: (
    id: string,
    decision: IncidentDecision,
    amount: number,
    justification: string,
  ) => { ok: boolean; message: string };
  rateLoan: (
    loanId: string,
    stars: number,
    comment: string,
  ) => { ok: boolean; message: string };
  markNotification: (id?: string) => void;
  mockRefreshDerivedStatuses: () => void;
}

interface DemoContextValue extends DemoActions {
  state: DemoState;
  hydrated: boolean;
}
const DemoContext = createContext<DemoContextValue | null>(null);

const notice = (
  userId: string,
  title: string,
  message: string,
  href: string,
) => ({
  id: uid('notification'),
  userId,
  title,
  message,
  createdAt: 'Ahora',
  read: false,
  href,
});
const tx = (
  userId: string,
  loanId: string,
  type: DemoState['transactions'][number]['type'],
  amount: number,
  method: string,
  status: DemoState['transactions'][number]['status'],
  reservationId?: string,
) => ({
  id: uid('tx'),
  userId,
  loanId,
  reservationId,
  date: now(),
  type,
  amount,
  method,
  status,
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createSeed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DemoState;
        if (parsed.version === 2) setState(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const switchUser = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        currentUserId: id,
        authenticated: true,
        termsAccepted: s.termsAcceptances.some((a) => a.userId === id),
      })),
    [],
  );
  const login = useCallback(
    async (email: string, password: string) => {
      const user = await authService.login(state, email, password);
      setState((s) => ({
        ...s,
        currentUserId: user.id,
        authenticated: true,
        termsAccepted: s.termsAcceptances.some((a) => a.userId === user.id),
      }));
    },
    [state],
  );
  const logout = useCallback(
    () => setState((s) => ({ ...s, authenticated: false })),
    [],
  );
  const registerUser = useCallback((data: RegisterUser) => {
    const id = uid('user');
    const initials = data.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    setState((s) => ({
      ...s,
      currentUserId: id,
      authenticated: true,
      termsAccepted: false,
      users: [
        ...s.users,
        {
          ...data,
          id,
          firstName: data.name.split(' ')[0],
          initials,
          rating: 0,
          ratingCount: 0,
          completedLoans: 0,
          verified: false,
          verificationStatus: 'PENDING',
          role: 'STUDENT',
          accountStatus: 'ACTIVE',
        },
      ],
    }));
    return id;
  }, []);
  const verifyCurrentUser = useCallback(
    () =>
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === s.currentUserId
            ? { ...u, verified: true, verificationStatus: 'VERIFIED' }
            : u,
        ),
      })),
    [],
  );
  const updateProfile = useCallback(
    (
      data: Partial<
        Pick<User, 'avatar' | 'career' | 'cycle' | 'campus' | 'phone'>
      >,
    ) =>
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === s.currentUserId ? { ...u, ...data } : u,
        ),
      })),
    [],
  );
  const acceptTerms = useCallback(
    () =>
      setState((s) => ({
        ...s,
        termsAccepted: true,
        termsAcceptances: [
          ...s.termsAcceptances.filter((a) => a.userId !== s.currentUserId),
          { userId: s.currentUserId, version: '1.0', acceptedAt: now() },
        ],
      })),
    [],
  );
  const resetDemo = useCallback(() => {
    const fresh = createSeed();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const toggleListing = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        listings: s.listings.map((l) =>
          l.id === id
            ? { ...l, status: l.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
            : l,
        ),
      })),
    [],
  );
  const archiveListing = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        listings: s.listings.map((l) =>
          l.id === id ? { ...l, status: 'ARCHIVED' } : l,
        ),
      })),
    [],
  );
  const addListing = useCallback((listing: NewListing) => {
    const id = uid('listing');
    const persistedListing = persistentListing(listing);
    setState((s) => ({
      ...s,
      listings: [
        {
          ...persistedListing,
          id,
          ownerId: s.currentUserId,
          status: 'ACTIVE',
        },
        ...s.listings,
      ],
    }));
    return id;
  }, []);
  const updateListing = useCallback(
    (id: string, listing: Partial<NewListing>) => {
      const persistedListing = persistentListing(listing);
      setState((s) => ({
        ...s,
        listings: s.listings.map((item) =>
          item.id === id ? { ...item, ...persistedListing } : item,
        ),
      }));
    },
    [],
  );
  const saveAvailability = useCallback(
    (listingId: string, slots: AvailabilitySlot[]) =>
      setState((s) => ({
        ...s,
        listings: s.listings.map((listing) =>
          listing.id === listingId
            ? {
                ...listing,
                availabilitySlots: [
                  ...listing.availabilitySlots.filter(
                    (slot) => slot.status === 'RESERVED',
                  ),
                  ...slots.filter((slot) => slot.status === 'AVAILABLE'),
                ],
              }
            : listing,
        ),
      })),
    [],
  );

  const createRequest = useCallback(
    (listingId: string, startAt: string, endAt: string) => {
      const listing = state.listings.find((item) => item.id === listingId);
      if (!listing || listing.status !== 'ACTIVE')
        return { ok: false, message: 'La publicación no está disponible.' };
      if (!state.termsAccepted)
        return {
          ok: false,
          message: 'Debes aceptar los términos antes de solicitar.',
        };
      if (new Date(endAt) <= new Date(startAt))
        return {
          ok: false,
          message: 'La fecha final debe ser posterior a la inicial.',
        };
      if (!isPeriodAvailable(listing.availabilitySlots, startAt, endAt))
        return {
          ok: false,
          message: 'El periodo seleccionado no está disponible.',
        };
      const id = uid('request');
      const snap: TermsSnapshot = {
        dailyRate: listing.dailyRate,
        guaranteeAmount: listing.guaranteeAmount,
        startAt,
        endAt,
        originalEndAt: endAt,
        exchangePlace: listing.exchangePlace,
        ...listing.terms,
      };
      setState((s) => ({
        ...s,
        requests: [
          {
            id,
            listingId,
            borrowerId: s.currentUserId,
            lenderId: listing.ownerId,
            startAt,
            endAt,
            createdAt: now(),
            status: 'PENDING',
            snapshot: snap,
          },
          ...s.requests,
        ],
        notifications: [
          notice(
            listing.ownerId,
            'Nueva solicitud',
            `Recibiste una solicitud por ${listing.title}.`,
            '/requests',
          ),
          ...s.notifications,
        ],
      }));
      return { ok: true, id };
    },
    [state],
  );
  const cancelRequest = useCallback(
    (id: string) =>
      setState((s) => {
        const request = s.requests.find((r) => r.id === id);
        if (
          !request ||
          request.status !== 'PENDING' ||
          request.borrowerId !== s.currentUserId
        )
          return s;
        return {
          ...s,
          requests: s.requests.map((r) =>
            r.id === id ? { ...r, status: 'CANCELLED' } : r,
          ),
          notifications: [
            notice(
              request.lenderId,
              'Solicitud cancelada',
              'El prestatario canceló la solicitud pendiente.',
              '/requests',
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );
  const respondRequest = useCallback(
    (id: string, accepted: boolean) =>
      setState((s) => {
        const request = s.requests.find((r) => r.id === id);
        if (
          !request ||
          request.status !== 'PENDING' ||
          request.lenderId !== s.currentUserId
        )
          return s;
        const status = accepted ? 'ACCEPTED' : 'REJECTED';
        if (!accepted)
          return {
            ...s,
            requests: s.requests.map((r) =>
              r.id === id ? { ...r, status } : r,
            ),
            notifications: [
              notice(
                request.borrowerId,
                'Solicitud rechazada',
                'El prestamista no pudo aceptar las fechas solicitadas.',
                '/requests',
              ),
              ...s.notifications,
            ],
          };
        const reservationId = uid('reservation');
        return {
          ...s,
          requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
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
                request.snapshot.guaranteeAmount > 0
                  ? 'PENDING'
                  : 'NOT_REQUIRED',
              deliveryRecorded: false,
              snapshot: { ...request.snapshot },
            },
            ...s.reservations,
          ],
          listings: s.listings.map((l) =>
            l.id === request.listingId
              ? {
                  ...l,
                  availabilitySlots: [
                    ...l.availabilitySlots,
                    {
                      id: uid('slot'),
                      startAt: request.startAt,
                      endAt: request.endAt,
                      status: 'RESERVED',
                      reservationId,
                    },
                  ],
                }
              : l,
          ),
          notifications: [
            notice(
              request.borrowerId,
              'Solicitud aceptada',
              'Tu reserva fue confirmada. Ya puedes completar el pago.',
              `/reservations/${reservationId}`,
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );

  const cancelReservation = useCallback(
    (id: string, reason = 'Cancelación solicitada por el usuario') => {
      const reservation = state.reservations.find((r) => r.id === id);
      const relatedLoan = state.loans.find((l) => l.reservationId === id);
      if (!reservation || !canCancelReservation(reservation, relatedLoan))
        return {
          ok: false,
          message:
            'El préstamo ya está activo y no puede cancelarse después de confirmar la recepción.',
        };
      const breakdown = economicBreakdown(reservation.snapshot);
      const counterpart =
        state.currentUserId === reservation.borrowerId
          ? reservation.lenderId
          : reservation.borrowerId;
      setState((s) => ({
        ...s,
        reservations: s.reservations.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'CANCELLED',
                paymentStatus:
                  r.paymentStatus === 'PENDING' ? 'PENDING' : 'REFUNDED',
                guaranteeStatus: ['HELD', 'PENDING'].includes(r.guaranteeStatus)
                  ? 'REFUNDED'
                  : r.guaranteeStatus,
                cancelledAt: now(),
                cancellationReason: reason,
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
        transactions: [
          ...(reservation.paymentStatus !== 'PENDING'
            ? [
                tx(
                  reservation.borrowerId,
                  relatedLoan?.id ?? id,
                  'REFUND',
                  breakdown.fee + breakdown.serviceFee,
                  reservation.paymentMethod ?? 'Yape',
                  'REFUNDED',
                  id,
                ),
              ]
            : []),
          ...(reservation.guaranteeStatus === 'HELD'
            ? [
                tx(
                  reservation.borrowerId,
                  relatedLoan?.id ?? id,
                  'GUARANTEE_RELEASE',
                  reservation.snapshot.guaranteeAmount,
                  reservation.paymentMethod ?? 'Yape',
                  'REFUNDED',
                  id,
                ),
              ]
            : []),
          ...s.transactions,
        ],
        notifications: [
          notice(
            counterpart,
            'Reserva cancelada',
            `La reserva fue cancelada. Motivo: ${reason}`,
            `/reservations/${id}`,
          ),
          ...s.notifications,
        ],
      }));
      return {
        ok: true,
        message:
          'La reserva fue cancelada; el periodo y los importes aplicables fueron liberados.',
      };
    },
    [state],
  );

  const payReservation = useCallback(
    (id: string, method = 'Yape') =>
      setState((s) => {
        const reservation = s.reservations.find((r) => r.id === id);
        if (!reservation || reservation.paymentStatus !== 'PENDING') return s;
        const amount =
          economicBreakdown(reservation.snapshot).fee +
          economicBreakdown(reservation.snapshot).serviceFee;
        return {
          ...s,
          reservations: s.reservations.map((r) =>
            r.id === id
              ? {
                  ...r,
                  paymentStatus: 'PENDING_RELEASE',
                  paymentMethod: method,
                }
              : r,
          ),
          transactions: [
            tx(
              reservation.borrowerId,
              id,
              'RENTAL_PAYMENT',
              amount,
              method,
              'PENDING_RELEASE',
              id,
            ),
            ...s.transactions,
          ],
          notifications: [
            notice(
              reservation.lenderId,
              'Pago confirmado',
              'La tarifa fue confirmada y está pendiente de liberación.',
              `/reservations/${id}`,
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );
  const holdGuarantee = useCallback(
    (id: string) =>
      setState((s) => {
        const reservation = s.reservations.find((r) => r.id === id);
        if (!reservation || reservation.guaranteeStatus === 'NOT_REQUIRED')
          return s;
        return {
          ...s,
          reservations: s.reservations.map((r) =>
            r.id === id ? { ...r, guaranteeStatus: 'HELD' } : r,
          ),
          transactions: [
            tx(
              reservation.borrowerId,
              id,
              'GUARANTEE_HOLD',
              reservation.snapshot.guaranteeAmount,
              reservation.paymentMethod ?? 'Yape',
              'HELD',
              id,
            ),
            ...s.transactions,
          ],
          notifications: [
            notice(
              reservation.lenderId,
              'Garantía retenida',
              'La garantía quedó constituida para esta reserva.',
              `/reservations/${id}`,
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );

  const recordDelivery = useCallback(
    (id: string, evidence: Evidence[] = []) => {
      const savedEvidence = persistentEvidence(evidence);
      const reservation = state.reservations.find((r) => r.id === id);
      if (!reservation) return { ok: false, message: 'Reserva no encontrada.' };
      if (reservation.paymentStatus !== 'PENDING_RELEASE')
        return { ok: false, message: 'El pago debe estar confirmado.' };
      if (
        reservation.snapshot.guaranteeAmount > 0 &&
        reservation.guaranteeStatus !== 'HELD'
      )
        return { ok: false, message: 'La garantía debe estar retenida.' };
      const existing = state.loans.find((l) => l.reservationId === id);
      const loanId = existing?.id ?? uid('loan');
      setState((s) => ({
        ...s,
        reservations: s.reservations.map((r) =>
          r.id === id ? { ...r, deliveryRecorded: true } : r,
        ),
        loans: existing
          ? s.loans.map((l) =>
              l.id === loanId
                ? {
                    ...l,
                    status: 'PENDING_RECEIPT',
                    evidence: [...l.evidence, ...savedEvidence],
                  }
                : l,
            )
          : [
              {
                id: loanId,
                reservationId: id,
                listingId: reservation.listingId,
                borrowerId: reservation.borrowerId,
                lenderId: reservation.lenderId,
                status: 'PENDING_RECEIPT',
                paymentStatus: reservation.paymentStatus,
                guaranteeStatus: reservation.guaranteeStatus,
                snapshot: { ...reservation.snapshot },
                currentReturnAt: reservation.snapshot.endAt,
                originalReturnAt: reservation.snapshot.originalEndAt,
                extensions: [],
                reschedules: [],
                evidence: savedEvidence,
                timeline: [
                  {
                    id: uid('timeline'),
                    label: 'Entrega registrada',
                    date: 'Ahora',
                    complete: true,
                  },
                  {
                    id: uid('timeline'),
                    label: 'Confirmación de recepción',
                    date: 'Pendiente',
                    complete: false,
                  },
                ],
                ratedBy: [],
              },
              ...s.loans,
            ],
        notifications: [
          notice(
            reservation.borrowerId,
            'Entrega registrada',
            'Revisa las evidencias y confirma que recibiste el objeto.',
            `/loans/${loanId}`,
          ),
          ...s.notifications,
        ],
      }));
      return { ok: true, message: 'Entrega registrada.' };
    },
    [state],
  );
  const confirmReceipt = useCallback(
    (loanId: string) =>
      setState((s) => {
        const item = s.loans.find((l) => l.id === loanId);
        if (
          !item ||
          item.status !== 'PENDING_RECEIPT' ||
          item.borrowerId !== s.currentUserId
        )
          return s;
        const confirmedAt = now();
        return {
          ...s,
          loans: s.loans.map((l) =>
            l.id === loanId
              ? {
                  ...l,
                  status: 'ACTIVE',
                  paymentStatus: 'RELEASED',
                  receiptConfirmedAt: confirmedAt,
                  timeline: [
                    ...l.timeline.map((t) => ({ ...t, complete: true })),
                    {
                      id: uid('timeline'),
                      label: 'Préstamo activo · tarifa liberada',
                      date: 'Ahora',
                      complete: true,
                    },
                  ],
                }
              : l,
          ),
          reservations: s.reservations.map((r) =>
            r.id === item.reservationId
              ? {
                  ...r,
                  status: 'ACTIVATED',
                  paymentStatus: 'RELEASED',
                  receiptConfirmedAt: confirmedAt,
                }
              : r,
          ),
          transactions: [
            tx(
              item.lenderId,
              loanId,
              'RENTAL_RELEASE',
              economicBreakdown(item.snapshot).fee,
              s.reservations.find((r) => r.id === item.reservationId)
                ?.paymentMethod ?? 'Yape',
              'RELEASED',
              item.reservationId,
            ),
            ...s.transactions,
          ],
          notifications: [
            notice(
              item.lenderId,
              'Recepción confirmada',
              'El préstamo está activo y la tarifa fue liberada.',
              `/loans/${loanId}`,
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );

  const requestExtension = useCallback(
    (loanId: string, endAt: string) => {
      const item = state.loans.find((l) => l.id === loanId);
      const listing = state.listings.find((l) => l.id === item?.listingId);
      if (!item || item.status !== 'ACTIVE')
        return { ok: false, message: 'El préstamo debe estar activo.' };
      if (new Date(endAt) <= new Date(item.currentReturnAt))
        return {
          ok: false,
          message: 'La nueva fecha debe ser posterior a la devolución vigente.',
        };
      if (
        !listing ||
        !isPeriodAvailable(
          listing.availabilitySlots.filter(
            (slot) => slot.reservationId !== item.reservationId,
          ),
          item.currentReturnAt,
          endAt,
        )
      )
        return {
          ok: false,
          message: 'El periodo adicional no está disponible.',
        };
      const extension = {
        id: uid('extension'),
        requesterId: item.borrowerId,
        requestedAt: now(),
        originalReturnAt: item.currentReturnAt,
        proposedReturnAt: endAt,
        additionalCost: extensionCost(
          item.currentReturnAt,
          endAt,
          item.snapshot.dailyRate,
        ),
        status: 'PENDING' as const,
      };
      setState((s) => ({
        ...s,
        loans: s.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                extensionStatus: 'PENDING',
                extensionEndAt: endAt,
                extensions: [...l.extensions, extension],
              }
            : l,
        ),
        notifications: [
          notice(
            item.lenderId,
            'Extensión solicitada',
            'El prestatario propuso una nueva fecha de devolución.',
            `/loans/${loanId}`,
          ),
          ...s.notifications,
        ],
      }));
      return { ok: true, message: 'Extensión solicitada.' };
    },
    [state],
  );
  const respondExtension = useCallback(
    (loanId: string, accepted: boolean) =>
      setState((s) => {
        const item = s.loans.find((l) => l.id === loanId);
        const pending = item?.extensions.findLast(
          (e) => e.status === 'PENDING',
        );
        if (!item || !pending || item.lenderId !== s.currentUserId) return s;
        const finalStatus =
          accepted && pending.additionalCost > 0
            ? 'PAYMENT_PENDING'
            : accepted
              ? 'ACCEPTED'
              : 'REJECTED';
        return {
          ...s,
          loans: s.loans.map((l) =>
            l.id === loanId
              ? {
                  ...l,
                  extensionStatus: finalStatus,
                  currentReturnAt: accepted
                    ? pending.proposedReturnAt
                    : l.currentReturnAt,
                  snapshot: accepted
                    ? { ...l.snapshot, endAt: pending.proposedReturnAt }
                    : l.snapshot,
                  extensions: l.extensions.map((e) =>
                    e.id === pending.id
                      ? { ...e, status: finalStatus, respondedAt: now() }
                      : e,
                  ),
                }
              : l,
          ),
          transactions:
            accepted && pending.additionalCost > 0
              ? [
                  tx(
                    item.borrowerId,
                    loanId,
                    'EXTENSION_PAYMENT',
                    pending.additionalCost,
                    'Yape',
                    'PENDING',
                  ),
                  ...s.transactions,
                ]
              : s.transactions,
          notifications: [
            notice(
              item.borrowerId,
              accepted ? 'Extensión aceptada' : 'Extensión rechazada',
              accepted
                ? 'La nueva fecha está vigente; completa el pago adicional cuando corresponda.'
                : 'Se mantiene la fecha de devolución vigente.',
              `/loans/${loanId}`,
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );

  const proposeReschedule = useCallback(
    (loanId: string, endAt: string) => {
      const item = state.loans.find((l) => l.id === loanId);
      if (
        !item ||
        item.status !== 'ACTIVE' ||
        item.lenderId !== state.currentUserId
      )
        return {
          ok: false,
          message:
            'Solo el prestamista puede proponer una reprogramación en un préstamo activo.',
        };
      if (new Date(endAt) <= new Date())
        return { ok: false, message: 'Selecciona una fecha futura.' };
      setState((s) => ({
        ...s,
        loans: s.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                reschedules: [
                  ...l.reschedules,
                  {
                    id: uid('reschedule'),
                    proposerId: l.lenderId,
                    proposedAt: now(),
                    originalReturnAt: l.currentReturnAt,
                    proposedReturnAt: endAt,
                    additionalCost: 0,
                    status: 'PENDING',
                  },
                ],
              }
            : l,
        ),
        notifications: [
          notice(
            item.borrowerId,
            'Propuesta de reprogramación',
            'El prestamista propuso una nueva fecha sin costo adicional.',
            `/loans/${loanId}`,
          ),
          ...s.notifications,
        ],
      }));
      return { ok: true, message: 'Propuesta enviada.' };
    },
    [state],
  );
  const respondReschedule = useCallback(
    (loanId: string, accepted: boolean) =>
      setState((s) => {
        const item = s.loans.find((l) => l.id === loanId);
        const pending = item?.reschedules.findLast(
          (r) => r.status === 'PENDING',
        );
        if (!item || !pending || item.borrowerId !== s.currentUserId) return s;
        return {
          ...s,
          loans: s.loans.map((l) =>
            l.id === loanId
              ? {
                  ...l,
                  currentReturnAt: accepted
                    ? pending.proposedReturnAt
                    : l.currentReturnAt,
                  snapshot: accepted
                    ? { ...l.snapshot, endAt: pending.proposedReturnAt }
                    : l.snapshot,
                  reschedules: l.reschedules.map((r) =>
                    r.id === pending.id
                      ? {
                          ...r,
                          status: accepted ? 'ACCEPTED' : 'REJECTED',
                          respondedAt: now(),
                        }
                      : r,
                  ),
                }
              : l,
          ),
          notifications: [
            notice(
              item.lenderId,
              accepted ? 'Reprogramación aceptada' : 'Reprogramación rechazada',
              accepted
                ? 'La nueva fecha de devolución ya está vigente.'
                : 'Se mantiene la fecha anterior.',
              `/loans/${loanId}`,
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );

  const recordReturn = useCallback(
    (
      loanId: string,
      early: boolean,
      notes: string,
      evidence: Evidence[] = [],
    ) => {
      const savedEvidence = persistentEvidence(evidence);
      return setState((s) => {
        const item = s.loans.find((l) => l.id === loanId);
        if (
          !item ||
          !['ACTIVE', 'OVERDUE'].includes(item.status) ||
          item.borrowerId !== s.currentUserId
        )
          return s;
        const registeredAt = now();
        return {
          ...s,
          loans: s.loans.map((l) =>
            l.id === loanId
              ? {
                  ...l,
                  status: 'RETURN_RECORDED',
                  earlyReturn: early,
                  actualReturnAt: registeredAt,
                  returnRecord: { registeredAt, early, notes },
                  evidence: [...l.evidence, ...savedEvidence],
                  timeline: [
                    ...l.timeline,
                    {
                      id: uid('timeline'),
                      label: early
                        ? 'Devolución anticipada registrada'
                        : 'Devolución registrada',
                      date: 'Ahora',
                      complete: true,
                    },
                    {
                      id: uid('timeline'),
                      label: 'Confirmación del prestamista',
                      date: 'Pendiente',
                      complete: false,
                    },
                  ],
                }
              : l,
          ),
          notifications: [
            notice(
              item.lenderId,
              early ? 'Devolución anticipada' : 'Devolución registrada',
              'Revisa las evidencias finales y confirma la devolución.',
              `/loans/${loanId}`,
            ),
            ...s.notifications,
          ],
        };
      });
    },
    [],
  );
  const confirmReturn = useCallback(
    (loanId: string) =>
      setState((s) => {
        const item = s.loans.find((l) => l.id === loanId);
        if (
          !item ||
          item.status !== 'RETURN_RECORDED' ||
          item.lenderId !== s.currentUserId
        )
          return s;
        const unresolved = hasUnresolvedIncident(
          s.incidents.filter((i) => i.loanId === loanId).map((i) => i.status),
        );
        const guaranteeStatus = unresolved ? 'HELD' : 'RELEASED';
        const confirmedAt = now();
        return {
          ...s,
          loans: s.loans.map((l) =>
            l.id === loanId
              ? {
                  ...l,
                  status: 'COMPLETED',
                  guaranteeStatus,
                  returnRecord: l.returnRecord
                    ? { ...l.returnRecord, confirmedAt }
                    : l.returnRecord,
                  timeline: [
                    ...l.timeline.map((t) => ({ ...t, complete: true })),
                    {
                      id: uid('timeline'),
                      label: unresolved
                        ? 'Préstamo finalizado · garantía retenida por incidencia'
                        : 'Préstamo finalizado · garantía liberada',
                      date: 'Ahora',
                      complete: true,
                    },
                  ],
                }
              : l,
          ),
          reservations: s.reservations.map((r) =>
            r.id === item.reservationId
              ? { ...r, status: 'COMPLETED', guaranteeStatus }
              : r,
          ),
          listings: s.listings.map((l) =>
            l.id === item.listingId
              ? {
                  ...l,
                  availabilitySlots: releaseFutureAvailability(
                    l.availabilitySlots,
                    item,
                    confirmedAt,
                  ),
                }
              : l,
          ),
          transactions: unresolved
            ? s.transactions
            : [
                tx(
                  item.borrowerId,
                  loanId,
                  'GUARANTEE_RELEASE',
                  item.snapshot.guaranteeAmount,
                  s.reservations.find((r) => r.id === item.reservationId)
                    ?.paymentMethod ?? 'Yape',
                  'RELEASED',
                  item.reservationId,
                ),
                ...s.transactions,
              ],
          notifications: [
            notice(
              item.borrowerId,
              'Devolución confirmada',
              unresolved
                ? 'El préstamo terminó; la garantía sigue retenida mientras se resuelve la incidencia.'
                : 'El préstamo terminó y la garantía fue liberada.',
              `/loans/${loanId}`,
            ),
            ...s.notifications,
          ],
        };
      }),
    [],
  );

  const reportIncident = useCallback(
    (
      loanId: string,
      type: Incident['type'],
      description: string,
      evidence: Evidence[] = [],
    ) => {
      const id = `INC-${Math.floor(1000 + Math.random() * 8999)}`;
      const savedEvidence = persistentEvidence(evidence);
      setState((s) => {
        const item = s.loans.find((l) => l.id === loanId);
        if (!item) return s;
        const other =
          item.borrowerId === s.currentUserId ? item.lenderId : item.borrowerId;
        return {
          ...s,
          incidents: [
            {
              id,
              loanId,
              type,
              description,
              evidence: savedEvidence,
              reportedBy: s.currentUserId,
              status: 'OPEN',
              createdAt: now(),
              guaranteeAmount: item.snapshot.guaranteeAmount,
            },
            ...s.incidents,
          ],
          loans: s.loans.map((l) =>
            l.id === loanId ? { ...l, guaranteeStatus: 'HELD' } : l,
          ),
          notifications: [
            notice(
              other,
              'Incidencia creada',
              'Se registró una incidencia y la garantía permanecerá retenida.',
              `/incidents/${id}`,
            ),
            notice(
              'admin',
              'Nueva incidencia',
              `Revisa la incidencia ${id}.`,
              `/admin/incidents/${id}`,
            ),
            ...s.notifications,
          ],
        };
      });
      return id;
    },
    [],
  );
  const saveAnalysis = useCallback(
    (analysis: EvidenceAnalysis) =>
      setState((s) => ({
        ...s,
        analyses: [
          ...s.analyses.filter((a) => a.loanId !== analysis.loanId),
          analysis,
        ],
      })),
    [],
  );
  const resolveIncident = useCallback(
    (
      id: string,
      decision: IncidentDecision,
      amount: number,
      justification: string,
    ) => {
      const incident = state.incidents.find((i) => i.id === id);
      if (!incident) return { ok: false, message: 'Incidencia no encontrada.' };
      if (!justification.trim())
        return { ok: false, message: 'La justificación es obligatoria.' };
      if (
        decision === 'PARTIAL' &&
        (amount <= 0 || amount > incident.guaranteeAmount)
      )
        return {
          ok: false,
          message:
            'El monto parcial debe ser mayor a cero y no superar la garantía.',
        };
      const item = state.loans.find((l) => l.id === incident.loanId);
      if (!item) return { ok: false, message: 'Préstamo no encontrado.' };
      const captured =
        decision === 'TOTAL'
          ? incident.guaranteeAmount
          : decision === 'PARTIAL'
            ? amount
            : 0;
      const guaranteeStatus =
        decision === 'NO_IMPACT'
          ? 'RELEASED'
          : decision === 'PARTIAL'
            ? 'PARTIALLY_CAPTURED'
            : 'CAPTURED';
      setState((s) => ({
        ...s,
        incidents: s.incidents.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'RESOLVED',
                resolution: {
                  decision,
                  amount: captured,
                  justification,
                  resolvedAt: now(),
                },
              }
            : i,
        ),
        loans: s.loans.map((l) =>
          l.id === item.id ? { ...l, guaranteeStatus } : l,
        ),
        reservations: s.reservations.map((r) =>
          r.id === item.reservationId ? { ...r, guaranteeStatus } : r,
        ),
        transactions: [
          ...(decision === 'NO_IMPACT'
            ? [
                tx(
                  item.borrowerId,
                  item.id,
                  'GUARANTEE_RELEASE',
                  incident.guaranteeAmount,
                  'Método original',
                  'RELEASED',
                  item.reservationId,
                ),
              ]
            : []),
          ...(decision === 'PARTIAL'
            ? [
                tx(
                  item.borrowerId,
                  item.id,
                  'GUARANTEE_PARTIAL_CAPTURE',
                  captured,
                  'Método original',
                  'PARTIALLY_CAPTURED',
                  item.reservationId,
                ),
                tx(
                  item.borrowerId,
                  item.id,
                  'GUARANTEE_RELEASE',
                  incident.guaranteeAmount - captured,
                  'Método original',
                  'RELEASED',
                  item.reservationId,
                ),
              ]
            : []),
          ...(decision === 'TOTAL'
            ? [
                tx(
                  item.borrowerId,
                  item.id,
                  'GUARANTEE_CAPTURE',
                  captured,
                  'Método original',
                  'CAPTURED',
                  item.reservationId,
                ),
              ]
            : []),
          ...s.transactions,
        ],
        notifications: [
          notice(
            item.borrowerId,
            'Incidencia resuelta',
            'La decisión administrativa ya está disponible.',
            `/incidents/${id}`,
          ),
          notice(
            item.lenderId,
            'Incidencia resuelta',
            'La decisión administrativa ya está disponible.',
            `/incidents/${id}`,
          ),
          ...s.notifications,
        ],
      }));
      return { ok: true, message: 'Incidencia resuelta.' };
    },
    [state],
  );

  const rateLoan = useCallback(
    (loanId: string, stars: number, comment: string) => {
      const item = state.loans.find((l) => l.id === loanId);
      if (!item || item.status !== 'COMPLETED')
        return {
          ok: false,
          message: 'Solo puedes calificar préstamos finalizados.',
        };
      if (item.ratedBy.includes(state.currentUserId))
        return { ok: false, message: 'Ya calificaste esta operación.' };
      if (stars < 1 || stars > 5)
        return { ok: false, message: 'Selecciona entre 1 y 5 estrellas.' };
      const targetUserId =
        item.borrowerId === state.currentUserId
          ? item.lenderId
          : item.borrowerId;
      const rating: Rating = {
        id: uid('rating'),
        stars,
        comment,
        authorId: state.currentUserId,
        targetUserId,
        loanId,
        createdAt: now(),
      };
      setState((s) => {
        const all = [...s.ratings, rating];
        const targetRatings = all.filter(
          (r) => r.targetUserId === targetUserId,
        );
        return {
          ...s,
          ratings: all,
          loans: s.loans.map((l) =>
            l.id === loanId
              ? { ...l, ratedBy: [...l.ratedBy, s.currentUserId] }
              : l,
          ),
          users: s.users.map((u) =>
            u.id === targetUserId
              ? {
                  ...u,
                  ratingCount: targetRatings.length,
                  rating: Number(
                    (
                      targetRatings.reduce((sum, r) => sum + r.stars, 0) /
                      targetRatings.length
                    ).toFixed(1),
                  ),
                }
              : u,
          ),
        };
      });
      return { ok: true, message: 'Calificación guardada.' };
    },
    [state],
  );
  const markNotification = useCallback(
    (id?: string) =>
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          (!id || n.id === id) && n.userId === s.currentUserId
            ? { ...n, read: true }
            : n,
        ),
      })),
    [],
  );
  const mockRefreshDerivedStatuses = useCallback(
    () =>
      setState((s) => ({
        ...s,
        loans: s.loans.map((l) =>
          l.status === 'ACTIVE' && new Date(l.currentReturnAt) < new Date()
            ? { ...l, status: 'OVERDUE' }
            : l,
        ),
      })),
    [],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      hydrated,
      switchUser,
      login,
      logout,
      registerUser,
      verifyCurrentUser,
      updateProfile,
      acceptTerms,
      resetDemo,
      toggleListing,
      archiveListing,
      addListing,
      updateListing,
      saveAvailability,
      createRequest,
      cancelRequest,
      respondRequest,
      cancelReservation,
      payReservation,
      holdGuarantee,
      recordDelivery,
      confirmReceipt,
      requestExtension,
      respondExtension,
      proposeReschedule,
      respondReschedule,
      recordReturn,
      confirmReturn,
      reportIncident,
      saveAnalysis,
      resolveIncident,
      rateLoan,
      markNotification,
      mockRefreshDerivedStatuses,
    }),
    [
      state,
      hydrated,
      switchUser,
      login,
      logout,
      registerUser,
      verifyCurrentUser,
      updateProfile,
      acceptTerms,
      resetDemo,
      toggleListing,
      archiveListing,
      addListing,
      updateListing,
      saveAvailability,
      createRequest,
      cancelRequest,
      respondRequest,
      cancelReservation,
      payReservation,
      holdGuarantee,
      recordDelivery,
      confirmReceipt,
      requestExtension,
      respondExtension,
      proposeReschedule,
      respondReschedule,
      recordReturn,
      confirmReturn,
      reportIncident,
      saveAnalysis,
      resolveIncident,
      rateLoan,
      markNotification,
      mockRefreshDerivedStatuses,
    ],
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo debe utilizarse dentro de DemoProvider');
  return value;
}
