import { POLICIES, ROLE_POLICIES } from "../data/catalogs.js";
import type { PrismaClient } from "../prisma.js";
import { stableId } from "../utils/hash.js";

export async function seedPolicies(
  prisma: PrismaClient,
  roleIds: ReadonlyMap<string, string>,
): Promise<void> {
  const policyIds = new Map<string, string>();

  for (const policy of POLICIES) {
    const id = stableId(`policy:${policy.key}`);
    await prisma.policyStatement.upsert({
      where: { id },
      update: { policyName: policy.name, description: policy.description },
      create: { id, policyName: policy.name, description: policy.description },
    });
    policyIds.set(policy.key, id);
  }

  for (const [roleKey, policyKeys] of Object.entries(ROLE_POLICIES)) {
    const roleId = roleIds.get(roleKey);
    if (roleId === undefined) {
      continue;
    }

    for (const policyKey of policyKeys) {
      const policyId = policyIds.get(policyKey);
      if (policyId === undefined) {
        continue;
      }

      const id = stableId(`role-policy:${roleKey}:${policyKey}`);
      await prisma.propertyActorRolePolicyStatements.upsert({
        where: { id },
        update: {},
        create: { id, propertyActorRoleId: roleId, policy_statement_id: policyId },
      });
    }
  }
}
