import type { CategoryCode, ConditionCode, University } from '@/types/domain';

// Campus metadata is enriched locally because the university endpoint does not
// expose coordinates. Category ids mirror the stable seeded backend catalog.
export const universities: University[] = [
  {
    id: 'UPC',
    shortName: 'UPC',
    name: 'Universidad Peruana de Ciencias Aplicadas',
    emailDomains: ['upc.edu.pe'],
    campuses: [
      {
        id: 'upc-monterrico',
        name: 'Monterrico',
        district: 'Santiago de Surco',
        coordinates: { lat: -12.1043, lng: -76.963 },
      },
      {
        id: 'upc-san-isidro',
        name: 'San Isidro',
        district: 'San Isidro',
        coordinates: { lat: -12.0874, lng: -77.0507 },
      },
      {
        id: 'upc-san-miguel',
        name: 'San Miguel',
        district: 'San Miguel',
        coordinates: { lat: -12.077, lng: -77.093 },
      },
      {
        id: 'upc-villa',
        name: 'Villa',
        district: 'Chorrillos',
        coordinates: { lat: -12.195, lng: -77.011 },
      },
    ],
  },
  {
    id: 'PUCP',
    shortName: 'PUCP',
    name: 'Pontificia Universidad Católica del Perú',
    emailDomains: ['pucp.edu.pe'],
    campuses: [
      {
        id: 'pucp-san-miguel',
        name: 'San Miguel',
        district: 'San Miguel',
        coordinates: { lat: -12.069, lng: -77.079 },
      },
    ],
  },
  {
    id: 'ULIMA',
    shortName: 'ULima',
    name: 'Universidad de Lima',
    emailDomains: ['aloe.ulima.edu.pe', 'ulima.edu.pe'],
    campuses: [
      {
        id: 'ulima-monterrico',
        name: 'Monterrico',
        district: 'Santiago de Surco',
        coordinates: { lat: -12.085, lng: -76.971 },
      },
    ],
  },
  {
    id: 'UNI',
    shortName: 'UNI',
    name: 'Universidad Nacional de Ingeniería',
    emailDomains: ['uni.pe', 'uni.edu.pe'],
    campuses: [
      {
        id: 'uni-rimac',
        name: 'Campus central',
        district: 'Rímac',
        coordinates: { lat: -12.023, lng: -77.049 },
      },
    ],
  },
  {
    id: 'UNMSM',
    shortName: 'UNMSM',
    name: 'Universidad Nacional Mayor de San Marcos',
    emailDomains: ['unmsm.edu.pe'],
    campuses: [
      {
        id: 'unmsm-cu',
        name: 'Ciudad Universitaria',
        district: 'Lima',
        coordinates: { lat: -12.056, lng: -77.084 },
      },
    ],
  },
];

export const categoryIds: Record<CategoryCode, string> = {
  OTHER: '00000000-0000-4000-8000-000000000003',
  CALCULATORS: '00000000-0000-4000-8000-000000000004',
  CAMERAS: '00000000-0000-4000-8000-000000000005',
  BOOKS: '00000000-0000-4000-8000-000000000006',
  TOOLS: '00000000-0000-4000-8000-000000000007',
  ELECTRONICS: '00000000-0000-4000-8000-000000000008',
};

export const categories: CategoryCode[] = [
  'CALCULATORS',
  'CAMERAS',
  'BOOKS',
  'TOOLS',
  'ELECTRONICS',
  'OTHER',
];

export function categoryCodeForId(id: string): CategoryCode {
  const entry = Object.entries(categoryIds).find(
    ([, categoryId]) => categoryId === id,
  );
  return entry ? (entry[0] as CategoryCode) : 'OTHER';
}
export const conditions: ConditionCode[] = [
  'NEW',
  'EXCELLENT',
  'VERY_GOOD',
  'GOOD',
  'FAIR',
];
export const incidentTypes = [
  'DAMAGE',
  'LOSS',
  'LATE_RETURN',
  'NON_RETURN',
  'OTHER',
] as const;
