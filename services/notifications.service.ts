import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type { BackendRow } from '@/services/api/dto/backend';

export const notificationsService = {
  list: (signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.notifications.list, { signal }),
  markRead: (id: string) =>
    gatewayRequest<BackendRow>(endpoints.notifications.markRead, {
      params: { id },
    }),
};
