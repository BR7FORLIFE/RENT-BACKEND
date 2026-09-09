import z from 'zod';
import { createResourceImageDtoRequest } from '../../global/global.schema-dtos.js';

export const createContractDtoRequest = z.object({
  propertyId: z.uuid(),
  landlordMemberId: z.uuid(),
  tenantMemberId: z.uuid(),
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

//cambiar el estado de un contrato
export const changeContractStatusDtoRequest = z.object({
  status: z.enum(['SUSPENDED', 'FINISHED']),
});

export type changeContractStatusType = z.infer<
  typeof changeContractStatusDtoRequest
>;

//generar contenido de contrato con IA
export const generateIAContentContractDtoRequest = z.object({});

//generar borradores de contratos
export const generateContractDraftDtoRequest = z.object({
  //borrador de contrato
  content: z.string(),

  //parametros parciales de propiedades
  propertyId: z.uuid(),
  landlordMemberId: z.uuid(),
  tenantMemberId: z.uuid(),
  monthlyRent: z.coerce.number().nonnegative(),
  depositAmount: z.coerce.number().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type GenerateContractDraftType = z.infer<
  typeof generateContractDraftDtoRequest
>;

//aceptar un borrador de contrato
export const AgreeContractDraftDtoRequest = z.object({
  propertyId: z.uuid(),
});
