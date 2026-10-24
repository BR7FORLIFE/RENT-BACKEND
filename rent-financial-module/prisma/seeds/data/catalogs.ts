import type {
  PriceTypeAgreement as PriceType,
  TypeStreet as StreetType,
} from '../prisma.js';

export type Range = readonly [number, number];

export interface PropertyTypeProfile {
  key: string;
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

export const OCCUPATION_TYPES = [
  {
    key: 'DISPONIBLE',
    name: 'Disponible',
    description: 'Inmueble sin contrato activo',
  },
  {
    key: 'OCUPADA',
    name: 'Ocupada',
    description: 'Inmueble con contrato activo',
  },
  {
    key: 'EN_MANTENIMIENTO',
    name: 'En mantenimiento',
    description: 'Inmueble temporalmente fuera de arriendo',
  },
] as const;

export const PUBLIC_SERVICE_TYPES = [
  {
    key: 'ENERGIA',
    name: 'Energía eléctrica',
    description: 'Servicio de energía',
    presence: 1,
  },
  {
    key: 'AGUA',
    name: 'Acueducto y alcantarillado',
    description: 'Servicio de agua',
    presence: 1,
  },
  {
    key: 'GAS',
    name: 'Gas natural',
    description: 'Servicio de gas domiciliario',
    presence: 0.8,
  },
  {
    key: 'INTERNET',
    name: 'Internet y telefonía',
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
    description: 'Reparación e instalación de tuberías, grifos y sanitarios',
    weight: 24,
    priceType: 'NEGOTIABLE',
    priceCop: [120_000, 350_000],
    priceUsd: [30, 90],
  },
  {
    key: 'ELECTRICIDAD',
    name: 'Electricidad',
    description: 'Revisión y reparación de instalaciones eléctricas',
    weight: 20,
    priceType: 'NEGOTIABLE',
    priceCop: [130_000, 400_000],
    priceUsd: [32, 100],
  },
  {
    key: 'CERRAJERIA',
    name: 'Cerrajería',
    description: 'Cambio y reparación de cerraduras',
    weight: 10,
    priceType: 'FIXED',
    priceCop: [80_000, 250_000],
    priceUsd: [20, 65],
  },
  {
    key: 'PINTURA',
    name: 'Pintura',
    description: 'Pintura y resane de paredes y techos',
    weight: 10,
    priceType: 'CUSTOM_QUOTE',
    priceCop: [400_000, 1_200_000],
    priceUsd: [100, 300],
  },
  {
    key: 'ASEO_PROFUNDO',
    name: 'Aseo profundo',
    description: 'Limpieza profunda del inmueble',
    weight: 14,
    priceType: 'FIXED',
    priceCop: [150_000, 400_000],
    priceUsd: [38, 100],
  },
  {
    key: 'FUMIGACION',
    name: 'Fumigación',
    description: 'Control de plagas',
    weight: 8,
    priceType: 'FIXED',
    priceCop: [150_000, 350_000],
    priceUsd: [38, 88],
  },
  {
    key: 'AIRE_ACONDICIONADO',
    name: 'Mantenimiento de aire acondicionado',
    description: 'Limpieza y reparación de equipos de aire acondicionado',
    weight: 14,
    priceType: 'NEGOTIABLE',
    priceCop: [120_000, 300_000],
    priceUsd: [30, 75],
  },
];

export const ACTOR_ROLES = [
  {
    key: 'LANDLORD',
    name: 'ARRENDADOR',
    description: 'Propietario que arrienda el inmueble',
  },
  {
    key: 'TENANT',
    name: 'ARRENDATARIO',
    description: 'Persona que habita o usa el inmueble',
  },
  {
    key: 'PROPERTY_MANAGER',
    name: 'ADMINISTRADOR',
    description: 'Persona que administra el inmueble',
  },
  {
    key: 'SERVICE_PROVIDER',
    name: 'PROVEEDOR_SERVICIO',
    description: 'Persona que presta servicios al inmueble',
  },
] as const;

export const POLICIES = [
  {
    key: 'property:read',
    name: 'Consultar inmueble',
    description: 'Permite ver la información del inmueble',
  },
  {
    key: 'property:update',
    name: 'Actualizar inmueble',
    description: 'Permite editar la información del inmueble',
  },
  {
    key: 'member:invite',
    name: 'Invitar miembros',
    description: 'Permite invitar miembros al inmueble',
  },
  {
    key: 'member:remove',
    name: 'Remover miembros',
    description: 'Permite remover miembros del inmueble',
  },
  {
    key: 'contract:create',
    name: 'Crear contratos',
    description: 'Permite crear contratos del inmueble',
  },
  {
    key: 'contract:read',
    name: 'Consultar contratos',
    description: 'Permite ver los contratos del inmueble',
  },
  {
    key: 'contract:update',
    name: 'Actualizar contratos',
    description: 'Permite editar los contratos del inmueble',
  },
  {
    key: 'finance:read',
    name: 'Consultar finanzas',
    description: 'Permite ver los movimientos financieros',
  },
  {
    key: 'finance:manage',
    name: 'Gestionar finanzas',
    description: 'Permite registrar y editar movimientos financieros',
  },
  {
    key: 'service:request',
    name: 'Solicitar servicios',
    description: 'Permite solicitar servicios para el inmueble',
  },
  {
    key: 'service:provide',
    name: 'Prestar servicios',
    description: 'Permite atender solicitudes de servicio',
  },
] as const;

export const ROLE_POLICIES: Readonly<Record<string, readonly string[]>> = {
  LANDLORD: [
    'property:read',
    'property:update',
    'member:invite',
    'member:remove',
    'contract:create',
    'contract:read',
    'contract:update',
    'finance:read',
    'finance:manage',
    'service:request',
  ],
  TENANT: ['property:read', 'contract:read', 'finance:read', 'service:request'],
  PROPERTY_MANAGER: [
    'property:read',
    'property:update',
    'contract:read',
    'finance:read',
    'service:request',
  ],
  SERVICE_PROVIDER: ['property:read', 'service:provide'],
};
