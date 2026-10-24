import { PROPERTY_TYPES } from '../data/catalogs.js';
import type { PrismaClient } from '../prisma.js';
import { stableId } from '../utils/hash.js';

export async function seedTypeProperties(
  prisma: PrismaClient,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const item of PROPERTY_TYPES) {
    const record = await prisma.typeProperty.upsert({
      where: { name: item.name },
      update: { description: item.description },
      create: {
        id: stableId(`type-property:${item.key}`),
        name: item.name,
        description: item.description,
      },
    });
    ids.set(item.key, record.id);
  }

  return ids;
}
