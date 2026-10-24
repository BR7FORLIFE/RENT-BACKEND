import { PUBLIC_SERVICE_TYPES } from "../data/catalogs.js";
import type { PrismaClient } from "../prisma.js";
import { stableId } from "../utils/hash.js";

export async function seedPublicServiceTypes(prisma: PrismaClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const item of PUBLIC_SERVICE_TYPES) {
    const record = await prisma.publicServiceType.upsert({
      where: { name: item.name },
      update: { description: item.description },
      create: {
        id: stableId(`public-service-type:${item.key}`),
        name: item.name,
        description: item.description,
      },
    });
    ids.set(item.key, record.id);
  }

  return ids;
}
