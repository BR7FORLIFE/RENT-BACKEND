import z from 'zod';
import { PropertyOccupation, Street, TypeProperty } from '../types.js';

//resources images dtos
export const createResourceImageDtoRequest = z.object({
  assetId: z.string().optional(),
  width: z.int().optional(),
  height: z.int().optional(),
  format: z.string().optional(),
  url: z.string(),
  secureUrl: z.string().optional(),
});

export type createResourceImageType = z.infer<
  typeof createResourceImageDtoRequest
>;

//direction dto
export const createDirectionDtoRequest = z.object({
  latitute: z.number(),
  longitud: z.number(),
  department: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  typeStreet: Street,
  numberStreet: z.number(),
  complement: z.string().optional(),
});
export type CreateDirectionType = z.infer<typeof createDirectionDtoRequest>;

//property dto
export const createPropertyDtoRequest = z.object({
  propertyType: TypeProperty,
  propertyOccupationType: PropertyOccupation,
  direction: createDirectionDtoRequest,
  resourceImage: createResourceImageDtoRequest,
  propertyName: z.string(),
  propertyDescription: z.string(),
  fmi: z.string(),
  predialNumber: z.string(),
});

export type CreatePropertyType = z.infer<typeof createPropertyDtoRequest>;

// esquemas de edicion de propiedades
export const EditingPropertyDtoRequest = z.object({
  id: z.uuid(),
  propertyName: z.string().min(8).max(50).optional(),
  propertyType: TypeProperty.optional(),
  propertyOccupationType: PropertyOccupation.optional(),
  propertyDescription: z.string().optional(),
  direction: createDirectionDtoRequest.optional(),
  resourceImage: createResourceImageDtoRequest.optional(),
});

export type EditingPropertyType = z.infer<typeof EditingPropertyDtoRequest>;
