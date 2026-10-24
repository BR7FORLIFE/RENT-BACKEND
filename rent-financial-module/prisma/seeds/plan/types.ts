export type Currency = 'COP' | 'USD';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type FinancialCategory =
  | 'RENT'
  | 'SERVICE'
  | 'UTILITY'
  | 'MAINTENANCE'
  | 'DEPOSIT'
  | 'OTHER';
export type RecordStatus =
  | 'PLANNED'
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';
export type ContractStatus = 'ACTIVO' | 'FINALIZADO';
export type PriceType = 'CUSTOM_QUOTE' | 'FIXED' | 'NEGOTIABLE' | 'PERCENTAGE';
export type RequestStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type StreetType = 'CALLE' | 'CARRERA' | 'AVENIDA' | 'DIAGONAL';

export interface DirectionPlan {
  latitude: number;
  longitude: number;
  department: string;
  city: string;
  neighborhood: string;
  typeStreet: StreetType;
  numberStreet: number;
  complement: string;
}

export interface StructurePlan {
  bedrooms: number;
  bathrooms: number;
  floors: number;
  parkingSpaces: number;
  area: number;
  lotArea: number;
  constructionYear: number;
}

export interface PublicServicePlan {
  id: string;
  typeKey: string;
  accountNumber: string;
}

export interface ContractPlan {
  id: string;
  propertyId: string;
  landlordMemberId: string;
  tenantMemberId: string;
  monthlyRent: number;
  depositAmount: number;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  createByUserId: string;
  createAt: Date;
  updateAt: Date;
}

export interface PropertyPlan {
  index: number;
  id: string;
  ownerId: string;
  tenantId: string;
  typeKey: string;
  occupationKey: string;
  name: string;
  description: string;
  fmi: string;
  predialNumber: string;
  currency: Currency;
  firstRent: number;
  currentRent: number;
  depositAmount: number;
  utilitiesIncluded: boolean;
  adminPct: number;
  utilityPct: number;
  insurancePct: number;
  taxPct: number;
  tenantRisk: number;
  startOffset: number;
  currentContractIndex: number;
  nextMonthCovered: boolean;
  landlordMemberId: string;
  tenantMemberId: string;
  createAt: Date;
  direction: DirectionPlan;
  structure: StructurePlan;
  publicServices: PublicServicePlan[];
  contracts: ContractPlan[];
}

export interface ServiceOfferingPlan {
  id: string;
  serviceKey: string;
  providerUserId: string;
  currency: Currency;
  priceType: PriceType;
  basePrice: number;
  createdAt: Date;
}

export interface MaintenanceEventPlan {
  id: string;
  propertyId: string;
  propertyIndex: number;
  monthIndex: number;
  serviceKey: string;
  serviceName: string;
  offeringId: string;
  providerUserId: string;
  requestedByUserId: string;
  ownerId: string;
  currency: Currency;
  priceType: PriceType;
  status: RequestStatus;
  publishedPrice: number;
  proposedPrice: number | null;
  proposedByUserId: string | null;
  agreedPrice: number | null;
  amount: number;
  requestedAt: Date;
  acceptedAt: Date;
  priceAgreedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  notes: string;
}

export interface Portfolio {
  historyStart: Date;
  monthDates: Date[];
  landlordIds: string[];
  tenantIds: string[];
  providerIds: string[];
  properties: PropertyPlan[];
  offerings: ServiceOfferingPlan[];
  maintenanceEvents: MaintenanceEventPlan[];
}

export interface FinancialTransactionPlan {
  id: string;
  propertyId: string;
  contractId: string | null;
  type: TransactionType;
  category: FinancialCategory;
  status: RecordStatus;
  description: string;
  amount: number;
  currency: Currency;
  dueDate: Date | null;
  occurredAt: Date;
  paidAt: Date | null;
  isSimulated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
