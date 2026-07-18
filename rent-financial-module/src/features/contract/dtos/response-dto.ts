type StatusContractType = 'DRAFT' | 'PENDING' | 'EXECUTION' | 'DEFEATED';

export interface ContractInfoResponse {
  id: string;
  propertyId: string;
  landlordMemberId: string;
  tenantMemberId: string;
  monthlyRent: number;
  depositAmount: number;
  startDate: Date;
  endDate: Date;
  status: StatusContractType;
  createByUserId: string;
  resourceImageId: string;
}
