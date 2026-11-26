import { endpoints } from '@/services/api/endpoints';
import { gatewayRequest } from '@/services/api/http-client';
import { toApiLocalDateTime } from '@/lib/dates';
import type {
  BackendRow,
  CreatePublicationRequestDto,
  PublicationSnapshotDto,
  UpdatePublicationRequestDto,
} from '@/services/api/dto/backend';

export type CatalogFilters = {
  nombre?: string;
  categoriaId?: string;
  universidad?: string;
  campus?: string;
  desde?: string;
  hasta?: string;
};

// Catálogo no incluye las fotos en la publicación: se piden aparte y se
// adjuntan como `imagenes` para que el mapper las trate como una sola fila.
async function withImages(
  rows: BackendRow[],
  signal?: AbortSignal,
): Promise<BackendRow[]> {
  return Promise.all(
    rows.map(async (row) => {
      try {
        const imagenes = await gatewayRequest<BackendRow[]>(
          endpoints.catalog.images,
          {
            params: { id: typeof row.id === 'string' ? row.id : '' },
            signal,
            public: true,
          },
        );
        return { ...row, imagenes };
      } catch {
        return row;
      }
    }),
  );
}

export const backendCatalogService = {
  search: async (query: CatalogFilters = {}, signal?: AbortSignal) =>
    withImages(
      await gatewayRequest<BackendRow[]>(endpoints.catalog.search, {
        query,
        signal,
        public: true,
      }),
      signal,
    ),
  mine: async (signal?: AbortSignal) =>
    withImages(
      await gatewayRequest<BackendRow[]>(endpoints.catalog.mine, { signal }),
      signal,
    ),
  // Públicas + propias (las pausadas solo aparecen en /mis-publicaciones).
  listings: async (signal?: AbortSignal) => {
    const [publicRows, ownRows] = await Promise.all([
      backendCatalogService.search({}, signal),
      backendCatalogService.mine(signal).catch(() => [] as BackendRow[]),
    ]);
    const ids = new Set(publicRows.map((row) => row.id));
    return [...publicRows, ...ownRows.filter((row) => !ids.has(row.id))];
  },
  categories: (signal?: AbortSignal) =>
    gatewayRequest<BackendRow[]>(endpoints.catalog.categories, {
      signal,
      public: true,
    }),
  detail: (id: string, signal?: AbortSignal) =>
    gatewayRequest<BackendRow>(endpoints.catalog.detail, {
      params: { id },
      signal,
      public: true,
    }),
  snapshot: (id: string, startAt: string, endAt: string) =>
    gatewayRequest<PublicationSnapshotDto>(endpoints.catalog.snapshot, {
      params: { id },
      query: {
        desde: toApiLocalDateTime(startAt),
        hasta: toApiLocalDateTime(endAt),
      },
      public: true,
    }),
  create: (body: CreatePublicationRequestDto) =>
    gatewayRequest<BackendRow>(endpoints.catalog.create, { body }),
  update: (id: string, body: UpdatePublicationRequestDto) =>
    gatewayRequest<BackendRow>(endpoints.catalog.update, {
      params: { id },
      body,
    }),
  changeStatus: (id: string, estado: 'ACTIVA' | 'PAUSADA' | 'DADA_DE_BAJA') =>
    gatewayRequest<BackendRow>(endpoints.catalog.changeStatus, {
      params: { id },
      body: { estado },
    }),
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
};
