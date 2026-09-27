import type {
  AvailabilitySlot,
  IncidentStatus,
  Loan,
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
  >,
) {
  const days = rentalDays(snapshot.startAt, snapshot.endAt);
  const fee = snapshot.dailyRate * days;
  const serviceFee = Math.round(fee * 0.08 * 100) / 100;
  return {
    days,
    fee,
    serviceFee,
    guarantee: snapshot.guaranteeAmount,
    total: fee + serviceFee + snapshot.guaranteeAmount,
  };
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
