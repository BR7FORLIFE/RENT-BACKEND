import type { PrismaClient } from "../prisma.js";
import { getPortfolio } from "../plan/portfolio.js";

export async function seedContracts(prisma: PrismaClient): Promise<void> {
  const { properties } = getPortfolio();

  await prisma.contract.createMany({
    data: properties.flatMap((property) =>
      property.contracts.map((contract) => ({
        id: contract.id,
        propertyId: contract.propertyId,
        landlordMemberId: contract.landlordMemberId,
        tenantMemberId: contract.tenantMemberId,
        monthlyRent: contract.monthlyRent,
        depositAmount: contract.depositAmount,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        createByUserId: contract.createByUserId,
        createAt: contract.createAt,
        updateAt: contract.updateAt,
      })),
    ),
    skipDuplicates: true,
  });
}
