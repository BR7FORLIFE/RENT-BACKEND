import type { Prisma } from '../../../../generated/prisma/client.js';
import type { StatusContractType } from '../schemas/contract.schema.js';

export interface ContractResponsePersistance {
  id: string;
  propertyId: string;
  landlordMemberId: string;
  tenantMemberId: string;
  monthlyRent: Prisma.Decimal;
  depositAmount: Prisma.Decimal;
  startDate: Date;
  endDate: Date;
  status: StatusContractType;
  createByUserId: string;
}

export interface ContractDraftInfoPersistance {
  id: string;
  content: string;
  version: number;
  landlordAgreed: boolean;
  tenantAgreed: boolean;
  createdByPropertyMemberId: string;
  createdAt: Date;
  updateAt: Date;
  propertyId: string;
  landlordMemberId: string;
  tenantMemberId: string;
  monthlyRent: Prisma.Decimal;
  depositAmount: Prisma.Decimal;
  startDate: Date;
  endDate: Date;
}
