import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapNotification,
  mapTransaction,
} from '../services/api/mappers/domain.ts';
import {
  checkoutOutcome,
  isTrustedCheckoutUrl,
} from '../lib/payments-checkout.ts';

const transaction = (fields: Record<string, unknown>) =>
  mapTransaction(
    {
      id: 'tx',
      prestamo_id: 'loan',
      monto: 60,
      solicitada_en: '2026-11-02T15:00:00Z',
      actualizada_en: '2026-11-02T15:00:00Z',
      ...fields,
    },
    'borrower',
  );

test('confirmed payments-service transactions map by type', () => {
  assert.equal(
    transaction({ tipo: 'PAGO_TARIFA', estado: 'CONFIRMADA' }).status,
    'PENDING_RELEASE',
  );
  assert.equal(
    transaction({ tipo: 'CONSTITUCION_GARANTIA', estado: 'CONFIRMADA' }).status,
    'HELD',
  );
  assert.deepEqual(
    [
      transaction({ tipo: 'LIBERACION_TARIFA', estado: 'CONFIRMADA' }),
      transaction({ tipo: 'DEVOLUCION_GARANTIA', estado: 'CONFIRMADA' }),
      transaction({ tipo: 'REEMBOLSO_TARIFA', estado: 'CONFIRMADA' }),
    ].map((item) => [item.type, item.status]),
    [
      ['RENTAL_RELEASE', 'RELEASED'],
      ['GUARANTEE_RELEASE', 'RELEASED'],
      ['REFUND', 'REFUNDED'],
    ],
  );
  assert.equal(
    transaction({ tipo: 'PAGO_TARIFA', estado: 'RECHAZADA' }).status,
    'FAILED',
  );
  assert.equal(
    transaction({ tipo: 'PAGO_TARIFA', estado: 'PENDIENTE' }).status,
    'PENDING',
  );
});

test('a confirmed guarantee payment follows its guarantee', () => {
  assert.equal(
    transaction({
      tipo: 'CONSTITUCION_GARANTIA',
      estado: 'CONFIRMADA',
      garantia: { estado: 'AFECTADA_PARCIALMENTE' },
    }).status,
    'PARTIALLY_CAPTURED',
  );
  assert.equal(
    transaction({
      tipo: 'CONSTITUCION_GARANTIA',
      estado: 'CONFIRMADA',
      garantia: { estado: 'DEVUELTA' },
    }).status,
    'RELEASED',
  );
});

test('sprint 1 transaction states are still understood', () =>
  assert.equal(
    transaction({ tipo: 'PAGO_TARIFA', estado: 'PENDIENTE_LIBERACION' }).status,
    'PENDING_RELEASE',
  ));

test('notifications from every service open a page', () => {
  const href = (origin: string) =>
    mapNotification({ origen_tipo: origin, origen_id: 'origin' }).href;
  assert.equal(href('SOLICITUD'), '/requests');
  assert.equal(href('RESERVA'), '/reservations/origin');
  assert.equal(href('PRESTAMO'), '/loans/origin');
  assert.equal(href('EXTENSION'), '/loans');
  assert.equal(href('PAGO'), '/transactions');
  assert.equal(href('GARANTIA'), '/transactions');
  assert.equal(href('OTRO'), '/notifications');
});

test('only https Mercado Pago pages are followed after creating a payment', () => {
  assert.ok(
    isTrustedCheckoutUrl(
      'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=123',
    ),
  );
  assert.ok(
    isTrustedCheckoutUrl(
      'https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=123',
    ),
  );
  for (const url of [
    'http://www.mercadopago.com.pe/checkout',
    'https://mercadopago.com.pe.evil.example/checkout',
    'https://evilmercadopago.com/checkout',
    'javascript:alert(1)',
    '',
    undefined,
  ])
    assert.equal(isTrustedCheckoutUrl(url), false, String(url));
});

test('the return page trusts the transaction state, not the URL', () => {
  assert.equal(checkoutOutcome('CONFIRMADA'), 'CONFIRMED');
  assert.equal(checkoutOutcome('RECHAZADA'), 'REJECTED');
  assert.equal(checkoutOutcome('CANCELADA'), 'REJECTED');
  assert.equal(checkoutOutcome('PENDIENTE'), 'PENDING');
  assert.equal(checkoutOutcome(undefined), 'PENDING');
});
