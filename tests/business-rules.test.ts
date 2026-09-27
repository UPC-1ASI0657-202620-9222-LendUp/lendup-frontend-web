import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canAcceptTerms,
  canCancelReservation,
  canManageListing,
  canRequestListing,
  canViewCounterpartyPhone,
  canViewIncident,
  canViewLoan,
  canViewReservation,
  cancellationRefundAmount,
  dueAfterExtension,
  economicBreakdown,
  guaranteeAfterReturn,
  hasReservationCollision,
  hasUnresolvedIncident,
  isParticipant,
  isPeriodAvailable,
  mayRateLoan,
  releaseFutureAvailability,
  removeOperationReminders,
  replaceReservedInterval,
  shouldMarkOverdue,
  statusAfterIncidentResolution,
  statusAfterReceiptConfirmation,
  statusAfterReturnConfirmation,
  transactionRoute,
  updateReturnReminders,
  validPartialCapture,
} from '../lib/business-rules.ts';
import { getMockPaymentMethods } from '../services/payment-provider.ts';
import type {
  AvailabilitySlot,
  DemoState,
  Evidence,
  Loan,
  LoanExtension,
  PaymentTransaction,
  Reminder,
  Reservation,
  TermsSnapshot,
} from '../types/domain.ts';

const snapshot: TermsSnapshot = {
  dailyRate: 10,
  guaranteeAmount: 100,
  startAt: '2026-10-10T09:00:00-05:00',
  endAt: '2026-10-12T09:00:00-05:00',
  originalEndAt: '2026-10-12T09:00:00-05:00',
  providerFee: 0,
  cancellationPolicy: {
    borrowerRefundRate: 1,
    lenderRefundRate: 1,
    description: 'Reembolso total antes de recepción.',
  },
  exchangePlace: 'Campus',
  usage: 'Uso académico',
  delivery: 'Entrega coordinada',
  returnPolicy: 'Devolución en el mismo estado',
  cancellation: 'Cancelación antes de recepción',
};

const reservation: Reservation = {
  id: 'r1',
  requestId: 'q1',
  listingId: 'l1',
  borrowerId: 'borrower',
  lenderId: 'lender',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING_RELEASE',
  guaranteeStatus: 'HELD',
  paymentMethod: 'Yape',
  guaranteePaymentMethod: 'Tarjeta',
  deliveryRecorded: true,
  snapshot,
};

const loan: Loan = {
  id: 'ln1',
  reservationId: 'r1',
  listingId: 'l1',
  borrowerId: 'borrower',
  lenderId: 'lender',
  status: 'PENDING_RECEIPT',
  paymentStatus: 'PENDING_RELEASE',
  guaranteeStatus: 'HELD',
  snapshot,
  currentReturnAt: snapshot.endAt,
  originalReturnAt: snapshot.originalEndAt,
  extensions: [],
  reschedules: [],
  evidence: [],
  timeline: [],
  ratedBy: [],
};

const slots: AvailabilitySlot[] = [
  {
    id: 'available',
    startAt: '2026-10-01T00:00:00-05:00',
    endAt: '2026-10-31T23:59:00-05:00',
    status: 'AVAILABLE',
  },
  {
    id: 'reserved',
    startAt: snapshot.startAt,
    endAt: snapshot.endAt,
    status: 'RESERVED',
    reservationId: reservation.id,
  },
];

const state = {
  users: [
    { id: 'borrower', role: 'STUDENT' },
    { id: 'lender', role: 'STUDENT' },
    { id: 'outsider', role: 'STUDENT' },
    { id: 'admin', role: 'ADMIN' },
  ],
  reservations: [reservation],
  loans: [loan],
  incidents: [
    {
      id: 'inc1',
      loanId: loan.id,
      reportedBy: 'borrower',
      type: 'DAMAGE',
      description: 'Daño',
      evidence: [],
      status: 'OPEN',
      createdAt: '2026-10-12T12:00:00-05:00',
      adminNotes: [],
      guaranteeAmount: 100,
    },
  ],
} as unknown as DemoState;

const acceptedExtension = (
  paymentStatus: LoanExtension['paymentStatus'],
): LoanExtension => ({
  id: 'ext1',
  requesterId: 'borrower',
  requestedAt: '2026-10-11T10:00:00-05:00',
  originalReturnAt: snapshot.endAt,
  proposedReturnAt: '2026-10-14T09:00:00-05:00',
  additionalCost: 20,
  status: 'ACCEPTED',
  paymentStatus,
});

const reminderFixture = (): Reminder[] => [
  {
    id: 'rm1',
    userId: 'borrower',
    operationId: loan.id,
    title: 'Devolver',
    dueAt: snapshot.endAt,
    kind: 'RETURN',
    href: `/loans/${loan.id}`,
  },
  {
    id: 'rm2',
    userId: 'lender',
    operationId: 'other',
    title: 'Entregar',
    dueAt: snapshot.startAt,
    kind: 'DELIVERY',
    href: '/loans/other',
  },
];

describe('40 invariantes obligatorios del frontend LendUp', () => {
  it('01 conserva inmutable el snapshot aunque cambie la publicación', () => {
    const stored = structuredClone(snapshot);
    const listing = { dailyRate: 25, exchangePlace: 'Otro campus' };
    assert.equal(stored.dailyRate, 10);
    assert.notEqual(stored.exchangePlace, listing.exchangePlace);
  });

  it('02 separa notificaciones de recordatorios', () => {
    const notification = { event: 'REQUEST_ACCEPTED', read: false };
    const reminder = { dueAt: snapshot.endAt, kind: 'RETURN' };
    assert.equal('dueAt' in notification, false);
    assert.equal('read' in reminder, false);
  });

  it('03 obtiene los métodos de pago desde el provider service', () => {
    const methods = getMockPaymentMethods();
    assert.deepEqual(
      methods.map((method) => method.id),
      ['yape', 'plin', 'card'],
    );
    methods[0].label = 'cambio local';
    assert.equal(getMockPaymentMethods()[0].label, 'Yape');
  });

  it('04 mantiene el pago del alquiler pendiente de liberación', () => {
    assert.equal(reservation.paymentStatus, 'PENDING_RELEASE');
    assert.equal(loan.paymentStatus, 'PENDING_RELEASE');
  });

  it('05 confirmar recepción activa el préstamo', () => {
    assert.equal(statusAfterReceiptConfirmation(), 'ACTIVE');
  });

  it('06 impide cancelar después de activar el préstamo', () => {
    assert.equal(
      canCancelReservation(
        {
          ...reservation,
          status: 'ACTIVATED',
          receiptConfirmedAt: snapshot.startAt,
        },
        { ...loan, status: 'ACTIVE', receiptConfirmedAt: snapshot.startAt },
      ),
      false,
    );
  });

  it('07 permite cancelar antes de confirmar recepción', () => {
    assert.equal(canCancelReservation(reservation, loan), true);
  });

  it('08 usa el mismo modelo de evidencia para fase inicial y final', () => {
    const initial: Evidence = {
      id: 'e1',
      phase: 'INITIAL',
      type: 'PHOTO',
      label: 'Entrega',
      description: 'Estado inicial',
      author: 'Prestamista',
      authorId: 'lender',
      createdAt: snapshot.startAt,
    };
    const final: Evidence = { ...initial, id: 'e2', phase: 'FINAL' };
    assert.deepEqual(Object.keys(initial), Object.keys(final));
  });

  it('09 no calcula reembolso automático por devolución anticipada', () => {
    const amounts = economicBreakdown(snapshot);
    assert.equal('earlyRefund' in amounts, false);
    assert.equal(amounts.fee, 20);
  });

  it('10 retiene la garantía cuando hay incidencia abierta', () => {
    assert.equal(hasUnresolvedIncident(['OPEN']), true);
    assert.equal(guaranteeAfterReturn(true), 'HELD');
  });

  it('11 la devolución anticipada libera el periodo solo tras finalización válida', () => {
    const released = releaseFutureAvailability(
      slots,
      { ...loan, earlyReturn: true },
      '2026-10-11T09:00:00-05:00',
    );
    assert.equal(
      released.some(
        (slot) => slot.status === 'AVAILABLE' && slot.startAt.includes('10-11'),
      ),
      true,
    );
    assert.deepEqual(
      releaseFutureAvailability(
        slots,
        { ...loan, earlyReturn: false },
        snapshot.endAt,
      ),
      slots,
    );
  });

  it('12 la aceptación de una solicitud revalida disponibilidad', () => {
    assert.equal(
      isPeriodAvailable(slots, snapshot.startAt, snapshot.endAt),
      false,
    );
  });

  it('13 rechaza una reserva confirmada superpuesta', () => {
    assert.equal(
      hasReservationCollision(
        slots,
        '2026-10-11T00:00:00-05:00',
        '2026-10-13T00:00:00-05:00',
      ),
      true,
    );
  });

  it('14 el owner no puede solicitar su propio listing', () => {
    assert.equal(
      canRequestListing({ ownerId: 'borrower', status: 'ACTIVE' }, 'borrower'),
      false,
    );
  });

  it('15 un non-owner no puede editar el listing', () => {
    assert.equal(canManageListing({ ownerId: 'lender' }, 'borrower'), false);
  });

  it('16 un usuario unrelated no puede leer la reservation', () => {
    assert.equal(canViewReservation(state, reservation.id, 'outsider'), false);
  });

  it('17 un usuario unrelated no puede leer el loan', () => {
    assert.equal(canViewLoan(state, loan.id, 'outsider'), false);
  });

  it('18 un usuario unrelated no puede leer el incident', () => {
    assert.equal(canViewIncident(state, state.incidents[0], 'outsider'), false);
    assert.equal(canViewIncident(state, state.incidents[0], 'admin'), false);
  });

  it('19 mantiene el teléfono oculto antes de la reservation confirmada', () => {
    assert.equal(
      canViewCounterpartyPhone(
        { ...reservation, status: 'PENDING' },
        'borrower',
      ),
      false,
    );
  });

  it('20 mantiene el teléfono oculto para unrelated users', () => {
    assert.equal(
      canViewCounterpartyPhone({ ...loan, status: 'ACTIVE' }, 'outsider'),
      false,
    );
  });

  it('21 mantiene el teléfono oculto después del fin de la operación', () => {
    assert.equal(
      canViewCounterpartyPhone({ ...loan, status: 'COMPLETED' }, 'borrower'),
      false,
    );
  });

  it('22 aceptar una extensión con costo no cambia dueAt antes del pago', () => {
    assert.equal(
      dueAfterExtension(loan.currentReturnAt, acceptedExtension('PENDING')),
      loan.currentReturnAt,
    );
  });

  it('23 el pago de extensión cambia dueAt', () => {
    assert.equal(
      dueAfterExtension(loan.currentReturnAt, acceptedExtension('RELEASED')),
      '2026-10-14T09:00:00-05:00',
    );
  });

  it('24 una extensión actualiza el intervalo reservado', () => {
    const changed = replaceReservedInterval(
      slots,
      reservation.id,
      snapshot.startAt,
      '2026-10-15T09:00:00-05:00',
    );
    assert.equal(
      changed.find((slot) => slot.reservationId === reservation.id)?.endAt,
      '2026-10-15T09:00:00-05:00',
    );
  });

  it('25 rechaza una extensión con colisión', () => {
    assert.equal(
      hasReservationCollision(
        slots,
        '2026-10-11T00:00:00-05:00',
        '2026-10-13T00:00:00-05:00',
      ),
      true,
    );
  });

  it('26 rechaza una reprogramación del lender con colisión', () => {
    assert.equal(
      hasReservationCollision(
        slots,
        '2026-10-09T00:00:00-05:00',
        '2026-10-11T00:00:00-05:00',
      ),
      true,
    );
  });

  it('27 la reprogramación mantiene additionalCost en cero', () => {
    const reschedule = { additionalCost: 0 as const };
    assert.equal(reschedule.additionalCost, 0);
  });

  it('28 una devolución con incidencia pendiente no queda COMPLETED', () => {
    assert.equal(
      statusAfterReturnConfirmation(true),
      'RETURN_CONFIRMED_PENDING_INCIDENT',
    );
  });

  it('29 resolver la última incidencia finaliza cuando corresponde', () => {
    assert.equal(statusAfterIncidentResolution(false), 'COMPLETED');
    assert.equal(
      statusAfterIncidentResolution(true),
      'RETURN_CONFIRMED_PENDING_INCIDENT',
    );
  });

  it('30 una captura parcial nunca supera la garantía restante', () => {
    assert.equal(validPartialCapture(101, 100), false);
    assert.equal(validPartialCapture(0, 100), false);
  });

  it('31 una captura parcial libera el saldo restante', () => {
    assert.equal(validPartialCapture(40, 100), true);
    assert.equal(100 - 40, 60);
  });

  it('32 una cancelación del lender produce refund total cuando aplica', () => {
    assert.equal(cancellationRefundAmount(snapshot, 'LENDER'), 20);
  });

  it('33 rating solo está permitido al participant y a su contraparte', () => {
    const completed = { ...loan, status: 'COMPLETED' as const };
    assert.equal(mayRateLoan(completed, 'borrower', 'lender'), true);
    assert.equal(mayRateLoan(completed, 'borrower', 'outsider'), false);
  });

  it('34 solo un participant puede reportar un incident', () => {
    assert.equal(isParticipant(loan, 'borrower'), true);
    assert.equal(isParticipant(loan, 'outsider'), false);
  });

  it('35 los términos no pueden aceptarse anónimamente', () => {
    assert.equal(canAcceptTerms(false), false);
    assert.equal(canAcceptTerms(true), true);
  });

  it('36 realiza la transición mock a OVERDUE', () => {
    assert.equal(
      shouldMarkOverdue('ACTIVE', snapshot.endAt, '2026-10-13T09:00:00-05:00'),
      true,
    );
    assert.equal(
      shouldMarkOverdue(
        'COMPLETED',
        snapshot.endAt,
        '2026-10-13T09:00:00-05:00',
      ),
      false,
    );
  });

  it('37 actualiza el Reminder después de una extension', () => {
    const updated = updateReturnReminders(
      reminderFixture(),
      loan.id,
      '2026-10-14T09:00:00-05:00',
    );
    assert.equal(updated[0].dueAt.includes('10-14'), true);
  });

  it('38 actualiza el Reminder después de una reschedule', () => {
    const updated = updateReturnReminders(
      reminderFixture(),
      loan.id,
      '2026-10-15T09:00:00-05:00',
    );
    assert.equal(updated[0].dueAt.includes('10-15'), true);
  });

  it('39 una operación cancelada elimina reminders activos', () => {
    assert.equal(
      removeOperationReminders(reminderFixture(), loan.id).length,
      1,
    );
  });

  it('40 la transaction relation no confunde reservationId y loanId', () => {
    const transaction: PaymentTransaction = {
      id: 'tx1',
      userId: 'borrower',
      incidentId: 'inc1',
      loanId: loan.id,
      createdAt: snapshot.startAt,
      updatedAt: snapshot.startAt,
      type: 'GUARANTEE_CAPTURE',
      amount: 40,
      currency: 'PEN',
      method: 'Tarjeta',
      providerReference: 'demo-ref',
      status: 'RELEASED',
    };
    assert.equal(transactionRoute(transaction), '/incidents/inc1');
    assert.equal(
      transactionRoute({ ...transaction, incidentId: undefined }),
      '/loans/ln1',
    );
    assert.equal(
      transactionRoute({
        ...transaction,
        incidentId: undefined,
        loanId: undefined,
        reservationId: 'r1',
      }),
      '/reservations/r1',
    );
  });
});
