import type {
  AvailabilitySlot,
  Coordinates,
  AppState,
  Incident,
  IncidentStatus,
  Listing,
  Loan,
  LoanStatus,
  PaymentTransaction,
  Reminder,
  Reservation,
  TermsAcceptance,
  TermsSnapshot,
  University,
  User,
} from '@/types/domain';

const BLOCK_MS = 86_400_000;

export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function rentalDays(startAt: string, endAt: string) {
  const elapsed = new Date(endAt).getTime() - new Date(startAt).getTime();
  return Math.max(1, Math.ceil(elapsed / BLOCK_MS));
}

export type EconomicBreakdown = ReturnType<typeof economicBreakdown>;

export function economicBreakdown(
  snapshot: Pick<
    TermsSnapshot,
    | 'dailyRate'
    | 'startAt'
    | 'endAt'
    | 'guaranteeAmount'
    | 'commissionRate'
    | 'providerFeeRate'
  >,
) {
  const days = rentalDays(snapshot.startAt, snapshot.endAt);
  const fee = roundMoney(snapshot.dailyRate * days);
  const commission = roundMoney(fee * snapshot.commissionRate);
  const providerFee = roundMoney((fee + commission) * snapshot.providerFeeRate);
  const rentalCharge = roundMoney(fee + commission + providerFee);
  return {
    days,
    fee,
    commission,
    providerFee,
    rentalCharge,
    guarantee: snapshot.guaranteeAmount,
    total: roundMoney(rentalCharge + snapshot.guaranteeAmount),
    lenderPayout: fee,
  };
}

export function overlaps(
  startAt: string,
  endAt: string,
  otherStart: string,
  otherEnd: string,
) {
  return (
    new Date(startAt) < new Date(otherEnd) &&
    new Date(endAt) > new Date(otherStart)
  );
}

export function hasReservationCollision(
  slots: AvailabilitySlot[],
  startAt: string,
  endAt: string,
  ignoredReservationId?: string,
) {
  return slots.some(
    (slot) =>
      slot.status === 'RESERVED' &&
      slot.reservationId !== ignoredReservationId &&
      overlaps(startAt, endAt, slot.startAt, slot.endAt),
  );
}

export function isPeriodAvailable(
  slots: AvailabilitySlot[],
  startAt: string,
  endAt: string,
) {
  const insideAvailable = slots.some(
    (slot) =>
      slot.status === 'AVAILABLE' &&
      new Date(startAt) >= new Date(slot.startAt) &&
      new Date(endAt) <= new Date(slot.endAt),
  );
  return insideAvailable && !hasReservationCollision(slots, startAt, endAt);
}

export function replaceReservedInterval(
  slots: AvailabilitySlot[],
  reservationId: string,
  startAt: string,
  endAt: string,
) {
  return [
    ...slots.filter(
      (slot) =>
        !(slot.status === 'RESERVED' && slot.reservationId === reservationId),
    ),
    {
      id: `slot-reserved-${reservationId}`,
      startAt,
      endAt,
      status: 'RESERVED' as const,
      reservationId,
    },
  ];
}

export function releaseFutureAvailability(
  slots: AvailabilitySlot[],
  loan: Pick<Loan, 'id' | 'reservationId' | 'earlyReturn' | 'currentReturnAt'>,
  confirmedAt: string,
) {
  const withoutReservation = slots.filter(
    (slot) => slot.reservationId !== loan.reservationId,
  );
  if (
    !loan.earlyReturn ||
    new Date(confirmedAt) >= new Date(loan.currentReturnAt)
  )
    return withoutReservation;
  return [
    ...withoutReservation,
    {
      id: `slot-release-${loan.id}`,
      startAt: confirmedAt,
      endAt: loan.currentReturnAt,
      status: 'AVAILABLE' as const,
    },
  ];
}

export function isParticipant(
  operation: { borrowerId: string; lenderId: string },
  userId: string,
) {
  return operation.borrowerId === userId || operation.lenderId === userId;
}

export function counterpartOf(
  operation: { borrowerId: string; lenderId: string },
  userId: string,
) {
  return operation.borrowerId === userId
    ? operation.lenderId
    : operation.borrowerId;
}

export function canViewReservation(
  state: AppState,
  id: string,
  userId: string,
) {
  const item = state.reservations.find((reservation) => reservation.id === id);
  return Boolean(item && isParticipant(item, userId));
}

export function canViewLoan(state: AppState, id: string, userId: string) {
  const item = state.loans.find((loan) => loan.id === id);
  return Boolean(item && isParticipant(item, userId));
}

export function canViewIncident(
  state: AppState,
  incident: Incident | undefined,
  userId: string,
) {
  if (!incident) return false;
  const loan = state.loans.find(
    (candidate) => candidate.id === incident.loanId,
  );
  return Boolean(loan && isParticipant(loan, userId));
}

const closedOperationStatuses = ['CANCELLED', 'COMPLETED'];

export function canViewCounterpartyPhone(
  operation: { borrowerId: string; lenderId: string; status: string },
  userId: string,
) {
  return (
    isParticipant(operation, userId) &&
    !closedOperationStatuses.includes(operation.status)
  );
}

export function canManageListing(
  listing: Pick<Listing, 'ownerId'> | undefined,
  userId: string,
) {
  return listing?.ownerId === userId;
}

export function canRequestListing(
  listing: Pick<Listing, 'ownerId' | 'status'>,
  userId: string,
) {
  return listing.ownerId !== userId && listing.status === 'ACTIVE';
}

export function hasAcceptedTerms(
  acceptances: TermsAcceptance[],
  userId: string,
  version: string,
) {
  return acceptances.some(
    (acceptance) =>
      acceptance.userId === userId && acceptance.version === version,
  );
}

export function isInstitutionalEmail(email: string, university?: University) {
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!domain || !university) return false;
  return university.emailDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

export function canOperate(user: User | undefined, termsAccepted: boolean) {
  return Boolean(
    user &&
    user.role === 'STUDENT' &&
    user.accountStatus === 'ACTIVE' &&
    user.verified &&
    termsAccepted,
  );
}

export function canCancelReservation(
  reservation: Pick<Reservation, 'status' | 'deliveryRecorded'>,
) {
  return reservation.status === 'CONFIRMED' && !reservation.deliveryRecorded;
}

export function cancellationRefund(
  reservation: Pick<
    Reservation,
    'snapshot' | 'paymentStatus' | 'guaranteeStatus'
  >,
  actor: 'BORROWER' | 'LENDER',
) {
  const amounts = economicBreakdown(reservation.snapshot);
  const rate =
    actor === 'LENDER'
      ? reservation.snapshot.cancellationPolicy.lenderRefundRate
      : reservation.snapshot.cancellationPolicy.borrowerRefundRate;
  const rentalPaid = reservation.paymentStatus === 'PENDING_RELEASE';
  return {
    rentalRefund: rentalPaid ? roundMoney(amounts.rentalCharge * rate) : 0,
    guaranteeRelease:
      reservation.guaranteeStatus === 'HELD' ? amounts.guarantee : 0,
  };
}

export function isPaymentSettled(
  reservation: Pick<
    Reservation,
    'paymentStatus' | 'guaranteeStatus' | 'snapshot'
  >,
) {
  const guaranteeReady =
    reservation.snapshot.guaranteeAmount === 0 ||
    reservation.guaranteeStatus === 'HELD';
  return reservation.paymentStatus === 'PENDING_RELEASE' && guaranteeReady;
}

export function canRetryPayment(status: string) {
  return ['PENDING', 'FAILED', 'CANCELLED'].includes(status);
}

export function mayRateLoan(loan: Loan, userId: string) {
  return (
    loan.status === 'COMPLETED' &&
    isParticipant(loan, userId) &&
    !loan.ratedBy.includes(userId)
  );
}

export function extensionCost(
  currentReturnAt: string,
  proposedReturnAt: string,
  dailyRate: number,
) {
  if (new Date(proposedReturnAt) <= new Date(currentReturnAt)) return 0;
  return roundMoney(rentalDays(currentReturnAt, proposedReturnAt) * dailyRate);
}

export function shouldMarkOverdue(
  status: LoanStatus,
  dueAt: string,
  now: string,
) {
  return status === 'ACTIVE' && new Date(now) > new Date(dueAt);
}

export function hasUnresolvedIncident(statuses: IncidentStatus[]) {
  return statuses.some((status) => status !== 'RESOLVED');
}

export function statusAfterReturnConfirmation(hasOpenIncident: boolean) {
  return hasOpenIncident
    ? ('RETURN_CONFIRMED_PENDING_INCIDENT' as const)
    : ('COMPLETED' as const);
}

export function guaranteeAfterReturn(
  hasOpenIncident: boolean,
  guaranteeAmount: number,
) {
  if (guaranteeAmount === 0) return 'NOT_REQUIRED' as const;
  return hasOpenIncident ? ('HELD' as const) : ('RELEASED' as const);
}

export function remainingGuarantee(
  incidents: Incident[],
  loan: Pick<Loan, 'id' | 'snapshot'>,
  excludeIncidentId?: string,
) {
  const captured = incidents
    .filter(
      (incident) =>
        incident.loanId === loan.id &&
        incident.id !== excludeIncidentId &&
        incident.status === 'RESOLVED',
    )
    .reduce((sum, incident) => sum + (incident.resolution?.amount ?? 0), 0);
  return Math.max(0, roundMoney(loan.snapshot.guaranteeAmount - captured));
}

export function validPartialCapture(amount: number, available: number) {
  return amount > 0 && amount <= available;
}

export function updateReturnReminders(
  reminders: Reminder[],
  operationId: string,
  dueAt: string,
) {
  return reminders.map((reminder) =>
    reminder.operationId === operationId &&
    ['RETURN', 'RETURN_RECEIPT'].includes(reminder.kind)
      ? { ...reminder, dueAt }
      : reminder,
  );
}

export function removeOperationReminders(
  reminders: Reminder[],
  ...operationIds: string[]
) {
  return reminders.filter(
    (reminder) => !operationIds.includes(reminder.operationId),
  );
}

export function transactionRoute(transaction: PaymentTransaction) {
  if (transaction.incidentId) return `/incidents/${transaction.incidentId}`;
  if (transaction.loanId) return `/loans/${transaction.loanId}`;
  if (transaction.reservationId)
    return `/reservations/${transaction.reservationId}`;
  return '/transactions';
}

export type LoanNextAction =
  | 'CONFIRM_RECEIPT'
  | 'WAIT_RECEIPT'
  | 'RECORD_RETURN'
  | 'WAIT_RETURN'
  | 'CONFIRM_RETURN'
  | 'WAIT_RETURN_CONFIRMATION'
  | 'WAIT_INCIDENT'
  | 'RATE'
  | 'NONE';

export function loanNextAction(loan: Loan, userId: string): LoanNextAction {
  const borrower = loan.borrowerId === userId;
  switch (loan.status) {
    case 'PENDING_RECEIPT':
      return borrower ? 'CONFIRM_RECEIPT' : 'WAIT_RECEIPT';
    case 'ACTIVE':
    case 'OVERDUE':
      return borrower ? 'RECORD_RETURN' : 'WAIT_RETURN';
    case 'RETURN_RECORDED':
      return borrower ? 'WAIT_RETURN_CONFIRMATION' : 'CONFIRM_RETURN';
    case 'RETURN_CONFIRMED_PENDING_INCIDENT':
      return 'WAIT_INCIDENT';
    case 'COMPLETED':
      return loan.ratedBy.includes(userId) ? 'NONE' : 'RATE';
  }
}

export function distanceKm(from: Coordinates, to: Coordinates) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
