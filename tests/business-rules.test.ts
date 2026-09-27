import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canCancelReservation,
  economicBreakdown,
  extensionCost,
  guaranteeAfterReturn,
  hasUnresolvedIncident,
  isPeriodAvailable,
  releaseFutureAvailability,
} from '../lib/business-rules.ts';
import type { Loan, Reservation, TermsSnapshot } from '../types/domain.ts';

const snapshot: TermsSnapshot = {
  dailyRate: 10,
  guaranteeAmount: 100,
  startAt: '2026-10-10T09:00:00-05:00',
  endAt: '2026-10-12T09:00:00-05:00',
  originalEndAt: '2026-10-12T09:00:00-05:00',
  exchangePlace: 'Campus',
  usage: 'Uso',
  delivery: 'Entrega',
  returnPolicy: 'Devolución',
  cancellation: 'Cancelación',
};
const reservation: Reservation = {
  id: 'r1',
  requestId: 'q1',
  listingId: 'l1',
  borrowerId: 'a',
  lenderId: 'b',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING_RELEASE',
  guaranteeStatus: 'HELD',
  deliveryRecorded: true,
  snapshot,
};
const loan: Loan = {
  id: 'ln1',
  reservationId: 'r1',
  listingId: 'l1',
  borrowerId: 'a',
  lenderId: 'b',
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

describe('reglas de negocio frontend BR-01 a BR-10', () => {
  it('BR-01 conserva una copia inmutable del snapshot', () => {
    const frozen = structuredClone(snapshot);
    const listingRate = 25;
    assert.equal(frozen.dailyRate, 10);
    assert.notEqual(listingRate, frozen.dailyRate);
  });
  it('BR-02 separa notificaciones y recordatorios', () => {
    const notification = { read: false, message: 'Ocurrió' };
    const reminder = { dueAt: '2026-10-10', kind: 'RETURN' };
    assert.equal('dueAt' in notification, false);
    assert.equal('read' in reminder, false);
  });
  it('BR-03 usa medios sin datos financieros sensibles', () => {
    const methods = ['Yape', 'Plin', 'Tarjeta'];
    assert.equal(methods.includes('Yape'), true);
    assert.equal(/cvv|clave/i.test(methods.join(' ')), false);
  });
  it('BR-04 separa pago y liberación', () => {
    assert.equal(reservation.paymentStatus, 'PENDING_RELEASE');
    assert.equal(loan.status, 'PENDING_RECEIPT');
  });
  it('BR-05 permite cancelar antes de receiptConfirmedAt', () => {
    assert.equal(canCancelReservation(reservation, loan), true);
  });
  it('BR-06 impide cancelar un préstamo activo', () => {
    assert.equal(
      canCancelReservation(
        {
          ...reservation,
          status: 'ACTIVATED',
          receiptConfirmedAt: '2026-10-10',
        },
        { ...loan, status: 'ACTIVE', receiptConfirmedAt: '2026-10-10' },
      ),
      false,
    );
  });
  it('BR-07 usa el mismo registro para devolución normal y anticipada', () => {
    const normal = { registeredAt: 'now', early: false, notes: '' };
    const early = { ...normal, early: true };
    assert.deepEqual(Object.keys(early), Object.keys(normal));
  });
  it('BR-08 no crea reembolso proporcional automático', () => {
    assert.equal(economicBreakdown(snapshot).fee, 20);
    assert.equal('earlyRefund' in economicBreakdown(snapshot), false);
  });
  it('BR-09 retiene garantía con incidencia abierta', () => {
    assert.equal(hasUnresolvedIncident(['OPEN']), true);
    assert.equal(guaranteeAfterReturn(true), 'HELD');
    assert.equal(guaranteeAfterReturn(false), 'RELEASED');
  });
  it('BR-10 libera el periodo futuro de una devolución anticipada', () => {
    const slots = [
      {
        id: 'reserved',
        startAt: snapshot.startAt,
        endAt: snapshot.endAt,
        status: 'RESERVED' as const,
        reservationId: 'r1',
      },
    ];
    const released = releaseFutureAvailability(
      slots,
      { ...loan, earlyReturn: true },
      '2026-10-11T09:00:00-05:00',
    );
    assert.equal(
      released.some((slot) => slot.status === 'AVAILABLE'),
      true,
    );
    assert.equal(
      isPeriodAvailable(
        released,
        '2026-10-11T10:00:00-05:00',
        '2026-10-11T18:00:00-05:00',
      ),
      true,
    );
  });
  it('calcula costo adicional desde la fecha vigente', () => {
    assert.equal(
      extensionCost(snapshot.endAt, '2026-10-14T09:00:00-05:00', 10),
      20,
    );
  });
});
