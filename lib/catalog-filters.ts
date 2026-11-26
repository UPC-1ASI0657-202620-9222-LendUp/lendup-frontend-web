import { categoryIds } from '../config/reference-data.ts';
import type { CategoryCode } from '../types/domain.ts';

export interface CatalogFilterValues {
  query: string;
  category: CategoryCode | '';
  universityId: string;
  campus: string;
  location: string;
  from: string;
  to: string;
}

export function toCatalogQuery(filters: CatalogFilterValues) {
  const validPeriod =
    Boolean(filters.from) &&
    Boolean(filters.to) &&
    new Date(filters.from) < new Date(filters.to);
  return {
    nombre: filters.query.trim() || undefined,
    categoriaId: filters.category ? categoryIds[filters.category] : undefined,
    universidad: filters.universityId || undefined,
    campus: filters.campus.trim() || undefined,
    desde: validPeriod ? filters.from : undefined,
    hasta: validPeriod ? filters.to : undefined,
  };
}
