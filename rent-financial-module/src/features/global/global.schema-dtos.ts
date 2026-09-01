import { z } from 'zod';
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
