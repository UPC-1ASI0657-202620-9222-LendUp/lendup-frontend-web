import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import type {
  BackendRow,
  CreatePublicationRequestDto,
} from '@/services/api/dto/backend';

export interface TermsDocumentDto {
  titulo: string;
  version_terminos: string;
  version_descargo: string;
  publicado_en: string;
  idioma: string;
  contenido: string;
}

export type CatalogFilters = {
  nombre?: string;
  categoria?: string;
  campus?: string;
  desde?: string;
  hasta?: string;
};

export const backendCatalogService = {
  search: (query: CatalogFilters = {}, signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.catalog.search, { query, signal }),
  detail: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow>(endpoints.catalog.detail, {
      params: { id },
      signal,
    }),
  create: (body: CreatePublicationRequestDto) =>
    gatewayRequest<BackendRow>(endpoints.catalog.create, { body }),
  update: (id: string, body: Partial<CreatePublicationRequestDto>) =>
    gatewayRequest<BackendRow>(endpoints.catalog.update, {
      params: { id },
      body,
    }),
  changeStatus: (id: string, estado: 'ACTIVA' | 'PAUSADA' | 'DADA_DE_BAJA') =>
    gatewayRequest<BackendRow>(endpoints.catalog.changeStatus, {
      params: { id },
      body: { estado },
    }),
  terms: (signal?: AbortSignal) =>
    gatewayRequest<TermsDocumentDto>(endpoints.catalog.terms, {
      signal,
      public: true,
    }),
};
