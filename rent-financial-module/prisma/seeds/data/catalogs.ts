import type {
  PriceTypeAgreement as PriceType,
  TypeStreet as StreetType,
} from '../prisma.js';
import {
  TYPE_LANDORD_ACTOR_ROLES_UUIDS,
  TYPE_PROPERTY_UUIDS,
  TYPE_TENANT_ACTOR_ROLES_UUIDS,
} from '../../../src/types/global-types.js';

export type Range = readonly [number, number];

export interface PropertyTypeProfile {
  key: string;
  category: keyof typeof TYPE_PROPERTY_UUIDS;
  name: string;
  description: string;
  weight: number;
  rentCop: Range;
  rentUsd: Range;
  bedrooms: Range;
  bathrooms: Range;
  floors: Range;
  parking: Range;
  area: Range;
  lotFactor: Range;
  complementLabel: string;
}

export const PROPERTY_TYPES: readonly PropertyTypeProfile[] = [
  {
    key: 'APARTAMENTO',
    category: 'RESIDENCIAL',
    name: 'Apartamento',
    description: 'Unidad residencial dentro de un edificio o conjunto',
    weight: 50,
    rentCop: [1_400_000, 3_600_000],
    rentUsd: [450, 800],
    bedrooms: [1, 3],
    bathrooms: [1, 2],
    floors: [1, 1],
    parking: [0, 1],
    area: [45, 110],
    lotFactor: [1, 1],
    complementLabel: 'Apto',
  },
  {
    key: 'CASA',
    category: 'RESIDENCIAL',
    name: 'Casa',
    description: 'Vivienda independiente con lote propio',
    weight: 22,
    rentCop: [2_200_000, 5_200_000],
    rentUsd: [650, 950],
    bedrooms: [2, 5],
    bathrooms: [2, 4],
    floors: [1, 3],
    parking: [1, 2],
    area: [90, 220],
    lotFactor: [1.2, 1.8],
    complementLabel: 'Casa',
  },
  {
    key: 'APARTAESTUDIO',
    category: 'RESIDENCIAL',
    name: 'Apartaestudio',
    description: 'Unidad residencial de un solo ambiente',
    weight: 10,
    rentCop: [1_200_000, 2_200_000],
    rentUsd: [380, 600],
    bedrooms: [1, 1],
    bathrooms: [1, 1],
    floors: [1, 1],
    parking: [0, 0],
    area: [28, 50],
    lotFactor: [1, 1],
    complementLabel: 'Apto',
  },
  {
    key: 'LOCAL_COMERCIAL',
    category: 'COMERCIAL',
    name: 'Local comercial',
    description: 'Espacio destinado a actividad comercial',
    weight: 12,
    rentCop: [2_500_000, 6_000_000],
    rentUsd: [700, 1_200],
    bedrooms: [0, 0],
    bathrooms: [1, 2],
    floors: [1, 1],
    parking: [0, 2],
    area: [40, 150],
    lotFactor: [1, 1],
    complementLabel: 'Local',
  },
  {
    key: 'OFICINA',
    category: 'COMERCIAL',
    name: 'Oficina',
    description: 'Espacio destinado a uso administrativo o profesional',
    weight: 6,
    rentCop: [1_800_000, 4_500_000],
    rentUsd: [550, 950],
    bedrooms: [0, 0],
    bathrooms: [1, 2],
    floors: [1, 1],
    parking: [0, 2],
    area: [30, 120],
    lotFactor: [1, 1],
    complementLabel: 'Oficina',
  },
];

export const OCCUPIED_OCCUPATION_KEY = 'OCUPADO';

export const PUBLIC_SERVICE_TYPES = [
  {
    key: 'ENERGIA',
    name: 'ENERGIA',
    description: 'Servicio de energía',
    presence: 1,
  },
  {
    key: 'AGUA',
    name: 'AGUA',
    description: 'Servicio de agua',
    presence: 1,
  },
  {
    key: 'GAS',
    name: 'GAS',
    description: 'Servicio de gas domiciliario',
    presence: 0.8,
  },
  {
    key: 'INTERNET',
    name: 'INTERNET',
    description: 'Servicio de internet',
    presence: 0.7,
  },
] as const;

export interface CityProfile {
  city: string;
  department: string;
  latitude: number;
  longitude: number;
  fmiCircle: string;
  weight: number;
  neighborhoods: readonly string[];
}

export const CITIES: readonly CityProfile[] = [
  {
    city: 'Cartagena',
    department: 'Bolívar',
    latitude: 10.391,
    longitude: -75.4794,
    fmiCircle: '060',
    weight: 50,
    neighborhoods: [
      'Bocagrande',
      'Manga',
      'Crespo',
      'El Laguito',
      'Castillogrande',
      'Pie de la Popa',
      'Getsemaní',
    ],
  },
  {
    city: 'Barranquilla',
    department: 'Atlántico',
    latitude: 10.9685,
    longitude: -74.7813,
    fmiCircle: '040',
    weight: 20,
    neighborhoods: [
      'El Prado',
      'Alto Prado',
      'Riomar',
      'Villa Country',
      'Ciudad Jardín',
    ],
  },
  {
    city: 'Bogotá',
    department: 'Bogotá D.C.',
    latitude: 4.711,
    longitude: -74.0721,
    fmiCircle: '50C',
    weight: 20,
    neighborhoods: ['Chapinero', 'Usaquén', 'Cedritos', 'Teusaquillo', 'Chicó'],
  },
  {
    city: 'Medellín',
    department: 'Antioquia',
    latitude: 6.2442,
    longitude: -75.5812,
    fmiCircle: '001',
    weight: 10,
    neighborhoods: ['El Poblado', 'Laureles', 'Belén', 'Estadio', 'Robledo'],
  },
];

export const STREET_TYPES: readonly StreetType[] = [
  'CALLE',
  'CARRERA',
  'AVENIDA',
  'DIAGONAL',
];
export const STREET_TYPE_WEIGHTS: readonly number[] = [40, 40, 12, 8];

export interface ServiceProfile {
  key: string;
  name: string;
  catalogName: string;
  description: string;
  weight: number;
  priceType: PriceType;
  priceCop: Range;
  priceUsd: Range;
}

export const SERVICES: readonly ServiceProfile[] = [
  {
    key: 'PLOMERIA',
    name: 'Plomería',
    catalogName: 'Plomería',
    description: 'Reparación e instalación de tuberías, grifos y sanitarios',
    weight: 24,
    priceType: 'NEGOTIABLE',
    priceCop: [120_000, 350_000],
    priceUsd: [30, 90],
  },
  {
    key: 'ELECTRICIDAD',
    name: 'Electricidad',
    catalogName: 'Electricidad',
    description: 'Revisión y reparación de instalaciones eléctricas',
    weight: 20,
    priceType: 'NEGOTIABLE',
    priceCop: [130_000, 400_000],
    priceUsd: [32, 100],
  },
  {
    key: 'CERRAJERIA',
    name: 'Cerrajería',
    catalogName: 'Cerrajería',
    description: 'Cambio y reparación de cerraduras',
    weight: 10,
    priceType: 'FIXED',
    priceCop: [80_000, 250_000],
    priceUsd: [20, 65],
  },
  {
    key: 'PINTURA',
    name: 'Pintura',
    catalogName: 'Pintura',
    description: 'Pintura y resane de paredes y techos',
    weight: 10,
    priceType: 'CUSTOM_QUOTE',
    priceCop: [400_000, 1_200_000],
    priceUsd: [100, 300],
  },
  {
    key: 'ASEO_PROFUNDO',
    name: 'Aseo profundo',
    catalogName: 'Aseo y limpieza',
    description: 'Limpieza profunda del inmueble',
    weight: 14,
    priceType: 'FIXED',
    priceCop: [150_000, 400_000],
    priceUsd: [38, 100],
  },
  {
    key: 'FUMIGACION',
    name: 'Fumigación',
    catalogName: 'Fumigación',
    description: 'Control de plagas',
    weight: 8,
    priceType: 'FIXED',
    priceCop: [150_000, 350_000],
    priceUsd: [38, 88],
  },
  {
    key: 'AIRE_ACONDICIONADO',
    name: 'Mantenimiento de aire acondicionado',
    catalogName: 'Mantenimiento de electrodomésticos',
    description: 'Limpieza y reparación de equipos de aire acondicionado',
    weight: 14,
    priceType: 'NEGOTIABLE',
    priceCop: [120_000, 300_000],
    priceUsd: [30, 75],
  },
];

export const PROPERTY_ROLE_IDS = {
  LANDLORD: TYPE_LANDORD_ACTOR_ROLES_UUIDS.PROPIETARIO,
  TENANT: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
} as const;
