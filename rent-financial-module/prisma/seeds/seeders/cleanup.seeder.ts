import type { PrismaClient } from '../prisma.js';
import { getPortfolio } from '../plan/portfolio.js';

export async function cleanupSeededData(prisma: PrismaClient): Promise<void> {
  const { properties, offerings } = getPortfolio();
  const propertyIds = properties.map((property) => property.id);
  const offeringIds = offerings.map((offering) => offering.id);

  const requestFilter = {
    OR: [
      { propertyId: { in: propertyIds } },
      { serviceOfferingId: { in: offeringIds } },
    ],
  };

  await prisma.serviceRequestHistory.deleteMany({
    where: { serviceRequest: requestFilter },
  });
  await prisma.serviceRequest.deleteMany({ where: requestFilter });
  await prisma.financialTransaction.deleteMany({
    where: { propertyId: { in: propertyIds } },
  });
  await prisma.serviceOffering.deleteMany({
    where: { id: { in: offeringIds } },
  });
  await prisma.direction.deleteMany({
    where: { propertyId: { in: propertyIds } },
  });
  await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
}
