import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type { BackendRow } from '@/services/api/dto/backend';

export const evidenceService = {
  create: (
    loanId: string,
    body: {
      etapa: 'ENTREGA' | 'DEVOLUCION' | 'INCIDENCIA';
      tipo: 'FOTO' | 'VIDEO' | 'OBSERVACION';
      incidencia_id?: string;
      url?: string;
      cloudinary_public_id?: string;
      observacion?: string;
    },
  ) =>
    gatewayRequest<BackendRow>(endpoints.evidence.upload, {
      params: { id: loanId },
      body,
    }),
  analyze: (
    loanId: string,
    initialId: string,
    finalId: string,
    incidentId?: string,
  ) =>
    gatewayRequest<BackendRow>(endpoints.evidence.analysis, {
      params: { id: loanId },
      body: {
        evidencia_inicial_id: initialId,
        evidencia_final_id: finalId,
        incidencia_id: incidentId,
      },
    }),
  reportIncident: (loanId: string, tipo: string, descripcion: string) =>
    gatewayRequest<BackendRow>(endpoints.evidence.reportIncident, {
      body: { prestamo_id: loanId, tipo, descripcion },
    }),
  incident: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow>(endpoints.evidence.incident, {
      params: { id },
      signal,
    }),
  adminIncidents: (
    query: { estado?: string; tipo?: string } = {},
    signal?: AbortSignal,
  ) =>
    gatewayRequest<BackendRow[]>(endpoints.evidence.adminIncidents, {
      query,
      signal,
    }),
  resolve: (
    id: string,
    body: {
      justificacion_resolucion: string;
      decision_garantia:
        | 'SIN_AFECTACION'
        | 'AFECTACION_PARCIAL'
        | 'AFECTACION_TOTAL';
      monto_garantia_afectado: number;
      saldo_garantia_previsto: number;
      moneda: 'PEN';
    },
  ) =>
    gatewayRequest<BackendRow>(endpoints.evidence.adminResolution, {
      params: { id },
      body,
    }),
};
