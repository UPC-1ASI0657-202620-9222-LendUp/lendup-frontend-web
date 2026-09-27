import type {
  AvailabilitySlot,
  DemoState,
  Incident,
  IncidentStatus,
  Loan,
  LoanExtension,
  PaymentTransaction,
  Reminder,
  Reservation,
  TermsSnapshot,
} from '@/types/domain';

const DAY_MS = 86_400_000;

export function rentalDays(startAt: string, endAt: string) {
  return Math.max(
    1,
    Math.ceil(
      (new Date(endAt).getTime() - new Date(startAt).getTime()) / DAY_MS,
    ),
  );
}

export function economicBreakdown(
  snapshot: Pick<
    TermsSnapshot,
    'dailyRate' | 'startAt' | 'endAt' | 'guaranteeAmount'
  > &
    Partial<Pick<TermsSnapshot, 'providerFee'>>,
) {
  const days = rentalDays(snapshot.startAt, snapshot.endAt);
  const fee = snapshot.dailyRate * days;
  const serviceFee = snapshot.providerFee ?? 0;
  return {
    days,
    fee,
    serviceFee,
    guarantee: snapshot.guaranteeAmount,
    total: fee + serviceFee + snapshot.guaranteeAmount,
  };
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

export function isParticipant(
  operation: { borrowerId: string; lenderId: string },
  userId: string,
) {
  return operation.borrowerId === userId || operation.lenderId === userId;
}

export function canViewReservation(
  state: DemoState,
  id: string,
  userId: string,
) {
  const item = state.reservations.find((reservation) => reservation.id === id);
  return Boolean(item && isParticipant(item, userId));
}

export function canViewLoan(state: DemoState, id: string, userId: string) {
  const item = state.loans.find((loan) => loan.id === id);
  return Boolean(item && isParticipant(item, userId));
}

export function canViewIncident(
  state: DemoState,
  incident: Incident | undefined,
  userId: string,
) {
  if (!incident) return false;
  const loan = state.loans.find(
    (candidate) => candidate.id === incident.loanId,
  );
  return Boolean(loan && isParticipant(loan, userId));
}

export function canViewCounterpartyPhone(
  operation: { borrowerId: string; lenderId: string; status: string },
  userId: string,
) {
  return (
    isParticipant(operation, userId) &&
    !['PENDING', 'CANCELLED', 'COMPLETED'].includes(operation.status)
  );
}

export function canRequestListing(
  listing: { ownerId: string; status: string },
  userId: string,
) {
  return listing.ownerId !== userId && listing.status === 'ACTIVE';
}

export function canManageListing(
  listing: { ownerId: string } | undefined,
  userId: string,
) {
  return listing?.ownerId === userId;
}

export function validPartialCapture(
  amount: number,
  remainingGuarantee: number,
) {
  return amount > 0 && amount <= remainingGuarantee;
}

export function mayRateLoan(loan: Loan, userId: string, targetUserId: string) {
  return (
    loan.status === 'COMPLETED' &&
    isParticipant(loan, userId) &&
    isParticipant(loan, targetUserId) &&
    userId !== targetUserId &&
    !loan.ratedBy.includes(userId)
  );
}

export function canAcceptTerms(authenticated: boolean) {
  return authenticated;
}

export function statusAfterReceiptConfirmation() {
  return 'ACTIVE' as const;
}

export function dueAfterExtension(
  currentReturnAt: string,
  extension: Pick<
    LoanExtension,
    'status' | 'paymentStatus' | 'proposedReturnAt'
  >,
) {
  return extension.status === 'ACCEPTED' &&
    extension.paymentStatus === 'RELEASED'
    ? extension.proposedReturnAt
    : currentReturnAt;
}

export function statusAfterReturnConfirmation(hasOpenIncident: boolean) {
  return hasOpenIncident
    ? ('RETURN_CONFIRMED_PENDING_INCIDENT' as const)
    : ('COMPLETED' as const);
}

export function statusAfterIncidentResolution(hasRemainingIncident: boolean) {
  return hasRemainingIncident
    ? ('RETURN_CONFIRMED_PENDING_INCIDENT' as const)
    : ('COMPLETED' as const);
}

export function cancellationRefundAmount(
  snapshot: TermsSnapshot,
  actor: 'BORROWER' | 'LENDER',
) {
  const amounts = economicBreakdown(snapshot);
  const rate =
    actor === 'LENDER'
      ? snapshot.cancellationPolicy.lenderRefundRate
      : snapshot.cancellationPolicy.borrowerRefundRate;
  return (amounts.fee + amounts.serviceFee) * rate;
}

export function shouldMarkOverdue(
  status: Loan['status'],
  dueAt: string,
  now: string,
) {
  return status === 'ACTIVE' && new Date(now) > new Date(dueAt);
}

export function updateReturnReminders(
  reminders: Reminder[],
  operationId: string,
  dueAt: string,
) {
  return reminders.map((reminder) =>
    reminder.operationId === operationId && reminder.kind === 'RETURN'
      ? { ...reminder, dueAt }
      : reminder,
  );
}

export function removeOperationReminders(
  reminders: Reminder[],
  operationId: string,
) {
  return reminders.filter((reminder) => reminder.operationId !== operationId);
}

export function transactionRoute(transaction: PaymentTransaction) {
  if (transaction.incidentId) return `/incidents/${transaction.incidentId}`;
  if (transaction.loanId) return `/loans/${transaction.loanId}`;
  if (transaction.reservationId)
    return `/reservations/${transaction.reservationId}`;
  return '/transactions';
}

export function overlaps(
  startAt: string,
  endAt: string,
  slotStart: string,
  slotEnd: string,
) {
  return (
    new Date(startAt) < new Date(slotEnd) &&
    new Date(endAt) > new Date(slotStart)
  );
}

export function isPeriodAvailable(
  slots: AvailabilitySlot[],
  startAt: string,
  endAt: string,
) {
  const available = slots.some(
    (slot) =>
      slot.status === 'AVAILABLE' &&
      new Date(startAt) >= new Date(slot.startAt) &&
      new Date(endAt) <= new Date(slot.endAt),
  );
  const reserved = slots.some(
    (slot) =>
      slot.status === 'RESERVED' &&
      overlaps(startAt, endAt, slot.startAt, slot.endAt),
  );
  return available && !reserved;
}

export function canCancelReservation(reservation: Reservation, loan?: Loan) {
  return (
    reservation.status === 'CONFIRMED' &&
    !reservation.receiptConfirmedAt &&
    !loan?.receiptConfirmedAt &&
    loan?.status !== 'ACTIVE'
  );
}

export function guaranteeAfterReturn(hasOpenIncident: boolean) {
  return hasOpenIncident ? ('HELD' as const) : ('RELEASED' as const);
}

export function hasUnresolvedIncident(statuses: IncidentStatus[]) {
  return statuses.some(
    (status) => status === 'OPEN' || status === 'UNDER_REVIEW',
  );
}

export function extensionCost(
  currentReturnAt: string,
  proposedReturnAt: string,
  dailyRate: number,
) {
  if (new Date(proposedReturnAt) <= new Date(currentReturnAt)) return 0;
  return rentalDays(currentReturnAt, proposedReturnAt) * dailyRate;
}

export function releaseFutureAvailability(
  slots: AvailabilitySlot[],
  loan: Loan,
  confirmedAt: string,
) {
  if (
    !loan.earlyReturn ||
    new Date(confirmedAt) >= new Date(loan.originalReturnAt)
  )
    return slots;
  return [
    ...slots.filter((slot) => slot.reservationId !== loan.reservationId),
    {
      id: `slot-release-${loan.id}`,
      startAt: confirmedAt,
      endAt: loan.originalReturnAt,
      status: 'AVAILABLE' as const,
    },
  ];
}
