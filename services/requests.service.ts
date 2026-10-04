import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type { BackendRow } from '@/services/api/dto/backend';

export const requestsService = {
  list: (
    query: { rol?: 'PRESTAMISTA' | 'PRESTATARIO'; estado?: string } = {},
    signal?: AbortSignal,
  ) => gatewayRequest<BackendRow[]>(endpoints.requests.list, { query, signal }),
  detail: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow>(endpoints.requests.detail, {
      params: { id },
      signal,
    }),
  create: (publicacionId: string, desde: string, hasta: string) =>
    gatewayRequest<BackendRow>(endpoints.requests.createRequest, {
      body: { publicacion_id: publicacionId, desde, hasta },
    }),
  accept: (id: string) =>
    gatewayRequest<BackendRow>(endpoints.requests.acceptRequest, {
      params: { id },
    }),
  reject: (id: string, reason?: string) =>
    gatewayRequest<BackendRow>(endpoints.requests.rejectRequest, {
      params: { id },
      body: { motivo_rechazo: reason },
    }),
  cancel: (id: string, reason?: string) =>
    gatewayRequest<BackendRow>(endpoints.requests.cancelRequest, {
      params: { id },
      body: { motivo_cancelacion: reason },
    }),
};
