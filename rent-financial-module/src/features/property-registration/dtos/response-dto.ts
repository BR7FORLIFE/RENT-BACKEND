import { Prisma } from '../../../../generated/prisma/client.js';
import type { TypeStreet } from '../types.js';
import type { CurrencyType } from '../schemas/property-registration.schema.js';

interface ResourceImageResponse {
  id: string;
  assetId: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  url: string;
  secureUrl: string | null;
  createAt: Date;
  updateAt: Date;
}

export interface Direction {
  typeStreet: TypeStreet;
  id: string;
  propertyId: string;
  latitute: Prisma.Decimal;
  longitud: Prisma.Decimal;
  department: string;
  city: string;
  neighborhood: string;
  numberStreet: number;
  complement: string | null;
  createAt: Date;
  updateAt: Date;
}

//economic info response
export interface EconomicInfoResponse {
  monthlyRent: Prisma.Decimal;
  depositAmount: Prisma.Decimal;
  currency: CurrencyType;
  utilitiesIncluded: boolean;
}

//structure info response
export interface StructureInfoResponse {
  bedrooms: number;
  bathrooms: number;
  floors: number;
  parkingSpaces: number;
  area: Prisma.Decimal;
  lotArea: Prisma.Decimal;
  constructionYear: number | null;
}

export interface PropertyInfoResponse {
  id: string;
  createAt: Date;
  fmi: string;
  predialNumber: string;
  isPublished: boolean;
  propertyName: string;
  propertyDescription: string;
  direction: Direction | null;
  typeProperty: string;
  propertyOccupationType: string;
  resourceImages: ResourceImageResponse[];
  economicInfoResponse: EconomicInfoResponse | null;
  structureInfoResponse: StructureInfoResponse | null;
}
