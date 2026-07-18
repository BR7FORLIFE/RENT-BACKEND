import z from 'zod';
import { createResourceImageDtoRequest } from '../../property-registration/dtos/request-dto.js';

export const createContractDtoRequest = z.object({
  propertyId: z.uuid(),
  landlordMemberId: z.uuid(),
  tenantMemberId: z.uuid(),
  monthlyRent: z.coerce.number(),
  depositAmount: z.coerce.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  resourceImage: createResourceImageDtoRequest,
});

export type CreateContractType = z.infer<typeof createContractDtoRequest>;
