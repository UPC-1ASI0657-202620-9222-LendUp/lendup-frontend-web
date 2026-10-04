import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type { BackendRow } from '@/services/api/dto/backend';

export const reputationService = {
  get: (studentId: string, signal?: AbortSignal) =>
    gatewayRequest<{
      usuario_id: string;
      cantidad: number;
      promedio: number;
      calificaciones: BackendRow[];
    }>(endpoints.reputation.profile, { params: { id: studentId }, signal }),
  rate: (loanId: string, score: number, comment?: string) =>
    gatewayRequest<BackendRow>(endpoints.reputation.rate, {
      params: { id: loanId },
      body: { puntaje: score, comentario: comment },
    }),
};
