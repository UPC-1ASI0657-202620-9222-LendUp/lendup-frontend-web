import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type { BackendRow } from '@/services/api/dto/backend';

export const reservationsService = {
  list: (rol?: 'PRESTAMISTA' | 'PRESTATARIO', signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.reservations.list, {
      query: { rol },
      signal,
    }),
  cancel: (id: string, reason?: string) =>
    gatewayRequest<BackendRow>(endpoints.reservations.cancel, {
      params: { id },
      body: { motivo_cancelacion: reason },
    }),
  contact: (id: string, signal?: AbortSignal) =>
    gatewayRequest<{ telefono?: string }>(endpoints.reservations.contact, {
      params: { id },
      signal,
    }),
};
