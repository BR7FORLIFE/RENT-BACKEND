import type { CurrencyType } from '../schemas/property-registration.schema.js';
import type { TypeStreet } from '../types.js';

interface ResourcesImages {
  id: string;
  assetId: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  url: string;
  secureUrl: string | null;
  createAt: string;
  updateAt: string;
}

export interface Direction {
  typeStreet: TypeStreet;
  id: string;
  propertyId: string;
  latitute: number;
  longitud: number;
  department: string;
  city: string;
  neighborhood: string;
  numberStreet: number;
  complement: string | null;
  createAt: string;
  updateAt: string;
}

//economic info response
export interface Economic {
  monthlyRent: number;
  depositAmount: number;
  currency: CurrencyType;
  utilitiesIncluded: boolean;
}

//structure info response
export interface Structure {
  bedrooms: number;
  bathrooms: number;
  floors: number;
  parkingSpaces: number;
  area: number;
  lotArea: number;
  constructionYear: number | null;
}

export interface Property {
  id: string;
  createAt: string;
  fmi: string;
  predialNumber: string;
  isPublished: boolean;
  propertyName: string;
  propertyDescription: string;
  direction: Direction | null;
  typeProperty: string;
  propertyOccupationType: string;
  resourcesImages: ResourcesImages[];
  economicInfoResponse: Economic | null;
  structureInfoResponse: Structure | null;
}
