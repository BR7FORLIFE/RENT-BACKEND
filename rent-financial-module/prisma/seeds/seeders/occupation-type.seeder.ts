import { OCCUPATION_TYPES } from "../data/catalogs.js";
import type { PrismaClient } from "../prisma.js";
import { stableId } from "../utils/hash.js";

export async function seedOccupationTypes(prisma: PrismaClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const item of OCCUPATION_TYPES) {
    const record = await prisma.propertyOccupationType.upsert({
      where: { name: item.name },
      update: { description: item.description },
      create: {
        id: stableId(`occupation-type:${item.key}`),
        name: item.name,
        description: item.description,
      },
    });
    ids.set(item.key, record.id);
  }

  return ids;
}
