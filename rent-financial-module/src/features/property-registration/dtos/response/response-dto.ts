import type { TypeStreet } from '../../schemas/property-registration.schema.js';
import { Decimal } from '@prisma/client/runtime/index-browser';

export interface PropertyInfoResponse {
  id: string;
  createAt: Date;
  fmi: string;
  predialNumber: string;
  isPublished: boolean;
  direction: {
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
  };
  typeProperty: {
    name: string;
  };
  propertyOccupationType: {
    name: string;
  };
}
