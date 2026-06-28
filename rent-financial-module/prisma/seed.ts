import { PrismaService } from '../src/core/database/prisma.service.js';

const prisma = new PrismaService();

async function main() {
  await prisma.typeProperty.createMany({
    data: [
      {
        name: 'RESIDENTIAL',
        description:
          'Propiedades destinadas principalmente para uso habitacional, como casas, apartamentos o condominios.',
      },
      {
        name: 'COMMERCIAL',
        description:
          'Propiedades destinadas al desarrollo de actividades comerciales, como locales, oficinas o centros comerciales.',
      },
      {
        name: 'INDUSTRIAL',
        description:
          'Propiedades destinadas a procesos industriales, fabricación, almacenamiento o logística.',
      },
      {
        name: 'LAND_OR_SOIL',
        description:
          'Terrenos o lotes sin construcciones, aptos para desarrollo, inversión o conservación.',
      },
      {
        name: 'URBAN',
        description:
          'Propiedades ubicadas dentro del perímetro urbano con acceso a servicios públicos e infraestructura.',
      },
      {
        name: 'AGRARIAN',
        description:
          'Propiedades destinadas a actividades agrícolas, ganaderas o agropecuarias.',
      },
      {
        name: 'MIXED',
        description:
          'Propiedades que permiten una combinación de usos, como residencial y comercial.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyOccupationType.createMany({
    data: [
      {
        name: 'OCCUPIED',
        description:
          'La propiedad se encuentra ocupada por uno o más residentes, propietarios o arrendatarios.',
      },
      {
        name: 'VACANT',
        description:
          'La propiedad está desocupada y disponible para venta, arriendo o uso.',
      },
      {
        name: 'IN_PROCESS',
        description:
          'La propiedad se encuentra en proceso de ocupación, desocupación, entrega o trámite administrativo.',
      },
    ],
    skipDuplicates: true,
  });
}

await main().finally(() => prisma.$disconnect());
