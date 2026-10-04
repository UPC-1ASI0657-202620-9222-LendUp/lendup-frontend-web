import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type { BackendRow } from '@/services/api/dto/backend';

const postWithoutBody = (
  endpoint: (typeof endpoints.loans)[keyof typeof endpoints.loans],
  id: string,
) => gatewayRequest<BackendRow>(endpoint, { params: { id } });

export const loansService = {
  list: (estado?: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.loans.list, {
      query: { estado },
      signal,
    }),
  detail: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow>(endpoints.loans.detail, {
      params: { id },
      signal,
    }),
  calendar: (signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.loans.calendar, { signal }),
  delivery: (id: string) => postWithoutBody(endpoints.loans.delivery, id),
  receipt: (id: string) => postWithoutBody(endpoints.loans.receipt, id),
  returnLoan: (id: string) => postWithoutBody(endpoints.loans.returnRecord, id),
  confirmReturn: (id: string) =>
    postWithoutBody(endpoints.loans.returnConfirmation, id),
  requestExtension: (
    id: string,
    body: {
      fecha_propuesta_en: string;
      costo_adicional: number;
      moneda: 'PEN';
    },
  ) =>
    gatewayRequest<BackendRow>(endpoints.loans.extensions, {
      params: { id },
      body,
    }),
  respondExtension: (
    id: string,
    subid: string,
    estado: 'RECHAZADA' | 'ACEPTADA_PENDIENTE_PAGO',
    reason?: string,
  ) =>
    gatewayRequest<BackendRow>(endpoints.loans.extensionResponse, {
      params: { id, subid },
      body: { estado, motivo_rechazo: reason },
    }),
  proposeReschedule: (id: string, fecha: string) =>
    gatewayRequest<BackendRow>(endpoints.loans.reschedules, {
      params: { id },
      body: { fecha_propuesta_en: fecha },
    }),
  respondReschedule: (
    id: string,
    subid: string,
    estado: 'RECHAZADA' | 'APLICADA',
    reason?: string,
  ) =>
    gatewayRequest<BackendRow>(endpoints.loans.rescheduleResponse, {
      params: { id, subid },
      body: { estado, motivo_rechazo: reason },
    }),
  extensionQuote: (id: string) =>
    postWithoutBody(endpoints.loans.extensionQuote, id),
  paymentQuote: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow>(endpoints.loans.paymentQuote, {
      params: { id },
      signal,
    }),
};
