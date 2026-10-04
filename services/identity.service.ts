import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type {
  BackendRow,
  CreateStudentRequestDto,
  CurrentStudentDto,
} from '@/services/api/dto/backend';

export const identityService = {
  register: (body: CreateStudentRequestDto) =>
    gatewayRequest<BackendRow>(endpoints.identity.register, { body }),
  me: (signal?: AbortSignal) =>
    gatewayRequest<CurrentStudentDto>(endpoints.identity.me, { signal }),
  student: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow>(endpoints.identity.student, {
      params: { id },
      signal,
    }),
  updateMe: (body: {
    nombre?: string;
    universidad?: string;
    campus?: string;
    carrera?: string;
    ciclo?: number;
    telefono?: string;
    foto_url?: string;
  }) => gatewayRequest<BackendRow>(endpoints.identity.updateMe, { body }),
  requestVerification: (reference: string) =>
    gatewayRequest<BackendRow>(endpoints.identity.verification, {
      body: { verificacion_referencia: reference },
    }),
  acceptTerms: (termsVersion: string, disclaimerVersion: string) =>
    gatewayRequest<BackendRow>(endpoints.identity.acceptTerms, {
      body: {
        version_terminos_aceptada: termsVersion,
        version_descargo_aceptada: disclaimerVersion,
      },
    }),
};
