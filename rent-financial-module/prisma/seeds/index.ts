import { prisma } from './client.js';
import { seedCatalogs } from './seeders/catalog.seeder.js';
import { cleanupSeededData } from './seeders/cleanup.seeder.js';
import { seedContracts } from './seeders/contract.seeder.js';
import { seedFinancialTransactions } from './seeders/financial-transaction.seeder.js';
import { seedMembers } from './seeders/member.seeder.js';
import { seedProperties } from './seeders/property.seeder.js';
import { seedServiceOfferings } from './seeders/service-offering.seeder.js';
import { seedServiceRequests } from './seeders/service-request.seeder.js';

async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  const result = await run();
  console.log(`✔ ${label} (${Date.now() - startedAt} ms)`);
  return result;
}

async function main(): Promise<void> {
  await step('Limpieza de datos sembrados', () => cleanupSeededData(prisma));

  const catalogs = await step('Catálogos base', () => seedCatalogs(prisma));

  await step('Propiedades', () =>
    seedProperties(prisma, catalogs),
  );
  await step('Miembros y roles', () => seedMembers(prisma));
  await step('Contratos', () => seedContracts(prisma));
  await step('Ofertas de servicio', () =>
    seedServiceOfferings(prisma, catalogs.serviceIds),
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
