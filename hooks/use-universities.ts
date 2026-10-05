import { useQuery } from '@tanstack/react-query';
import { gatewayRequest } from '@/services/api/http-client';
import { universities as campusReference } from '@/config/reference-data';
import type { University } from '@/types/domain';
export function useUniversities() {
  return useQuery({
    queryKey: ['universities'],
    queryFn: async ({ signal }) => {
      const catalog = await gatewayRequest<Omit<University, 'campuses'>[]>(
        { method: 'GET', path: '/universidades' },
        { signal, public: true },
      );
      return catalog.map((item) => ({
        ...item,
        campuses:
          campusReference.find((known) => known.id === item.id)?.campuses ?? [],
      }));
    },
    staleTime: 60_000,
  });
}
