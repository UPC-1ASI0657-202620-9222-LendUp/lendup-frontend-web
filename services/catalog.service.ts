import { categories, conditions, universities } from '@/config/reference-data';
import { distanceKm, isPeriodAvailable } from '@/lib/business-rules';
import { backendCatalogService } from '@/services/catalog-api.service';
import { toCatalogQuery } from '@/lib/catalog-filters';
import { mapListing } from '@/services/api/mappers/domain';
import type {
  CategoryCode,
  Coordinates,
  Listing,
  University,
} from '@/types/domain';

export interface ListingFilters {
  query: string;
  category: CategoryCode | '';
  universityId: string;
  campus: string;
  location: string;
  from: string;
  to: string;
}

export const emptyListingFilters: ListingFilters = {
  query: '',
  category: '',
  universityId: '',
  campus: '',
  location: '',
  from: '',
  to: '',
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function findUniversity(id: string): University | undefined {
  return universities.find((university) => university.id === id);
}

export function campusCoordinates(
  universityId: string,
  campus: string,
): Coordinates | undefined {
  return findUniversity(universityId)?.campuses.find(
    (candidate) => candidate.name === campus,
  )?.coordinates;
}

export function matchesFilters(
  listing: Listing,
  filters: ListingFilters,
  categoryLabel: (code: CategoryCode) => string,
) {
  const text = normalize(
    `${listing.title} ${listing.description} ${categoryLabel(listing.category)}`,
  );
  const query = normalize(filters.query);
  const period =
    filters.from && filters.to && new Date(filters.to) > new Date(filters.from)
      ? isPeriodAvailable(
          listing.availabilitySlots,
          new Date(filters.from).toISOString(),
          new Date(filters.to).toISOString(),
        )
      : true;
  return (
    (!query || query.split(/\s+/).every((word) => text.includes(word))) &&
    (!filters.category || listing.category === filters.category) &&
    (!filters.universityId || listing.universityId === filters.universityId) &&
    (!filters.campus || listing.campus === filters.campus) &&
    (!filters.location ||
      normalize(listing.location).includes(normalize(filters.location))) &&
    period
  );
}

export function sortByDistance(listings: Listing[], origin: Coordinates) {
  return listings
    .map((listing) => {
      const coordinates = campusCoordinates(
        listing.universityId,
        listing.campus,
      );
      return {
        listing,
        distance: coordinates ? distanceKm(origin, coordinates) : undefined,
      };
    })
    .sort(
      (a, b) =>
        (a.distance ?? Number.POSITIVE_INFINITY) -
        (b.distance ?? Number.POSITIVE_INFINITY),
    );
}

export { toCatalogQuery };

export const catalogService = {
  universities,
  categories,
  conditions,
  async searchListings(filters: ListingFilters, signal?: AbortSignal) {
    const rows = await backendCatalogService.search(
      toCatalogQuery(filters),
      signal,
    );
    return rows.map(mapListing);
  },
};
