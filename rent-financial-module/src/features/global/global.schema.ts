import { z } from 'zod';

export const NotificationQueryParamsSchema = z.object({
  date: z.date(),
});

export type NotificationQueryParamsType = z.infer<
  typeof NotificationQueryParamsSchema
>;

export const NotificationSourceEnum = z.enum([
  'CONTRACT_SERVICE',
  'PROPERTY_REGISTRATION_SERVICE',
  'SYSTEM_ROLE_SERVICE',
]);

export type NotificationSource = z.infer<typeof NotificationSourceEnum>;

export const NotitficationTypeEnum = z.enum([
  'WARNING',
  'INFO',
  'ERROR',
  'DEBUG',
]);

export type NotificationTypeEnumType = z.infer<typeof NotitficationTypeEnum>;

export const NotificationSchema = z.object({
  id: z.uuid().optional(),
  transmitterId: z.uuid(),
  receiverId: z.uuid(),
  source: NotificationSourceEnum,
  type: NotitficationTypeEnum,
  name: z.string(),
  content: z.string(),
  readAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type NotificationType = z.infer<typeof NotificationSchema>;

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
