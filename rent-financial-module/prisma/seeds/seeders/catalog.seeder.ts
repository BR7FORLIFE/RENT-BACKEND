import { seedBaseCatalogs } from '../../seed.js';
import { TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS, TYPE_PROPERTY_UUIDS } from '../../../src/types/global-types.js';
import {
  OCCUPIED_OCCUPATION_KEY,
  PROPERTY_TYPES,
  PUBLIC_SERVICE_TYPES,
  SERVICES,
} from '../data/catalogs.js';
import type { PrismaClient } from '../prisma.js';
import { required } from '../utils/batch.js';

export interface SeedCatalogs {
  propertyTypes: ReadonlyMap<string, string>;
  occupationTypes: ReadonlyMap<string, string>;
  publicServiceTypes: ReadonlyMap<string, string>;
  serviceIds: ReadonlyMap<string, string>;
}

const LEGACY_PROPERTY_TYPES = ['Apartamento', 'Casa', 'Apartaestudio', 'Local comercial', 'Oficina'];
const LEGACY_OCCUPATION_TYPES = ['Disponible', 'Ocupada', 'En mantenimiento'];
const LEGACY_ACTOR_ROLES = ['ARRENDADOR', 'ARRENDATARIO', 'PROVEEDOR_SERVICIO'];
const LEGACY_PUBLIC_SERVICE_TYPES = [
  'Energía eléctrica',
  'Acueducto y alcantarillado',
  'Gas natural',
  'Internet y telefonía',
];
const LEGACY_POLICIES = [
  'Consultar inmueble',
  'Actualizar inmueble',
  'Invitar miembros',
  'Remover miembros',
  'Crear contratos',
  'Consultar contratos',
  'Actualizar contratos',
  'Consultar finanzas',
  'Gestionar finanzas',
  'Solicitar servicios',
  'Prestar servicios',
];
const LEGACY_SERVICES = ['Aseo profundo', 'Mantenimiento de aire acondicionado'];

// Versiones anteriores del seed crearon catálogos con nombres que la app no usa.
async function removeLegacyCatalogs(prisma: PrismaClient): Promise<void> {
  const roles = await prisma.propertyActorRole.findMany({
    where: { name: { in: LEGACY_ACTOR_ROLES } },
    select: { id: true },
  });
  const roleIds = roles.map((role) => role.id);
  await prisma.propertyMemberRole.deleteMany({ where: { propertyActorRoleId: { in: roleIds } } });
  await prisma.propertyActorRolePolicyStatements.deleteMany({
    where: { propertyActorRoleId: { in: roleIds } },
  });
  await prisma.propertyActorRole.deleteMany({ where: { id: { in: roleIds } } });

  await prisma.policyStatement.deleteMany({ where: { policyName: { in: LEGACY_POLICIES } } });
  await prisma.typeProperty.deleteMany({ where: { name: { in: LEGACY_PROPERTY_TYPES } } });
  await prisma.propertyOccupationType.deleteMany({
    where: { name: { in: LEGACY_OCCUPATION_TYPES } },
  });
  await prisma.publicServiceType.deleteMany({
    where: { name: { in: LEGACY_PUBLIC_SERVICE_TYPES } },
  });
  await prisma.service.deleteMany({ where: { name: { in: LEGACY_SERVICES } } });
}

export async function seedCatalogs(prisma: PrismaClient): Promise<SeedCatalogs> {
  await removeLegacyCatalogs(prisma);
  await seedBaseCatalogs(prisma);

  const publicServiceTypes = new Map(
    (await prisma.publicServiceType.findMany()).map((type) => [type.name, type.id]),
  );
  const services = new Map(
    (await prisma.service.findMany()).map((service) => [service.name, service.id]),
  );

  return {
    propertyTypes: new Map(PROPERTY_TYPES.map((type) => [type.key, TYPE_PROPERTY_UUIDS[type.category]])),
    occupationTypes: new Map([
      [OCCUPIED_OCCUPATION_KEY, TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.OCUPADO],
    ]),
    publicServiceTypes: new Map(
      PUBLIC_SERVICE_TYPES.map((type) => [
        type.key,
        required(publicServiceTypes, type.name, 'tipo de servicio público'),
      ]),
    ),
    serviceIds: new Map(
      SERVICES.map((service) => [
        service.key,
        required(services, service.catalogName, 'servicio'),
      ]),
    ),
  };
}
