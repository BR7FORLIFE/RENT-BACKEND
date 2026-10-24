import type { PrismaClient } from "../prisma.js";
import { getPortfolio } from "../plan/portfolio.js";
import { required } from "../utils/batch.js";
import { stableId } from "../utils/hash.js";

interface PropertyCatalogs {
  propertyTypes: ReadonlyMap<string, string>;
  occupationTypes: ReadonlyMap<string, string>;
  publicServiceTypes: ReadonlyMap<string, string>;
}

export async function seedProperties(
  prisma: PrismaClient,
  catalogs: PropertyCatalogs,
): Promise<void> {
  const { properties } = getPortfolio();

  await prisma.property.createMany({
    data: properties.map((property) => ({
      id: property.id,
      userId: property.ownerId,
      registerByUserId: property.ownerId,
      propertyTypeId: required(catalogs.propertyTypes, property.typeKey, "tipo de propiedad"),
      propertyOccupationTypeId: required(
        catalogs.occupationTypes,
        property.occupationKey,
        "tipo de ocupación",
      ),
      propertyName: property.name,
      propertyDescription: property.description,
      fmi: property.fmi,
      predialNumber: property.predialNumber,
      isPublished: false,
      isActive: true,
      createAt: property.createAt,
      updateAt: property.createAt,
    })),
    skipDuplicates: true,
  });

  await prisma.direction.createMany({
    data: properties.map((property) => ({
      id: stableId(`direction:${property.index}`),
      propertyId: property.id,
      latitute: property.direction.latitude,
      longitud: property.direction.longitude,
      department: property.direction.department,
      city: property.direction.city,
      neighborhood: property.direction.neighborhood,
      typeStreet: property.direction.typeStreet,
      numberStreet: property.direction.numberStreet,
      complement: property.direction.complement,
      createAt: property.createAt,
      updateAt: property.createAt,
    })),
    skipDuplicates: true,
  });

  await prisma.economicPropertyInformation.createMany({
    data: properties.map((property) => ({
      id: stableId(`economic:${property.index}`),
      propertyId: property.id,
      monthlyRent: property.currentRent,
      depositAmount: property.depositAmount,
      currency: property.currency,
      utilitiesIncluded: property.utilitiesIncluded,
    })),
    skipDuplicates: true,
  });

  await prisma.propertyStructureDescription.createMany({
    data: properties.map((property) => ({
      id: stableId(`structure:${property.index}`),
      propertyId: property.id,
      bedrooms: property.structure.bedrooms,
      bathrooms: property.structure.bathrooms,
      floors: property.structure.floors,
      parkingSpaces: property.structure.parkingSpaces,
      area: property.structure.area,
      lotArea: property.structure.lotArea,
      constructionYear: property.structure.constructionYear,
    })),
    skipDuplicates: true,
  });

  await prisma.publicService.createMany({
    data: properties.flatMap((property) =>
      property.publicServices.map((service) => ({
        id: service.id,
        propertyId: property.id,
        publicServiceTypeId: required(
          catalogs.publicServiceTypes,
          service.typeKey,
          "tipo de servicio público",
        ),
        accountNumber: service.accountNumber,
        registerDate: property.createAt,
        updateAt: property.createAt,
      })),
    ),
    skipDuplicates: true,
  });
}
