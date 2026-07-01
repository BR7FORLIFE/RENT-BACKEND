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

export type PropertyActorRoleType =
  | 'LANDLORD'
  | 'TENANT'
  | 'PROPERTY_ADMINISTRATOR'
  | 'OPERATION_SUPPORT';

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

export const ResourceImageSchema = z.object({
  id: z.uuid().optional(),
  assetId: z.string().optional(),
  width: z.int().optional(),
  height: z.int().optional(),
  format: z.string().optional(),
  url: z.string(),
  secureUrl: z.string().optional(),
  createAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type ResourceImageType = z.infer<typeof ResourceImageSchema>;

export const createResourceImageSchema = z.object({
  assetId: z.string().optional(),
  width: z.int().optional(),
  height: z.int().optional(),
  format: z.string().optional(),
  url: z.string(),
  secureUrl: z.string().optional(),
});

export type createResourceImageType = z.infer<typeof createResourceImageSchema>;

export const propertySchema = z.object({
  id: z.uuid().optional(),
  userId: z.uuid(),
  registerByUserId: z.uuid(),
  propertyTypeId: z.uuid(),
  propertyOccupationTypeId: z.uuid(),
  resourceImageId: z.string(),
  propertyName: z.string().min(8).max(50),
  propertyDescription: z.string(),
  directionId: z.uuid(),
  fmi: z.string(),
  predialNumber: z.string(),
  isPublished: z.boolean(),
  isActive: z.boolean().optional(),
  createAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type PropertyType = z.infer<typeof propertySchema>;

export const createPropertySchema = z.object({
  propertyType: TypeProperty,
  propertyOccupationType: PropertyOccupation,
  direction: createDirectionSchema,
  resourceImage: createResourceImageSchema,
  propertyName: z.string(),
  propertyDescription: z.string(),
  fmi: z.string(),
  predialNumber: z.string(),
});

export type CreatePropertyType = z.infer<typeof createPropertySchema>;

export const PropertyMemberSchema = z.object({
  id: z.uuid().optional(),
  userId: z.uuid(),
  propertyId: z.uuid(),
  assignedBy: z.uuid(),
  assignedAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type PropertyMemberType = z.infer<typeof PropertyMemberSchema>;

export const PropertyMemberRoleSchema = z.object({
  id: z.uuid().optional(),
  propertyMemberId: z.uuid(),
  propertyActorRoleId: z.uuid(),
});

export type PropertyMemberRoleType = z.infer<typeof PropertyMemberRoleSchema>;
