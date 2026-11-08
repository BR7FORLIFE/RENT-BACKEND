-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WARNING', 'INFO', 'ERROR', 'DEBUG');

-- CreateEnum
CREATE TYPE "StatusContract" AS ENUM ('BORRADOR', 'PENDIENTE_ACEPTACION', 'PENDIENTE_DOCUMENTACION', 'ACTIVO', 'RECHAZADO', 'SUSPENDIDO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "TypeStreet" AS ENUM ('CALLE', 'CARRERA', 'AVENIDA', 'DIAGONAL');

-- CreateEnum
CREATE TYPE "PriceTypeAgreement" AS ENUM ('CUSTOM_QUOTE', 'FIXED', 'NEGOTIABLE', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('COP', 'USD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETE', 'FAILED', 'OPEN', 'AUTHORIZE', 'PAID', 'EXPIRED', 'REIMBURSED');

-- CreateEnum
CREATE TYPE "statusPropertyMember" AS ENUM ('ACTIVE', 'DESACTIVE', 'IN_PROCESS');

-- CreateEnum
CREATE TYPE "StatusInvitationLinked" AS ENUM ('REVOCKED', 'CONSUMED', 'EXPIRED', 'DRAFT');

-- CreateEnum
CREATE TYPE "ServiceScope" AS ENUM ('PROPERTY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "ServiceOfferingStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceRequestHistoryAction" AS ENUM ('CREATED', 'ACCEPTED', 'REJECTED', 'STARTED', 'COMPLETED', 'CANCELLED', 'PRICE_PROPOSED', 'PRICE_AGREED');

-- CreateEnum
CREATE TYPE "FinancialTransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinancialCategory" AS ENUM ('RENT', 'SERVICE', 'UTILITY', 'MAINTENANCE', 'DEPOSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "FinancialRecordStatus" AS ENUM ('PLANNED', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "TypeProperty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "TypeProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyOccupationType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PropertyOccupationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyActorRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PropertyActorRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicServiceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PublicServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Direction" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "latitute" DECIMAL(65,30) NOT NULL,
    "longitud" DECIMAL(65,30) NOT NULL,
    "department" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "type_street" "TypeStreet" NOT NULL,
    "number_street" INTEGER NOT NULL,
    "complement" TEXT,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Direction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceImages" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "url" TEXT NOT NULL,
    "secure_url" TEXT,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "register_by_userId" TEXT NOT NULL,
    "property_type_id" TEXT NOT NULL,
    "property_occupation_type_id" TEXT NOT NULL,
    "property_name" TEXT NOT NULL,
    "property_description" TEXT NOT NULL,
    "fmi" TEXT NOT NULL,
    "predial_number" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyResources" (
    "property_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,

    CONSTRAINT "PropertyResources_pkey" PRIMARY KEY ("property_id","resource_id")
);

-- CreateTable
CREATE TABLE "EconomicPropertyInformation" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "monthly_rent" DECIMAL(65,30) NOT NULL,
    "deposit_amount" DECIMAL(65,30) NOT NULL,
    "currency" "Currency" NOT NULL,
    "utilities_included" BOOLEAN NOT NULL,

    CONSTRAINT "EconomicPropertyInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyStructureDescription" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "floors" INTEGER NOT NULL,
    "parkingSpaces" INTEGER NOT NULL,
    "area" DECIMAL(65,30) NOT NULL,
    "lotArea" DECIMAL(65,30) NOT NULL,
    "constructionYear" INTEGER,

    CONSTRAINT "PropertyStructureDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "landlord_member_id" TEXT NOT NULL,
    "tenant_member_id" TEXT NOT NULL,
    "monthly_rent" DECIMAL(65,30) NOT NULL,
    "deposit_amount" DECIMAL(65,30) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "StatusContract" NOT NULL,
    "create_by_user_id" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractResources" (
    "contract_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,

    CONSTRAINT "ContractResources_pkey" PRIMARY KEY ("contract_id","resource_id")
);

-- CreateTable
CREATE TABLE "ContractDraft" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "landlord_agree" BOOLEAN NOT NULL DEFAULT false,
    "tenant_agree" BOOLEAN NOT NULL DEFAULT false,
    "created_by_property_member_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,
    "property_id" TEXT NOT NULL,
    "landlord_member_id" TEXT NOT NULL,
    "tenant_member_id" TEXT NOT NULL,
    "monthly_rent" DECIMAL(65,30) NOT NULL,
    "deposit_amount" DECIMAL(65,30) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMember" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "status" "statusPropertyMember" NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMemberRole" (
    "id" TEXT NOT NULL,
    "property_member_id" TEXT NOT NULL,
    "property_actor_role_id" TEXT NOT NULL,

    CONSTRAINT "PropertyMemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicService" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "public_service_type_id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "register_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationLinked" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "invited_user_id" TEXT NOT NULL,
    "invited_email_to" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StatusInvitationLinked" NOT NULL DEFAULT 'DRAFT',
    "expiration_time" TIMESTAMP(3) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationLinked_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyStatement" (
    "id" TEXT NOT NULL,
    "policy_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyActorRolePolicyStatements" (
    "id" TEXT NOT NULL,
    "property_actor_role_id" TEXT NOT NULL,
    "policy_statement_id" TEXT NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyActorRolePolicyStatements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMemberPoliciesOverride" (
    "id" TEXT NOT NULL,
    "property_member_id" TEXT NOT NULL,
    "policy_statement_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "PropertyMemberPoliciesOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL,
    "transmitter_id" TEXT NOT NULL,
    "receiver_map" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_offerings" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "property_member_id" TEXT,
    "name" TEXT,
    "scope" "ServiceScope" NOT NULL DEFAULT 'PROPERTY',
    "status" "ServiceOfferingStatus" NOT NULL DEFAULT 'ACTIVE',
    "price_type_agreement" "PriceTypeAgreement" NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "service_offering_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "requested_by_user_id" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "published_price" DECIMAL(12,2) NOT NULL,
    "proposed_price" DECIMAL(12,2),
    "proposed_by_user_id" TEXT,
    "agreed_price" DECIMAL(12,2),
    "price_agreed_at" TIMESTAMP(3),
    "currency" "Currency" NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_history" (
    "id" TEXT NOT NULL,
    "service_request_id" TEXT NOT NULL,
    "action" "ServiceRequestHistoryAction" NOT NULL,
    "from_status" "ServiceRequestStatus",
    "to_status" "ServiceRequestStatus" NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "type" "FinancialTransactionType" NOT NULL,
    "category" "FinancialCategory" NOT NULL,
    "status" "FinancialRecordStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "due_date" TIMESTAMP(3),
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "is_simulated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TypeProperty_name_key" ON "TypeProperty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOccupationType_name_key" ON "PropertyOccupationType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyActorRole_name_key" ON "PropertyActorRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicServiceType_name_key" ON "PublicServiceType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Direction_propertyId_key" ON "Direction"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicPropertyInformation_property_id_key" ON "EconomicPropertyInformation"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyStructureDescription_property_id_key" ON "PropertyStructureDescription"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContractDraft_property_id_version_key" ON "ContractDraft"("property_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyMember_user_id_property_id_key" ON "PropertyMember"("user_id", "property_id");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyMemberRole_property_actor_role_id_property_member_i_key" ON "PropertyMemberRole"("property_actor_role_id", "property_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "PublicService_property_id_public_service_type_id_key" ON "PublicService"("property_id", "public_service_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE INDEX "service_offerings_service_id_status_idx" ON "service_offerings"("service_id", "status");

-- CreateIndex
CREATE INDEX "service_offerings_provider_user_id_status_idx" ON "service_offerings"("provider_user_id", "status");

-- CreateIndex
CREATE INDEX "service_offerings_property_member_id_status_idx" ON "service_offerings"("property_member_id", "status");

-- CreateIndex
CREATE INDEX "service_offerings_scope_status_idx" ON "service_offerings"("scope", "status");

-- CreateIndex
CREATE INDEX "service_requests_property_id_status_requested_at_idx" ON "service_requests"("property_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "service_requests_provider_user_id_status_requested_at_idx" ON "service_requests"("provider_user_id", "status", "requested_at");

-- CreateIndex
CREATE INDEX "service_requests_requested_by_user_id_requested_at_idx" ON "service_requests"("requested_by_user_id", "requested_at");

-- CreateIndex
CREATE INDEX "service_requests_service_offering_id_requested_at_idx" ON "service_requests"("service_offering_id", "requested_at");

-- CreateIndex
CREATE INDEX "service_request_history_service_request_id_created_at_idx" ON "service_request_history"("service_request_id", "created_at");

-- CreateIndex
CREATE INDEX "financial_transactions_property_id_type_status_idx" ON "financial_transactions"("property_id", "type", "status");

-- CreateIndex
CREATE INDEX "financial_transactions_property_id_occurred_at_idx" ON "financial_transactions"("property_id", "occurred_at");

-- CreateIndex
CREATE INDEX "financial_transactions_property_id_category_idx" ON "financial_transactions"("property_id", "category");

-- CreateIndex
CREATE INDEX "financial_transactions_contract_id_idx" ON "financial_transactions"("contract_id");

-- CreateIndex
CREATE INDEX "financial_transactions_status_due_date_idx" ON "financial_transactions"("status", "due_date");

-- AddForeignKey
ALTER TABLE "Direction" ADD CONSTRAINT "Direction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_property_type_id_fkey" FOREIGN KEY ("property_type_id") REFERENCES "TypeProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_property_occupation_type_id_fkey" FOREIGN KEY ("property_occupation_type_id") REFERENCES "PropertyOccupationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyResources" ADD CONSTRAINT "PropertyResources_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyResources" ADD CONSTRAINT "PropertyResources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "ResourceImages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomicPropertyInformation" ADD CONSTRAINT "EconomicPropertyInformation_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyStructureDescription" ADD CONSTRAINT "PropertyStructureDescription_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_landlord_member_id_fkey" FOREIGN KEY ("landlord_member_id") REFERENCES "PropertyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenant_member_id_fkey" FOREIGN KEY ("tenant_member_id") REFERENCES "PropertyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractResources" ADD CONSTRAINT "ContractResources_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractResources" ADD CONSTRAINT "ContractResources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "ResourceImages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMember" ADD CONSTRAINT "PropertyMember_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMemberRole" ADD CONSTRAINT "PropertyMemberRole_property_member_id_fkey" FOREIGN KEY ("property_member_id") REFERENCES "PropertyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMemberRole" ADD CONSTRAINT "PropertyMemberRole_property_actor_role_id_fkey" FOREIGN KEY ("property_actor_role_id") REFERENCES "PropertyActorRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicService" ADD CONSTRAINT "PublicService_public_service_type_id_fkey" FOREIGN KEY ("public_service_type_id") REFERENCES "PublicServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicService" ADD CONSTRAINT "PublicService_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyActorRolePolicyStatements" ADD CONSTRAINT "PropertyActorRolePolicyStatements_property_actor_role_id_fkey" FOREIGN KEY ("property_actor_role_id") REFERENCES "PropertyActorRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyActorRolePolicyStatements" ADD CONSTRAINT "PropertyActorRolePolicyStatements_policy_statement_id_fkey" FOREIGN KEY ("policy_statement_id") REFERENCES "PolicyStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMemberPoliciesOverride" ADD CONSTRAINT "PropertyMemberPoliciesOverride_property_member_id_fkey" FOREIGN KEY ("property_member_id") REFERENCES "PropertyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMemberPoliciesOverride" ADD CONSTRAINT "PropertyMemberPoliciesOverride_policy_statement_id_fkey" FOREIGN KEY ("policy_statement_id") REFERENCES "PolicyStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_offerings" ADD CONSTRAINT "service_offerings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_offerings" ADD CONSTRAINT "service_offerings_property_member_id_fkey" FOREIGN KEY ("property_member_id") REFERENCES "PropertyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_offering_id_fkey" FOREIGN KEY ("service_offering_id") REFERENCES "service_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_history" ADD CONSTRAINT "service_request_history_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

