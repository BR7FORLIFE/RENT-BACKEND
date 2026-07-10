import { Decimal } from '@prisma/client/runtime/index-browser';
import type { TypeStreet } from '../types.js';

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
  latitute: Decimal;
  longitud: Decimal;
  department: string;
  city: string;
  neighborhood: string;
  numberStreet: number;
  complement: string | null;
  createAt: Date;
  updateAt: Date;
}

export interface PropertyInfoResponse {
  id: string;
  createAt: Date;
  fmi: string;
  predialNumber: string;
  isPublished: boolean;
  propertyName: string;
  propertyDescription: string;
  direction: Direction;
  typeProperty: {
    name: string;
  };
  propertyOccupationType: {
    name: string;
  };

  resourceImage: ResourceImageResponse;
}
