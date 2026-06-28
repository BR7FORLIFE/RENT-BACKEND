import * as z from 'zod';

const TypeProperty = z.enum([
  'RESIDENTIAL',
  'COMMERCIAL',
  'INDUSTRIAL',
  'LAND_OR_SOIL',
  'URBAN',
  'AGRARIAN',
  'MIXED',
]);

export type TypePropertyType = z.infer<typeof TypeProperty>;

const PropertyOccupation = z.enum(['OCCUPIED', 'VACANT', 'IN_PROCESS']);

export type PropertyOccupationType = z.infer<typeof PropertyOccupation>;

const Street = z.enum(['STREET', 'CAREER', 'AVENUE', 'DIAGONAL', 'CROSS']);

export type TypeStreet = z.infer<typeof Street>;

export const DirectionSchema = z.object({
  id: z.uuid().optional(),
  latitute: z.number(),
  longitud: z.number(),
  department: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  typeStreet: Street,
  numberStreet: z.number(),
  complement: z.string().optional(),
  createAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type DirectionType = z.infer<typeof DirectionSchema>;

export const createDirectionSchema = z.object({
  latitute: z.number(),
  longitud: z.number(),
  department: z.string(),
  city: z.string(),
  neighborhood: z.string(),
  typeStreet: Street,
  numberStreet: z.number(),
  complement: z.string().optional(),
});

export type CreateDirectionType = z.infer<typeof createDirectionSchema>;

export const propertySchema = z.object({
  id: z.uuid().optional(),
  userId: z.uuid(),
  registerByUserId: z.uuid(),
  propertyTypeId: z.uuid(),
  propertyOccupationTypeId: z.uuid(),
  directionId: z.uuid(),
  fmi: z.string(),
  predialNumber: z.string(),
  isPublished: z.boolean(),
  createAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type PropertyType = z.infer<typeof propertySchema>;

export const createPropertySchema = z.object({
  propertyType: TypeProperty,
  propertyOccupationType: PropertyOccupation,
  direction: createDirectionSchema,
  fmi: z.string(),
  predialNumber: z.string(),
});

export type CreatePropertyType = z.infer<typeof createPropertySchema>;
