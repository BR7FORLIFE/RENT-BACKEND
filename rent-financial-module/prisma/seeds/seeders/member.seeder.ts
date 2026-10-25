import type { PrismaClient } from "../prisma.js";
import { getPortfolio } from "../plan/portfolio.js";
import { PROPERTY_ROLE_IDS } from "../data/catalogs.js";
import { stableId } from "../utils/hash.js";

export async function seedMembers(prisma: PrismaClient): Promise<void> {
  const { properties } = getPortfolio();
  const landlordRoleId = PROPERTY_ROLE_IDS.LANDLORD;
  const tenantRoleId = PROPERTY_ROLE_IDS.TENANT;

  await prisma.propertyMember.createMany({
    data: properties.flatMap((property) => {
      const firstContract = property.contracts[0];
      const tenantJoinedAt = firstContract ? firstContract.createAt : property.createAt;

      return [
        {
          id: property.landlordMemberId,
          userId: property.ownerId,
          propertyId: property.id,
          status: "ACTIVE" as const,
          assignedBy: property.ownerId,
          assignedAt: property.createAt,
          updateAt: property.createAt,
        },
        {
          id: property.tenantMemberId,
          userId: property.tenantId,
          propertyId: property.id,
          status: "ACTIVE" as const,
          assignedBy: property.ownerId,
          assignedAt: tenantJoinedAt,
          updateAt: tenantJoinedAt,
        },
      ];
    }),
    skipDuplicates: true,
  });

  await prisma.propertyMemberRole.createMany({
    data: properties.flatMap((property) => [
      {
        id: stableId(`member-role:${property.landlordMemberId}:LANDLORD`),
        propertyMemberId: property.landlordMemberId,
        propertyActorRoleId: landlordRoleId,
      },
      {
        id: stableId(`member-role:${property.tenantMemberId}:TENANT`),
        propertyMemberId: property.tenantMemberId,
        propertyActorRoleId: tenantRoleId,
      },
    ]),
    skipDuplicates: true,
  });
}
