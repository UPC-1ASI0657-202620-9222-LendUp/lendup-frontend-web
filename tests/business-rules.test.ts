import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canCancelReservation,
  canManageListing,
  canOperate,
  canRequestListing,
  canRetryPayment,
  canViewCounterpartyPhone,
  canViewIncident,
  canViewLoan,
  canViewReservation,
  cancellationRefund,
  counterpartOf,
  distanceKm,
  economicBreakdown,
  extensionCost,
  guaranteeAfterReturn,
  hasAcceptedTerms,
  hasReservationCollision,
  hasUnresolvedIncident,
  isInstitutionalEmail,
  isParticipant,
  isPaymentSettled,
  isPeriodAvailable,
  loanNextAction,
  mayRateLoan,
  overlaps,
  releaseFutureAvailability,
  remainingGuarantee,
  removeOperationReminders,
  rentalDays,
  replaceReservedInterval,
  roundMoney,
  shouldMarkOverdue,
  statusAfterReturnConfirmation,
  transactionRoute,
  updateReturnReminders,
  validPartialCapture,
} from '../lib/business-rules.ts';
import { en } from '../lib/i18n/en.ts';
import { es } from '../lib/i18n/es.ts';
import { universities } from '../mocks/catalog.ts';
import type {
  AvailabilitySlot,
  DemoState,
  Incident,
  Loan,
  PaymentTransaction,
  Reminder,
  Reservation,
  TermsSnapshot,
  User,
} from '../types/domain.ts';

const iso = (value: string) => new Date(value).toISOString();

const snapshot = (overrides: Partial<TermsSnapshot> = {}): TermsSnapshot => ({
  usage: 'u',
  delivery: 'd',
  returnPolicy: 'r',
  cancellation: 'c',
  dailyRate: 10,
  guaranteeAmount: 100,
  commissionRate: 0.1,
  providerFeeRate: 0,
  exchangePlace: 'Biblioteca',
  startAt: iso('2026-10-01T10:00:00Z'),
  endAt: iso('2026-10-03T10:00:00Z'),
  originalEndAt: iso('2026-10-03T10:00:00Z'),
  cancellationPolicy: { borrowerRefundRate: 1, lenderRefundRate: 1 },
  acceptedAt: iso('2026-09-28T10:00:00Z'),
  ...overrides,
});

const reservation = (overrides: Partial<Reservation> = {}) =>
  ({
    id: 'rs1',
    requestId: 'rq1',
    listingId: 'l1',
    borrowerId: 'b',
    lenderId: 'l',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    guaranteeStatus: 'PENDING',
    deliveryRecorded: false,
    createdAt: iso('2026-09-28T10:00:00Z'),
    snapshot: snapshot(),
    ...overrides,
  }) as Reservation;

const loan = (overrides: Partial<Loan> = {}) =>
  ({
    id: 'ln1',
    reservationId: 'rs1',
    listingId: 'l1',
    borrowerId: 'b',
    lenderId: 'l',
    status: 'ACTIVE',
    paymentStatus: 'PENDING_RELEASE',
    guaranteeStatus: 'HELD',
    snapshot: snapshot(),
    deliveredAt: iso('2026-10-01T10:00:00Z'),
    currentReturnAt: iso('2026-10-03T10:00:00Z'),
    originalReturnAt: iso('2026-10-03T10:00:00Z'),
    extensions: [],
    reschedules: [],
    evidence: [],
    timeline: [],
    ratedBy: [],
    ...overrides,
  }) as Loan;

const slot = (overrides: Partial<AvailabilitySlot>): AvailabilitySlot => ({
  id: 's',
  startAt: iso('2026-10-01T00:00:00Z'),
  endAt: iso('2026-10-10T00:00:00Z'),
  status: 'AVAILABLE',
  ...overrides,
});

const reminder = (overrides: Partial<Reminder>): Reminder => ({
  id: 'r',
  userId: 'b',
  operationId: 'ln1',
  listingId: 'l1',
  kind: 'RETURN',
  dueAt: iso('2026-10-03T10:00:00Z'),
  href: '/loans/ln1',
  ...overrides,
});

const incident = (overrides: Partial<Incident>) =>
  ({
    id: 'INC-1',
    loanId: 'ln1',
    status: 'OPEN',
    guaranteeAmount: 100,
    ...overrides,
  }) as Incident;

describe('Pagos y garantías — costo de la operación', () => {
  it('redondea montos a dos decimales', () => {
    assert.equal(roundMoney(10.005), 10.01);
    assert.equal(roundMoney(1.2345), 1.23);
  });

  it('cobra por cada bloque iniciado de 24 horas (R26)', () => {
    assert.equal(
      rentalDays(iso('2026-10-01T10:00:00Z'), iso('2026-10-02T10:00:00Z')),
      1,
    );
    assert.equal(
      rentalDays(iso('2026-10-01T10:00:00Z'), iso('2026-10-02T10:01:00Z')),
      2,
    );
    assert.equal(
      rentalDays(iso('2026-10-01T10:00:00Z'), iso('2026-10-01T11:00:00Z')),
      1,
    );
  });

  it('incluye la comisión de LendUp y separa la garantía (RF37)', () => {
    const result = economicBreakdown(snapshot());
    assert.equal(result.days, 2);
    assert.equal(result.fee, 20);
    assert.equal(result.commission, 2);
    assert.equal(result.rentalCharge, 22);
    assert.equal(result.guarantee, 100);
    assert.equal(result.total, 122);
    assert.equal(result.lenderPayout, 20);
  });

  it('aplica la tarifa del proveedor cuando está configurada', () => {
    const result = economicBreakdown(snapshot({ providerFeeRate: 0.05 }));
    assert.equal(result.providerFee, 1.1);
    assert.equal(result.rentalCharge, 23.1);
  });

  it('calcula el costo adicional de una extensión', () => {
    const current = iso('2026-10-03T10:00:00Z');
    assert.equal(extensionCost(current, iso('2026-10-04T10:00:00Z'), 10), 10);
    assert.equal(extensionCost(current, iso('2026-10-04T12:00:00Z'), 10), 20);
    assert.equal(extensionCost(current, iso('2026-10-02T10:00:00Z'), 10), 0);
  });

  it('solo permite reintentar pagos pendientes, fallidos o cancelados', () => {
    assert.ok(canRetryPayment('PENDING'));
    assert.ok(canRetryPayment('FAILED'));
    assert.ok(canRetryPayment('CANCELLED'));
    assert.ok(!canRetryPayment('PENDING_RELEASE'));
    assert.ok(!canRetryPayment('RELEASED'));
  });

  it('considera la reserva lista para la entrega solo con pago y garantía', () => {
    assert.ok(
      !isPaymentSettled(reservation({ paymentStatus: 'PENDING_RELEASE' })),
    );
    assert.ok(
      isPaymentSettled(
        reservation({
          paymentStatus: 'PENDING_RELEASE',
          guaranteeStatus: 'HELD',
        }),
      ),
    );
    assert.ok(
      isPaymentSettled(
        reservation({
          paymentStatus: 'PENDING_RELEASE',
          guaranteeStatus: 'NOT_REQUIRED',
          snapshot: snapshot({ guaranteeAmount: 0 }),
        }),
      ),
    );
  });
});

describe('Reservas — disponibilidad y cancelación', () => {
  it('detecta traslapes entre periodos', () => {
    const a = iso('2026-10-01T10:00:00Z');
    const b = iso('2026-10-02T10:00:00Z');
    const c = iso('2026-10-03T10:00:00Z');
    assert.ok(overlaps(a, c, b, c));
    assert.ok(!overlaps(a, b, b, c));
  });

  it('exige que el periodo esté dentro de una ventana disponible', () => {
    const slots = [slot({})];
    assert.ok(
      isPeriodAvailable(
        slots,
        iso('2026-10-02T00:00:00Z'),
        iso('2026-10-04T00:00:00Z'),
      ),
    );
    assert.ok(
      !isPeriodAvailable(
        slots,
        iso('2026-09-30T00:00:00Z'),
        iso('2026-10-02T00:00:00Z'),
      ),
    );
  });

  it('bloquea periodos que colisionan con reservas confirmadas', () => {
    const slots = [
      slot({}),
      slot({
        id: 'r',
        status: 'RESERVED',
        reservationId: 'rs9',
        startAt: iso('2026-10-03T00:00:00Z'),
        endAt: iso('2026-10-05T00:00:00Z'),
      }),
    ];
    const start = iso('2026-10-04T00:00:00Z');
    const end = iso('2026-10-06T00:00:00Z');
    assert.ok(hasReservationCollision(slots, start, end));
    assert.ok(!hasReservationCollision(slots, start, end, 'rs9'));
    assert.ok(!isPeriodAvailable(slots, start, end));
  });

  it('reemplaza el intervalo reservado al extender o reprogramar', () => {
    const slots = [
      slot({ id: 'old', status: 'RESERVED', reservationId: 'rs1' }),
    ];
    const next = replaceReservedInterval(
      slots,
      'rs1',
      iso('2026-10-01T00:00:00Z'),
      iso('2026-10-12T00:00:00Z'),
    );
    assert.equal(next.filter((item) => item.reservationId === 'rs1').length, 1);
    assert.equal(next[0].endAt, iso('2026-10-12T00:00:00Z'));
  });

  it('libera la disponibilidad restante tras una devolución anticipada', () => {
    const early = loan({
      earlyReturn: true,
      currentReturnAt: iso('2026-10-05T00:00:00Z'),
    });
    const slots = [slot({ status: 'RESERVED', reservationId: 'rs1' })];
    const result = releaseFutureAvailability(
      slots,
      early,
      iso('2026-10-03T00:00:00Z'),
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].status, 'AVAILABLE');
    assert.equal(result[0].startAt, iso('2026-10-03T00:00:00Z'));
    assert.equal(
      releaseFutureAvailability(slots, loan(), iso('2026-10-03T00:00:00Z'))
        .length,
      0,
    );
  });

  it('permite cancelar solo reservas confirmadas antes de la entrega (US14)', () => {
    assert.ok(canCancelReservation(reservation()));
    assert.ok(!canCancelReservation(reservation({ deliveryRecorded: true })));
    assert.ok(!canCancelReservation(reservation({ status: 'CANCELLED' })));
    assert.ok(!canCancelReservation(reservation({ status: 'ACTIVATED' })));
  });

  it('calcula el reembolso según la política y lo efectivamente pagado', () => {
    const paid = reservation({
      paymentStatus: 'PENDING_RELEASE',
      guaranteeStatus: 'HELD',
    });
    assert.deepEqual(cancellationRefund(paid, 'BORROWER'), {
      rentalRefund: 22,
      guaranteeRelease: 100,
    });
    const partial = reservation({
      paymentStatus: 'PENDING_RELEASE',
      snapshot: snapshot({
        cancellationPolicy: { borrowerRefundRate: 0.5, lenderRefundRate: 1 },
      }),
    });
    assert.deepEqual(cancellationRefund(partial, 'BORROWER'), {
      rentalRefund: 11,
      guaranteeRelease: 0,
    });
    assert.deepEqual(cancellationRefund(partial, 'LENDER'), {
      rentalRefund: 22,
      guaranteeRelease: 0,
    });
    assert.deepEqual(cancellationRefund(reservation(), 'BORROWER'), {
      rentalRefund: 0,
      guaranteeRelease: 0,
    });
  });
});

describe('Identidad y acceso', () => {
  const upc = universities.find((item) => item.id === 'UPC');
  const student = {
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    verified: true,
  } as User;

  it('valida el dominio institucional de la universidad elegida', () => {
    assert.ok(isInstitutionalEmail('ana@upc.edu.pe', upc));
    assert.ok(isInstitutionalEmail('ANA@UPC.EDU.PE ', upc));
    assert.ok(!isInstitutionalEmail('ana@gmail.com', upc));
    assert.ok(!isInstitutionalEmail('ana@upc.edu.pe', undefined));
  });

  it('solo estudiantes verificados, activos y con términos aceptados operan', () => {
    assert.ok(canOperate(student, true));
    assert.ok(!canOperate(student, false));
    assert.ok(!canOperate({ ...student, verified: false }, true));
    assert.ok(
      !canOperate({ ...student, accountStatus: 'SUSPENDED' } as User, true),
    );
    assert.ok(!canOperate({ ...student, role: 'ADMIN' }, true));
    assert.ok(!canOperate(undefined, true));
  });

  it('registra la aceptación por versión de términos', () => {
    const acceptances = [
      { userId: 'b', version: '1.0', acceptedAt: iso('2026-09-01T00:00:00Z') },
    ];
    assert.ok(hasAcceptedTerms(acceptances, 'b', '1.0'));
    assert.ok(!hasAcceptedTerms(acceptances, 'b', '2.0'));
    assert.ok(!hasAcceptedTerms(acceptances, 'x', '1.0'));
  });

  it('identifica participantes y contraparte', () => {
    const op = { borrowerId: 'b', lenderId: 'l' };
    assert.ok(isParticipant(op, 'b'));
    assert.ok(!isParticipant(op, 'x'));
    assert.equal(counterpartOf(op, 'b'), 'l');
    assert.equal(counterpartOf(op, 'l'), 'b');
  });

  it('restringe el acceso a reservas, préstamos e incidencias propias', () => {
    const state = {
      reservations: [reservation()],
      loans: [loan()],
    } as unknown as DemoState;
    assert.ok(canViewReservation(state, 'rs1', 'b'));
    assert.ok(!canViewReservation(state, 'rs1', 'x'));
    assert.ok(canViewLoan(state, 'ln1', 'l'));
    assert.ok(!canViewLoan(state, 'missing', 'l'));
    assert.ok(canViewIncident(state, incident({}), 'b'));
    assert.ok(!canViewIncident(state, incident({}), 'x'));
    assert.ok(!canViewIncident(state, undefined, 'b'));
  });

  it('muestra el teléfono solo durante operaciones vigentes', () => {
    assert.ok(canViewCounterpartyPhone(reservation(), 'b'));
    assert.ok(
      !canViewCounterpartyPhone(reservation({ status: 'CANCELLED' }), 'b'),
    );
    assert.ok(!canViewCounterpartyPhone(loan({ status: 'COMPLETED' }), 'l'));
    assert.ok(!canViewCounterpartyPhone(reservation(), 'x'));
  });

  it('solo el dueño gestiona su publicación y no puede solicitarla', () => {
    const listing = { ownerId: 'l', status: 'ACTIVE' as const };
    assert.ok(canManageListing(listing, 'l'));
    assert.ok(!canManageListing(listing, 'b'));
    assert.ok(!canManageListing(undefined, 'l'));
    assert.ok(canRequestListing(listing, 'b'));
    assert.ok(!canRequestListing(listing, 'l'));
    assert.ok(!canRequestListing({ ...listing, status: 'PAUSED' }, 'b'));
  });
});

describe('Préstamos — ciclo de vida', () => {
  it('marca vencido solo un préstamo activo con fecha pasada', () => {
    const due = iso('2026-10-03T10:00:00Z');
    assert.ok(shouldMarkOverdue('ACTIVE', due, iso('2026-10-03T10:01:00Z')));
    assert.ok(!shouldMarkOverdue('ACTIVE', due, iso('2026-10-03T09:59:00Z')));
    assert.ok(
      !shouldMarkOverdue('RETURN_RECORDED', due, iso('2026-10-04T00:00:00Z')),
    );
  });

  it('no finaliza si hay incidencias abiertas', () => {
    assert.equal(
      statusAfterReturnConfirmation(true),
      'RETURN_CONFIRMED_PENDING_INCIDENT',
    );
    assert.equal(statusAfterReturnConfirmation(false), 'COMPLETED');
    assert.ok(hasUnresolvedIncident(['RESOLVED', 'UNDER_REVIEW']));
    assert.ok(!hasUnresolvedIncident(['RESOLVED']));
  });

  it('retiene la garantía mientras exista una incidencia', () => {
    assert.equal(guaranteeAfterReturn(true, 100), 'HELD');
    assert.equal(guaranteeAfterReturn(false, 100), 'RELEASED');
    assert.equal(guaranteeAfterReturn(true, 0), 'NOT_REQUIRED');
  });

  it('determina la siguiente acción según el rol', () => {
    assert.equal(
      loanNextAction(loan({ status: 'PENDING_RECEIPT' }), 'b'),
      'CONFIRM_RECEIPT',
    );
    assert.equal(
      loanNextAction(loan({ status: 'PENDING_RECEIPT' }), 'l'),
      'WAIT_RECEIPT',
    );
    assert.equal(
      loanNextAction(loan({ status: 'OVERDUE' }), 'b'),
      'RECORD_RETURN',
    );
    assert.equal(
      loanNextAction(loan({ status: 'RETURN_RECORDED' }), 'l'),
      'CONFIRM_RETURN',
    );
    assert.equal(
      loanNextAction(
        loan({ status: 'RETURN_CONFIRMED_PENDING_INCIDENT' }),
        'b',
      ),
      'WAIT_INCIDENT',
    );
    assert.equal(loanNextAction(loan({ status: 'COMPLETED' }), 'b'), 'RATE');
    assert.equal(
      loanNextAction(loan({ status: 'COMPLETED', ratedBy: ['b'] }), 'b'),
      'NONE',
    );
  });

  it('permite calificar una sola vez y solo préstamos finalizados (US38)', () => {
    assert.ok(mayRateLoan(loan({ status: 'COMPLETED' }), 'b'));
    assert.ok(!mayRateLoan(loan({ status: 'COMPLETED', ratedBy: ['b'] }), 'b'));
    assert.ok(!mayRateLoan(loan({ status: 'ACTIVE' }), 'b'));
    assert.ok(!mayRateLoan(loan({ status: 'COMPLETED' }), 'x'));
  });
});

describe('Incidencias — afectación de garantía', () => {
  it('descuenta capturas previas del saldo disponible', () => {
    const incidents = [
      incident({
        id: 'INC-1',
        status: 'RESOLVED',
        resolution: { amount: 30 } as Incident['resolution'],
      }),
      incident({ id: 'INC-2', status: 'OPEN' }),
    ];
    assert.equal(remainingGuarantee(incidents, loan()), 70);
    assert.equal(remainingGuarantee(incidents, loan(), 'INC-1'), 100);
  });

  it('valida montos de afectación parcial', () => {
    assert.ok(validPartialCapture(50, 100));
    assert.ok(validPartialCapture(100, 100));
    assert.ok(!validPartialCapture(0, 100));
    assert.ok(!validPartialCapture(101, 100));
  });
});

describe('Notificaciones, recordatorios y navegación', () => {
  it('actualiza los recordatorios de devolución al cambiar la fecha', () => {
    const next = iso('2026-10-06T10:00:00Z');
    const updated = updateReturnReminders(
      [
        reminder({}),
        reminder({ id: 'r2', kind: 'PAYMENT_DUE' }),
        reminder({ id: 'r3', operationId: 'ln2' }),
      ],
      'ln1',
      next,
    );
    assert.equal(updated[0].dueAt, next);
    assert.notEqual(updated[1].dueAt, next);
    assert.notEqual(updated[2].dueAt, next);
  });

  it('elimina recordatorios de operaciones cerradas', () => {
    const list = [
      reminder({}),
      reminder({ id: 'r2', operationId: 'rs1' }),
      reminder({ id: 'r3', operationId: 'ln9' }),
    ];
    assert.deepEqual(
      removeOperationReminders(list, 'ln1', 'rs1').map((item) => item.id),
      ['r3'],
    );
  });

  it('enlaza cada transacción con su operación más específica', () => {
    const base = { id: 't' } as PaymentTransaction;
    assert.equal(
      transactionRoute({ ...base, incidentId: 'INC-1', loanId: 'ln1' }),
      '/incidents/INC-1',
    );
    assert.equal(
      transactionRoute({ ...base, loanId: 'ln1', reservationId: 'rs1' }),
      '/loans/ln1',
    );
    assert.equal(
      transactionRoute({ ...base, reservationId: 'rs1' }),
      '/reservations/rs1',
    );
    assert.equal(transactionRoute(base), '/transactions');
  });

  it('calcula distancias aproximadas entre sedes', () => {
    const upc = { lat: -12.1037, lng: -76.963 };
    const pucp = { lat: -12.0689, lng: -77.0796 };
    const km = distanceKm(upc, pucp);
    assert.ok(km > 12 && km < 14);
    assert.equal(distanceKm(upc, upc), 0);
  });
});

describe('Internacionalización', () => {
  const leaves = (value: unknown, prefix = ''): string[] =>
    typeof value === 'string'
      ? [prefix]
      : Object.entries(value as Record<string, unknown>).flatMap(
          ([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key),
        );

  it('el inglés cubre exactamente las claves del español', () => {
    assert.deepEqual(leaves(en).sort(), leaves(es).sort());
  });

  it('no hay textos vacíos y los parámetros coinciden', () => {
    const params = (text: string) =>
      (text.match(/\{\w+\}/g) ?? []).sort().join();
    const read = (source: unknown, key: string) =>
      key
        .split('.')
        .reduce<unknown>(
          (node, part) => (node as Record<string, unknown>)[part],
          source,
        ) as string;
    for (const key of leaves(es)) {
      assert.ok(read(es, key).trim(), `es.${key} vacío`);
      assert.ok(read(en, key).trim(), `en.${key} vacío`);
      assert.equal(
        params(read(en, key)),
        params(read(es, key)),
        `parámetros distintos en ${key}`,
      );
    }
  });
});
