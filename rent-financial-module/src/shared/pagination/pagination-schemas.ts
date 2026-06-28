import * as z from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

export type PaginationType = z.infer<typeof paginationSchema>;

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationResponse<T> {
  data: T[];
  metadata: PaginationResult;
}

export function paginate() {}
