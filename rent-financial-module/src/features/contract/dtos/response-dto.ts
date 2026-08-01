import { Prisma } from '../../../../generated/prisma/client.js';

type StatusContractType = 'DRAFT' | 'PENDING' | 'EXECUTION' | 'DEFEATED';

export interface ContractInfoResponse {
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
