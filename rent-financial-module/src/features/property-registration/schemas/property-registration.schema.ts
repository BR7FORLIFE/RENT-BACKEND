import * as z from 'zod';
import { Street } from '../types.js';

//currency
export const currencyStatus = z.enum(['USD', 'COP']);
export type CurrencyType = z.infer<typeof currencyStatus>;

//direction
export const DirectionSchema = z.object({
  id: z.uuid().optional(),
  propertyId: z.uuid(),
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

export const PropertyResourcesSchema = z.object({
  propertyId: z.uuid(),
  resourceId: z.uuid(),
});

export type PropertyResourceType = z.infer<typeof PropertyResourcesSchema>;

//resources images
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

//properties

export const propertySchema = z.object({
  id: z.uuid().optional(),
  userId: z.uuid(),
  registerByUserId: z.uuid(),
  propertyTypeId: z.uuid(),
  propertyOccupationTypeId: z.uuid(),
  propertyName: z.string().min(8).max(50),
  propertyDescription: z.string(),
  fmi: z.string(),
  predialNumber: z.string(),
  isPublished: z.boolean(),
  isActive: z.boolean().optional(),
  createAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type PropertyType = z.infer<typeof propertySchema>;

//property member
export const statusEnumSchema = z.enum(['ACTIVE', 'DESACTIVE', 'IN_PROCESS']);
export const PropertyMemberSchema = z.object({
  id: z.uuid().optional(),
  userId: z.uuid(),
  propertyId: z.uuid(),
  assignedBy: z.uuid(),
  status: statusEnumSchema,
  assignedAt: z.date().optional(),
  updateAt: z.date().optional(),
});
export type PropertyMemberStatus = z.infer<typeof statusEnumSchema>;

export const getMembersQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'DESACTIVE', 'IN_PROCESS']),
}); //validar en los param de la peticion

export const propertyMemberStatusFilter = z.object({
  status: z.enum(['ACTIVE', 'IN_PROCESS']),
}); //validar en los param de la peticion

export type GetMembersQuery = {
  status: PropertyMemberStatus;
};

export type PropertyMemberStatusFilter = z.infer<
  typeof propertyMemberStatusFilter
>;

//Property members
export type PropertyMemberType = z.infer<typeof PropertyMemberSchema>;

export const PropertyMemberRoleSchema = z.object({
  id: z.uuid().optional(),
  propertyMemberId: z.uuid(),
  propertyActorRoleId: z.uuid(),
});

export type PropertyMemberRoleType = z.infer<typeof PropertyMemberRoleSchema>;

//invitation property member schema
const statusInvitationLinked = z.enum([
  'REVOCKED',
  'CONSUMED',
  'EXPIRED',
  'DRAFT',
]);

export const invitationPropertyMemberSchema = z.object({
  id: z.uuid(),
  propertyId: z.uuid(),
  invitedBy: z.uuid(),
  invitedUserId: z.uuid(),
  invitedEmailTo: z.email(),
  status: statusInvitationLinked,
  token: z.string(),
  expirationTime: z.date(),
  createAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type InvitationPropertyMemberType = z.infer<
  typeof invitationPropertyMemberSchema
>;

export const createInvitationPropertyMemberSchema = z.object({
  propertyId: z.uuid(),
  invitedBy: z.uuid(),
  invitedUserId: z.uuid(),
  invitedEmailTo: z.email(),
  status: statusInvitationLinked,
  expirationTime: z.date(),
  token: z.string(),
});

export type createInvitationPropertyMemberType = z.infer<
  typeof createInvitationPropertyMemberSchema
>;

//economic property info
export const economicPropertyInformationSchema = z.object({
  id: z.uuid().optional(),
  propertyId: z.uuid(),
  monthlyRent: z.coerce.number(),
  depositAmount: z.coerce.number(),
  currency: currencyStatus,
  utilitiesIncluded: z.boolean(),
});

export type EconomicPropertyInformationType = z.infer<
  typeof economicPropertyInformationSchema
>;

// property structure description
export const structurePropertyDescriptionSchema = z.object({
  id: z.uuid().optional(),
  propertyId: z.uuid(),
  bedrooms: z.coerce.number().positive(),
  bathrooms: z.coerce.number().positive(),
  floors: z.coerce.number().positive(),
  parkingSpaces: z.coerce.number().positive(),
  area: z.coerce.number().positive(),
  lotArea: z.coerce.number().positive(),
  constructionYear: z.coerce.number().positive().optional(),
});

export type StructurePropertyDescriptionType = z.infer<
  typeof structurePropertyDescriptionSchema
>;
