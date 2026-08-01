import { PrismaService } from '../src/core/database/prisma.service.js';
import {
  TYPE_PROPERTY_UUIDS,
  TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS,
  TYPE_PROPERTY_ACTOR_ROLE_UUIDS,
} from '../src/types/global-types.js';

const prisma = new PrismaService();

async function main() {
  await prisma.typeProperty.createMany({
    data: [
      {
        id: TYPE_PROPERTY_UUIDS.RESIDENTIAL,
        name: 'RESIDENCIAL',
        description:
          'Propiedades destinadas principalmente para uso habitacional, como casas, apartamentos o condominios.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.COMMERCIAL,
        name: 'COMERCIAL',
        description:
          'Propiedades destinadas al desarrollo de actividades comerciales, como locales, oficinas o centros comerciales.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.INDUSTRIAL,
        name: 'INDUSTRIAL',
        description:
          'Propiedades destinadas a procesos industriales, fabricación, almacenamiento o logística.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.LAND_OR_SOIL,
        name: 'TERRENO',
        description:
          'Terrenos o lotes sin construcciones, aptos para desarrollo, inversión o conservación.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.URBAN,
        name: 'URBANO',
        description:
          'Propiedades ubicadas dentro del perímetro urbano con acceso a servicios públicos e infraestructura.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.AGRARIAN,
        name: 'AGRARIO',
        description:
          'Propiedades destinadas a actividades agrícolas, ganaderas o agropecuarias.',
      },
      {
        id: TYPE_PROPERTY_UUIDS.MIXED,
        name: 'MIXTO',
        description:
          'Propiedades que permiten una combinación de usos, como residencial y comercial.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyOccupationType.createMany({
    data: [
      {
        id: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.OCCUPIED,
        name: 'OCUPADO',
        description:
          'La propiedad se encuentra ocupada por uno o más residentes, propietarios o arrendatarios.',
      },
      {
        id: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.VACANT,
        name: 'DESOCUPADA',
        description:
          'La propiedad está desocupada y disponible para venta, arriendo o uso.',
      },
      {
        id: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.IN_PROCESS,
        name: 'EN_PROCESO',
        description:
          'La propiedad se encuentra en proceso de ocupación, desocupación, entrega o trámite administrativo.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyActorRole.createMany({
    data: [
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.MEMBER,
        name: 'MIEMBRO',
        description: 'Miembro sin privilegios pero hacen parte de la propiedad',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.LANDLORD,
        name: 'PROPIETARIO',
        description: 'Propietario o arrendador del inmueble.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.TENANT,
        name: 'ARRENDADO',
        description: 'Arrendatario que ocupa el inmueble mediante contrato.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.PROPERTY_ADMINISTRATOR,
        name: 'ADMINISTRADOR',
        description:
          'Persona encargada de administrar el inmueble por cuenta del propietario.',
      },
      {
        id: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.OPERATION_SUPPORT,
        name: 'SOPORTE_OPERATIVO',
        description:
          'Encargado de inspecciones, entregas, mantenimientos y apoyo operativo.',
      },
    ],
    skipDuplicates: true,
  });
}

await main().finally(() => prisma.$disconnect());
