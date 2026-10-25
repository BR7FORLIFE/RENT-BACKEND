import * as z from 'zod';
import { paginationSchema } from '../../../shared/pagination/pagination-schemas.js';

export const propertyListQuerySchema = paginationSchema.extend({
  occupation: z.enum(['OCUPADO', 'DESOCUPADO']).optional(),
  search: z.string().trim().max(100).optional(),
});

export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;
