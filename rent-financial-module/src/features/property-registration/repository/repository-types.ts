import { Prisma } from '../../../../generated/prisma/client.js';
import type { TypeStreet } from '../types.js';
import type { CurrencyType } from '../schemas/property-registration.schema.js';

interface ResourceImagePersistence {
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

export interface DirectionPersistence {
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
export interface EconomicInfoPersistence {
  monthlyRent: Prisma.Decimal;
  depositAmount: Prisma.Decimal;
  currency: CurrencyType;
  utilitiesIncluded: boolean;
}

//structure info response
export interface StructureInfoPersistence {
  bedrooms: number;
  bathrooms: number;
  floors: number;
  parkingSpaces: number;
  area: Prisma.Decimal;
  lotArea: Prisma.Decimal;
  constructionYear: number | null;
}

export interface PropertyInfoPersistence {
  id: string;
  createAt: Date;
  fmi: string;
  predialNumber: string;
  isPublished: boolean;
  propertyName: string;
  propertyDescription: string;
  direction: DirectionPersistence | null;
  typeProperty: string;
  propertyOccupationType: string;
  resourceImages: ResourceImagePersistence[];
  economicInfoResponse: EconomicInfoPersistence | null;
  structureInfoResponse: StructureInfoPersistence | null;
}

export interface PropertyNameAndDescriptionPersistance {
  propertyName: string;
  propertyDescription: string;
}
