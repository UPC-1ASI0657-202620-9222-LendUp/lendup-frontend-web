import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapIncident,
  mapLoan,
  mapNotification,
  mapReservation,
} from '../services/api/mappers/domain.ts';
const row = {
  id: 'incident',
  prestamo_id: 'loan',
  tipo: 'DANIO',
  reportada_por_usuario_id: 'lender',
  descripcion: 'Screen damaged',
  estado: 'EN_REVISION',
  reportada_en: '2026-10-05T10:00:00',
  revision_iniciada_en: '2026-10-05T11:00:00',
  garantia_monetaria_acordada: '100.00',
  descargo: 'The screen was already damaged',
  descargo_en: '2026-10-05T10:30:00',
  evidencias: [
    {
      id: 'photo',
      etapa: 'INCIDENCIA',
      tipo: 'FOTO',
      url: 'https://res.cloudinary.com/test/photo.png',
      registrada_por_usuario_id: 'lender',
      registrada_en: '2026-10-05T10:00:00',
    },
  ],
  observaciones: [
    {
      id: 'note',
      administrador_usuario_id: 'admin',
      contenido: 'Review note',
      registrada_en: '2026-10-05T11:00:00',
    },
  ],
};
test('incident maps persisted evidence, counterpart response, notes, review and guarantee', () => {
  const incident = mapIncident(row);
  assert.equal(incident.status, 'UNDER_REVIEW');
  assert.equal(incident.guaranteeAmount, 100);
  assert.equal(incident.counterpartyStatement, row.descargo);
  assert.equal(incident.adminNotes[0].text, 'Review note');
  assert.equal(incident.evidence[0].url, row.evidencias[0].url);
  assert.equal(incident.evidence[0].phase, 'INCIDENT');
});
test('resolved incident preserves justified decision and expected remaining balance', () => {
  const incident = mapIncident({
    ...row,
    estado: 'RESUELTA',
    decision_garantia: 'AFECTACION_PARCIAL',
    monto_garantia_afectado: '20.00',
    saldo_garantia_previsto: '80.00',
    justificacion_resolucion: 'Confirmed damage',
    resuelta_por_usuario_id: 'admin',
    resuelta_en: '2026-10-06T10:00:00',
  });
  assert.equal(incident.status, 'RESOLVED');
  assert.equal(incident.resolution?.amount, 20);
  assert.equal(incident.resolution?.refundedAmount, 80);
  assert.equal(incident.resolution?.decision, 'PARTIAL');
});
test('admin incident loan keeps original agreement and comparison evidence', () => {
  const reservation = mapReservation({
    id: 'reservation',
    garantia_monetaria_acordada: '100.00',
    condiciones_uso_acordadas: 'Carefully',
  });
  const loan = mapLoan(
    {
      id: 'loan',
      reserva_id: 'reservation',
      evidencias: [
        {
          id: 'before',
          tipo: 'FOTO',
          etapa: 'ENTREGA',
          url: 'https://res.cloudinary.com/test/before.png',
        },
      ],
    },
    reservation,
  );
  assert.equal(loan.snapshot.guaranteeAmount, 100);
  assert.equal(loan.snapshot.usage, 'Carefully');
  assert.equal(loan.evidence[0].phase, 'INITIAL');
});
test('incident notifications open their incident', () =>
  assert.equal(
    mapNotification({ origen_tipo: 'INCIDENCIA', origen_id: 'incident' }).href,
    '/incidents/incident',
  ));
