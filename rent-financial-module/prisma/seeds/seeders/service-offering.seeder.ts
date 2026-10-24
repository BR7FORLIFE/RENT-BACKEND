import type { PrismaClient } from "../prisma.js";
import { getPortfolio } from "../plan/portfolio.js";
import { required } from "../utils/batch.js";

export async function seedServiceOfferings(
  prisma: PrismaClient,
  serviceIds: ReadonlyMap<string, string>,
): Promise<void> {
  const { offerings } = getPortfolio();

  await prisma.serviceOffering.createMany({
    data: offerings.map((offering) => ({
      id: offering.id,
      serviceId: required(serviceIds, offering.serviceKey, "servicio"),
      providerUserId: offering.providerUserId,
      propertyMemberId: null,
      scope: "PUBLIC" as const,
      status: "ACTIVE" as const,
      priceTypeAgreement: offering.priceType,
      basePrice: offering.basePrice,
      currency: offering.currency,
      validFrom: offering.createdAt,
      validUntil: null,
      createdAt: offering.createdAt,
      updatedAt: offering.createdAt,
    })),
    skipDuplicates: true,
  });
}
