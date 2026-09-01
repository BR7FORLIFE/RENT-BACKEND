import z from 'zod';
import { createResourceImageDtoRequest } from '../../global/global.schema-dtos.js';

export const createContractDtoRequest = z.object({
  propertyId: z.uuid(),
  landlordMemberId: z.uuid(),
  tenantMemberId: z.uuid(),
  monthlyRent: z.coerce.number(),
  depositAmount: z.coerce.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  resources: z.array(createResourceImageDtoRequest),
});

export type CreateContractType = z.infer<typeof createContractDtoRequest>;

//aceptar o rechazar un contrato por parte del arrendado
export const AcceptedOrRejectedContractDtoRequest = z.object({
  contractId: z.uuid(),
  propertyId: z.uuid(),
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

export type AcceptedOrRejectedContractType = z.infer<
  typeof AcceptedOrRejectedContractDtoRequest
>;

//cargar documentos en un contrato
export const LoadDocumentInContractDtoRequest = z.object({
  propertyId: z.uuid(),
  resources: z.array(createResourceImageDtoRequest),
});

export type LoadDocumentInContractType = z.infer<
  typeof LoadDocumentInContractDtoRequest
>;
