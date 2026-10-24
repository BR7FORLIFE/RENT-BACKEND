import { ACTOR_ROLES } from '../data/catalogs.js';
import type { PrismaClient } from '../prisma.js';
import { stableId } from '../utils/hash.js';

export async function seedActorRoles(
  prisma: PrismaClient,
): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const item of ACTOR_ROLES) {
    const record = await prisma.propertyActorRole.upsert({
      where: { name: item.name },
      update: { description: item.description },
      create: {
        id: stableId(`actor-role:${item.key}`),
        name: item.name,
        description: item.description,
      },
    });
    ids.set(item.key, record.id);
  }

  return ids;
}
