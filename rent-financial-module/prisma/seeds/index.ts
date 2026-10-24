import { prisma } from './client.js';
import { cleanupSeededData } from './seeders/cleanup.seeder.js';
import { seedActorRoles } from './seeders/actor-role.seeder.js';
import { seedContracts } from './seeders/contract.seeder.js';
import { seedFinancialTransactions } from './seeders/financial-transaction.seeder.js';
import { seedMembers } from './seeders/member.seeder.js';
import { seedOccupationTypes } from './seeders/occupation-type.seeder.js';
import { seedPolicies } from './seeders/policy.seeder.js';
import { seedProperties } from './seeders/property.seeder.js';
import { seedPublicServiceTypes } from './seeders/public-service-type.seeder.js';
import { seedServiceCatalog } from './seeders/service-catalog.seeder.js';
import { seedServiceOfferings } from './seeders/service-offering.seeder.js';
import { seedServiceRequests } from './seeders/service-request.seeder.js';
import { seedTypeProperties } from './seeders/type-property.seeder.js';

async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  const result = await run();
  console.log(`✔ ${label} (${Date.now() - startedAt} ms)`);
  return result;
}

async function main(): Promise<void> {
  await step('Limpieza de datos sembrados', () => cleanupSeededData(prisma));

  const propertyTypes = await step('Tipos de propiedad', () =>
    seedTypeProperties(prisma),
  );
  const occupationTypes = await step('Tipos de ocupación', () =>
    seedOccupationTypes(prisma),
  );
  const roleIds = await step('Roles de actor', () => seedActorRoles(prisma));
  const publicServiceTypes = await step('Tipos de servicio público', () =>
    seedPublicServiceTypes(prisma),
  );
  const serviceIds = await step('Catálogo de servicios', () =>
    seedServiceCatalog(prisma),
  );

  await step('Políticas por rol', () => seedPolicies(prisma, roleIds));
  await step('Propiedades', () =>
    seedProperties(prisma, {
      propertyTypes,
      occupationTypes,
      publicServiceTypes,
    }),
  );
  await step('Miembros y roles', () => seedMembers(prisma, roleIds));
  await step('Contratos', () => seedContracts(prisma));
  await step('Ofertas de servicio', () =>
    seedServiceOfferings(prisma, serviceIds),
  );
  await step('Solicitudes de servicio e historial', () =>
    seedServiceRequests(prisma),
  );

  const total = await step('Transacciones financieras', () =>
    seedFinancialTransactions(prisma),
  );
  console.log(`Seed completado: ${total} transacciones financieras`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
