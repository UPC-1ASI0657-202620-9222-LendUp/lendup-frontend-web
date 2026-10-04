import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type { BackendRow } from '@/services/api/dto/backend';

export const backendPaymentsService = {
  methods: (signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.payments.methods, { signal }),
  pay: (body: {
    prestamo_id: string;
    cambio_fecha_prestamo_id?: string;
    tipo: 'PAGO_TARIFA' | 'PAGO_EXTENSION';
    monto: number;
    medio_pago_seleccionado: string;
    clave_idempotencia: string;
  }) => gatewayRequest<BackendRow>(endpoints.payments.pay, { body }),
  guarantee: (prestamoId: string, method: string, idempotencyKey: string) =>
    gatewayRequest<BackendRow>(endpoints.payments.guarantee, {
      body: {
        prestamo_id: prestamoId,
        medio_pago_seleccionado: method,
        clave_idempotencia: idempotencyKey,
      },
    }),
  transactions: (loanId: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.payments.loanTransactions, {
      params: { id: loanId },
      signal,
    }),
};
