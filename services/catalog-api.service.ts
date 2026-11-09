import { endpoints } from '@/services/api/endpoints';
import { appConfig } from '@/config/app-config';
import { isAwsCatalogEnabled } from '@/services/api/request-routing';
import {
  fromAwsPublication,
  toAwsCatalogQuery,
  toAwsPublicationBody,
} from '@/services/api/catalog-compat';
import { gatewayRequest } from '@/services/api/http-client';
import { toApiLocalDateTime } from '@/lib/dates';
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
  universidad?: string;
  campus?: string;
  ubicacion?: string;
  desde?: string;
  hasta?: string;
};

// Se conserva el contrato plano de Render hasta configurar una URL HTTPS de AWS.
const awsCatalogEnabled = isAwsCatalogEnabled(appConfig.awsApiGatewayUrl);
const adaptPublication = (row: BackendRow) =>
  awsCatalogEnabled ? fromAwsPublication(row) : row;

const catalogQuery = (query: CatalogFilters) =>
  awsCatalogEnabled
    ? toAwsCatalogQuery({
        ...query,
        desde: query.desde ? toApiLocalDateTime(query.desde) : undefined,
        hasta: query.hasta ? toApiLocalDateTime(query.hasta) : undefined,
      })
    : query;

export const backendCatalogService = {
  search: async (query: CatalogFilters = {}, signal?: AbortSignal) => {
    const rows = await gatewayRequest<BackendRow[]>(endpoints.catalog.search, {
      query: catalogQuery(query),
      signal,
    });
    const normalized = rows.map(adaptPublication);
    // /catalogo/publicaciones no ofrece aún el filtro de ubicación.
    const location = query.ubicacion?.trim().toLocaleLowerCase('es');
    return awsCatalogEnabled && location
      ? normalized.filter((row) =>
          String(row.ubicacion ?? '').toLocaleLowerCase('es').includes(location),
        )
      : normalized;
  },
  detail: async (id: string, signal?: AbortSignal) =>
    adaptPublication(
      await gatewayRequest<BackendRow>(endpoints.catalog.detail, {
        params: { id },
        signal,
      }),
    ),
  create: async (body: CreatePublicationRequestDto) =>
    adaptPublication(
      await gatewayRequest<BackendRow>(endpoints.catalog.create, {
        body: awsCatalogEnabled ? toAwsPublicationBody(body) : body,
      }),
    ),
  update: async (id: string, body: Partial<CreatePublicationRequestDto>) =>
    adaptPublication(
      await gatewayRequest<BackendRow>(endpoints.catalog.update, {
        params: { id },
        body: awsCatalogEnabled ? toAwsPublicationBody(body) : body,
      }),
    ),
  changeStatus: async (id: string, estado: 'ACTIVA' | 'PAUSADA' | 'DADA_DE_BAJA') =>
    adaptPublication(
      await gatewayRequest<BackendRow>(endpoints.catalog.changeStatus, {
        params: { id },
        body: { estado },
      }),
    ),
  availability: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.catalog.availabilityList, {
      params: { id },
      signal,
    }),
  createAvailability: (id: string, startAt: string, endAt: string) =>
    gatewayRequest<BackendRow>(endpoints.catalog.availability, {
      params: { id },
      body: {
        desde: toApiLocalDateTime(startAt),
        hasta: toApiLocalDateTime(endAt),
      },
    }),
  updateAvailability: (
    id: string,
    slotId: string,
    startAt: string,
    endAt: string,
  ) =>
    gatewayRequest<BackendRow>(endpoints.catalog.availabilityUpdate, {
      params: { id, slotId },
      body: {
        desde: toApiLocalDateTime(startAt),
        hasta: toApiLocalDateTime(endAt),
      },
    }),
  deleteAvailability: (id: string, slotId: string) =>
    gatewayRequest<void>(endpoints.catalog.availabilityDelete, {
      params: { id, slotId },
    }),
  // /terminos todavía se atiende en Render; AWS usa otro contrato.
  terms: (signal?: AbortSignal) =>
    gatewayRequest<TermsDocumentDto>(endpoints.catalog.terms, {
      signal,
      public: true,
    }),
};
