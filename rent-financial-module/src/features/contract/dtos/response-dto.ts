import { Prisma } from '../../../../generated/prisma/client.js';
import type { UserData } from '../../property-registration/api.js';

type StatusContractType =
  | 'BORRADOR'
  | 'PENDIENTE_ACEPTACION'
  | 'PENDIENTE_DOCUMENTACION'
  | 'ACTIVO'
  | 'RECHAZADO'
  | 'SUSPENDIDO'
  | 'FINALIZADO';

export interface UserCompleteInfo {
  propertyMemberId: string;
  userData: UserData;
}

export interface ContractInfoResponse {
  id: string;
  propertyId: string;
  landlordMember: UserCompleteInfo;
  tenantMember: UserCompleteInfo;
  monthlyRent: Prisma.Decimal;
  depositAmount: Prisma.Decimal;
  startDate: Date;
  endDate: Date;
  status: StatusContractType;
  createByUserId: string;
}

export interface ContractDraftInfoResponse {
  id: string;
  content: string;
  version: number;
  landlordAgreed: boolean;
  tenantAgreed: boolean;
  createdByPropertyMemberId: string;
  createdAt: Date;
  updateAt: Date;
  propertyId: string;
  landlordMember: UserCompleteInfo;
  tenantMember: UserCompleteInfo;
  monthlyRent: Prisma.Decimal;
  depositAmount: Prisma.Decimal;
  startDate: Date;
  endDate: Date;
}
