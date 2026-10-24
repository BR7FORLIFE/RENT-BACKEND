import { SERVICES } from "../data/catalogs.js";
import type { PrismaClient } from "../prisma.js";
import { stableId } from "../utils/hash.js";

export async function seedServiceCatalog(prisma: PrismaClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const item of SERVICES) {
    const record = await prisma.service.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: {
        id: stableId(`service:${item.key}`),
        name: item.name,
        description: item.description,
        isActive: true,
      },
    });
    ids.set(item.key, record.id);
  }

  return ids;
}
