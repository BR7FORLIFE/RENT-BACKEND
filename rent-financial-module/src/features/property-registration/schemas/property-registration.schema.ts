import * as z from 'zod';
import { Street } from '../types.js';

//direction
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

//property member
export const PropertyMemberSchema = z.object({
  id: z.uuid().optional(),
  userId: z.uuid(),
  propertyId: z.uuid(),
  assignedBy: z.uuid(),
  assignedAt: z.date().optional(),
  updateAt: z.date().optional(),
});

//Property members
export type PropertyMemberType = z.infer<typeof PropertyMemberSchema>;

export const PropertyMemberRoleSchema = z.object({
  id: z.uuid().optional(),
  propertyMemberId: z.uuid(),
  propertyActorRoleId: z.uuid(),
});

export type PropertyMemberRoleType = z.infer<typeof PropertyMemberRoleSchema>;
