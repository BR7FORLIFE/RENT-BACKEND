import type { PrismaService } from '../src/core/database/prisma.service.js';
import {
  POLICIES_STATEMENTS,
  TYPE_LANDORD_ACTOR_ROLES_UUIDS,
  TYPE_PROPERTY_ACTOR_ROLE_UUIDS,
  TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS,
  TYPE_PROPERTY_UUIDS,
  TYPE_TENANT_ACTOR_ROLES_UUIDS,
} from '../src/types/global-types.js';

const USERS = {
  OWNER: '00000000-0000-4000-8000-000000000001',
  TENANT: '00000000-0000-4000-8000-000000000002',
  ADMIN: '00000000-0000-4000-8000-000000000003',
  PRELIMINARY_TENANT: '00000000-0000-4000-8000-000000000004',
  INVITED: '00000000-0000-4000-8000-000000000005',
  PROVIDER: '00000000-0000-4000-8000-000000000006',
} as const;

const PROPERTIES = {
  APARTMENT: '10000000-0000-4000-8000-000000000001',
  OFFICE: '10000000-0000-4000-8000-000000000002',
  HOUSE: '10000000-0000-4000-8000-000000000003',
} as const;

const MEMBERS = {
  APARTMENT_OWNER: '20000000-0000-4000-8000-000000000001',
  APARTMENT_TENANT: '20000000-0000-4000-8000-000000000002',
  APARTMENT_ADMIN: '20000000-0000-4000-8000-000000000003',
  OFFICE_OWNER: '20000000-0000-4000-8000-000000000004',
  OFFICE_PRELIMINARY_TENANT: '20000000-0000-4000-8000-000000000005',
  OFFICE_INVITED: '20000000-0000-4000-8000-000000000006',
  HOUSE_OWNER: '20000000-0000-4000-8000-000000000007',
} as const;

const CONTRACTS = {
  APARTMENT_ACTIVE: '30000000-0000-4000-8000-000000000001',
  HOUSE_FINISHED: '30000000-0000-4000-8000-000000000002',
} as const;

const DRAFTS = {
  APARTMENT_V1: '40000000-0000-4000-8000-000000000001',
  OFFICE_V1: '40000000-0000-4000-8000-000000000002',
  OFFICE_V2: '40000000-0000-4000-8000-000000000003',
} as const;

const OFFERINGS = {
  CLEANING: '50000000-0000-4000-8000-000000000001',
  PLUMBING: '50000000-0000-4000-8000-000000000002',
} as const;

const REQUESTS = {
  COMPLETED: '60000000-0000-4000-8000-000000000001',
  NEGOTIATING: '60000000-0000-4000-8000-000000000002',
} as const;

const RESOURCES = {
  APARTMENT_COVER: '70000000-0000-4000-8000-000000000001',
  APARTMENT_DOCUMENT: '70000000-0000-4000-8000-000000000002',
  CONTRACT_DOCUMENT: '70000000-0000-4000-8000-000000000003',
  OFFICE_COVER: '70000000-0000-4000-8000-000000000004',
} as const;

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

const monthlyDueDates = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0');
  return { index, month, dueDate: date(`2026-${month}-05`) };
});

export async function seedDemo(prisma: PrismaService) {
  const publicServiceTypes = await prisma.publicServiceType.findMany();
  const publicServiceTypeId = (name: string) =>
    publicServiceTypes.find((type) => type.name === name)!.id;

  await prisma.property.createMany({
    data: [
      {
        id: PROPERTIES.APARTMENT,
        userId: USERS.OWNER,
        registerByUserId: USERS.OWNER,
        propertyTypeId: TYPE_PROPERTY_UUIDS.RESIDENCIAL,
        propertyOccupationTypeId: TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.OCUPADO,
        propertyName: 'Apartamento Chapinero Alto',
        propertyDescription:
          'Apartamento de tres habitaciones con vista a los cerros, cercano a transporte y comercio.',
        fmi: '50C-1700001',
        predialNumber: 'AAA0001ABCD',
        isPublished: false,
        isActive: true,
      },
      {
        id: PROPERTIES.OFFICE,
        userId: USERS.OWNER,
        registerByUserId: USERS.OWNER,
        propertyTypeId: TYPE_PROPERTY_UUIDS.COMERCIAL,
        propertyOccupationTypeId:
          TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.EN_PROCESO,
        propertyName: 'Oficina Centro Empresarial',
        propertyDescription:
          'Oficina en edificio empresarial con recepción, ascensor y parqueadero asignado.',
        fmi: '50C-1700002',
        predialNumber: 'AAA0002ABCD',
        isPublished: true,
        isActive: true,
      },
      {
        id: PROPERTIES.HOUSE,
        userId: USERS.OWNER,
        registerByUserId: USERS.OWNER,
        propertyTypeId: TYPE_PROPERTY_UUIDS.RESIDENCIAL,
        propertyOccupationTypeId:
          TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS.DESOCUPADO,
        propertyName: 'Casa Campestre La Calera',
        propertyDescription:
          'Casa campestre de dos pisos con jardín amplio, disponible para arriendo.',
        fmi: '50N-2000003',
        predialNumber: 'AAA0003ABCD',
        isPublished: true,
        isActive: false,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.direction.createMany({
    data: [
      {
        propertyId: PROPERTIES.APARTMENT,
        latitute: 4.6486259,
        longitud: -74.0628402,
        department: 'Cundinamarca',
        city: 'Bogotá',
        neighborhood: 'Chapinero Alto',
        typeStreet: 'CARRERA',
        numberStreet: 4,
        complement: 'Apartamento 502',
      },
      {
        propertyId: PROPERTIES.OFFICE,
        latitute: 4.6682,
        longitud: -74.0553,
        department: 'Cundinamarca',
        city: 'Bogotá',
        neighborhood: 'Chicó',
        typeStreet: 'AVENIDA',
        numberStreet: 82,
        complement: 'Oficina 1204',
      },
      {
        propertyId: PROPERTIES.HOUSE,
        latitute: 4.7208,
        longitud: -73.9689,
        department: 'Cundinamarca',
        city: 'La Calera',
        neighborhood: 'Vereda El Salitre',
        typeStreet: 'CALLE',
        numberStreet: 12,
        complement: null,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.economicPropertyInformation.createMany({
    data: [
      {
        propertyId: PROPERTIES.APARTMENT,
        monthlyRent: 2800000,
        depositAmount: 2800000,
        currency: 'COP',
        utilitiesIncluded: false,
      },
      {
        propertyId: PROPERTIES.OFFICE,
        monthlyRent: 4500000,
        depositAmount: 9000000,
        currency: 'COP',
        utilitiesIncluded: true,
      },
      {
        propertyId: PROPERTIES.HOUSE,
        monthlyRent: 5200000,
        depositAmount: 5200000,
        currency: 'COP',
        utilitiesIncluded: false,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyStructureDescription.createMany({
    data: [
      {
        propertyId: PROPERTIES.APARTMENT,
        bedrooms: 3,
        bathrooms: 2,
        floors: 1,
        parkingSpaces: 1,
        area: 96.5,
        lotArea: 96.5,
        constructionYear: 2015,
      },
      {
        propertyId: PROPERTIES.OFFICE,
        bedrooms: 0,
        bathrooms: 2,
        floors: 1,
        parkingSpaces: 2,
        area: 120,
        lotArea: 120,
        constructionYear: 2019,
      },
      {
        propertyId: PROPERTIES.HOUSE,
        bedrooms: 4,
        bathrooms: 3,
        floors: 2,
        parkingSpaces: 3,
        area: 210,
        lotArea: 1200,
        constructionYear: 2008,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.resourceImages.createMany({
    data: [
      {
        id: RESOURCES.APARTMENT_COVER,
        assetId: 'seed-apartment-cover',
        width: 1280,
        height: 720,
        format: 'jpg',
        url: 'https://example.com/seed/apartment-cover.jpg',
        secureUrl: 'https://example.com/seed/apartment-cover.jpg',
      },
      {
        id: RESOURCES.APARTMENT_DOCUMENT,
        assetId: 'seed-apartment-certificate',
        format: 'pdf',
        url: 'https://example.com/seed/apartment-certificate.pdf',
        secureUrl: 'https://example.com/seed/apartment-certificate.pdf',
      },
      {
        id: RESOURCES.CONTRACT_DOCUMENT,
        assetId: 'seed-contract-signed',
        format: 'pdf',
        url: 'https://example.com/seed/contract-signed.pdf',
        secureUrl: 'https://example.com/seed/contract-signed.pdf',
      },
      {
        id: RESOURCES.OFFICE_COVER,
        assetId: 'seed-office-cover',
        width: 1280,
        height: 720,
        format: 'jpg',
        url: 'https://example.com/seed/office-cover.jpg',
        secureUrl: 'https://example.com/seed/office-cover.jpg',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyResources.createMany({
    data: [
      {
        propertyId: PROPERTIES.APARTMENT,
        resourceId: RESOURCES.APARTMENT_COVER,
      },
      {
        propertyId: PROPERTIES.APARTMENT,
        resourceId: RESOURCES.APARTMENT_DOCUMENT,
      },
      { propertyId: PROPERTIES.OFFICE, resourceId: RESOURCES.OFFICE_COVER },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyMember.createMany({
    data: [
      {
        id: MEMBERS.APARTMENT_OWNER,
        userId: USERS.OWNER,
        propertyId: PROPERTIES.APARTMENT,
        status: 'ACTIVE',
        assignedBy: USERS.OWNER,
      },
      {
        id: MEMBERS.APARTMENT_TENANT,
        userId: USERS.TENANT,
        propertyId: PROPERTIES.APARTMENT,
        status: 'ACTIVE',
        assignedBy: USERS.OWNER,
      },
      {
        id: MEMBERS.APARTMENT_ADMIN,
        userId: USERS.ADMIN,
        propertyId: PROPERTIES.APARTMENT,
        status: 'ACTIVE',
        assignedBy: USERS.OWNER,
      },
      {
        id: MEMBERS.OFFICE_OWNER,
        userId: USERS.OWNER,
        propertyId: PROPERTIES.OFFICE,
        status: 'ACTIVE',
        assignedBy: USERS.OWNER,
      },
      {
        id: MEMBERS.OFFICE_PRELIMINARY_TENANT,
        userId: USERS.PRELIMINARY_TENANT,
        propertyId: PROPERTIES.OFFICE,
        status: 'ACTIVE',
        assignedBy: USERS.OWNER,
      },
      {
        id: MEMBERS.OFFICE_INVITED,
        userId: USERS.INVITED,
        propertyId: PROPERTIES.OFFICE,
        status: 'IN_PROCESS',
        assignedBy: USERS.OWNER,
      },
      {
        id: MEMBERS.HOUSE_OWNER,
        userId: USERS.OWNER,
        propertyId: PROPERTIES.HOUSE,
        status: 'ACTIVE',
        assignedBy: USERS.OWNER,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.propertyMemberRole.createMany({
    data: [
      {
        propertyMemberId: MEMBERS.APARTMENT_OWNER,
        propertyActorRoleId: TYPE_LANDORD_ACTOR_ROLES_UUIDS.PROPIETARIO,
      },
      {
        propertyMemberId: MEMBERS.APARTMENT_TENANT,
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO,
      },
      {
        propertyMemberId: MEMBERS.APARTMENT_ADMIN,
        propertyActorRoleId: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.ADMINISTRADOR,
      },
      {
        propertyMemberId: MEMBERS.OFFICE_OWNER,
        propertyActorRoleId: TYPE_LANDORD_ACTOR_ROLES_UUIDS.PROPIETARIO,
      },
      {
        propertyMemberId: MEMBERS.OFFICE_PRELIMINARY_TENANT,
        propertyActorRoleId: TYPE_TENANT_ACTOR_ROLES_UUIDS.ARRENDADO_PRELIMINAR,
      },
      {
        propertyMemberId: MEMBERS.OFFICE_INVITED,
        propertyActorRoleId: TYPE_PROPERTY_ACTOR_ROLE_UUIDS.MIEMBRO,
      },
      {
        propertyMemberId: MEMBERS.HOUSE_OWNER,
        propertyActorRoleId: TYPE_LANDORD_ACTOR_ROLES_UUIDS.PROPIETARIO,
      },
    ],
    skipDuplicates: true,
  });

  const overrideId = '80000000-0000-4000-8000-000000000001';
  await prisma.propertyMemberPoliciesOverride.createMany({
    data: [
      {
        id: overrideId,
        propertyMemberId: MEMBERS.APARTMENT_ADMIN,
        policyStatementId: POLICIES_STATEMENTS.ELIMINAR_CONTRATOS,
        active: false,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.publicService.createMany({
    data: [
      {
        propertyId: PROPERTIES.APARTMENT,
        publicServiceTypeId: publicServiceTypeId('ENERGIA'),
        accountNumber: '10458723',
      },
      {
        propertyId: PROPERTIES.APARTMENT,
        publicServiceTypeId: publicServiceTypeId('AGUA'),
        accountNumber: '20981734',
      },
      {
        propertyId: PROPERTIES.APARTMENT,
        publicServiceTypeId: publicServiceTypeId('GAS'),
        accountNumber: '30765412',
      },
      {
        propertyId: PROPERTIES.APARTMENT,
        publicServiceTypeId: publicServiceTypeId('INTERNET'),
        accountNumber: '40123987',
      },
      {
        propertyId: PROPERTIES.OFFICE,
        publicServiceTypeId: publicServiceTypeId('ENERGIA'),
        accountNumber: '10458999',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.contractDraft.createMany({
    data: [
      {
        id: DRAFTS.APARTMENT_V1,
        content:
          'Borrador de contrato de arrendamiento de vivienda urbana para el Apartamento Chapinero Alto, canon mensual de 2.800.000 COP y depósito equivalente a un canon.',
        version: 1,
        landlordAgreed: true,
        tenantAgreed: true,
        createdByPropertyMemberId: MEMBERS.APARTMENT_OWNER,
        propertyId: PROPERTIES.APARTMENT,
        landlordMemberId: MEMBERS.APARTMENT_OWNER,
        tenantMemberId: MEMBERS.APARTMENT_TENANT,
        monthlyRent: 2800000,
        depositAmount: 2800000,
        startDate: date('2026-01-01'),
        endDate: date('2026-12-31'),
      },
      {
        id: DRAFTS.OFFICE_V1,
        content:
          'Primer borrador de arrendamiento de local comercial para la Oficina Centro Empresarial, canon mensual de 4.000.000 COP.',
        version: 1,
        landlordAgreed: true,
        tenantAgreed: false,
        createdByPropertyMemberId: MEMBERS.OFFICE_OWNER,
        propertyId: PROPERTIES.OFFICE,
        landlordMemberId: MEMBERS.OFFICE_OWNER,
        tenantMemberId: MEMBERS.OFFICE_PRELIMINARY_TENANT,
        monthlyRent: 4000000,
        depositAmount: 8000000,
        startDate: date('2026-11-01'),
        endDate: date('2027-10-31'),
      },
      {
        id: DRAFTS.OFFICE_V2,
        content:
          'Segundo borrador de arrendamiento de local comercial para la Oficina Centro Empresarial, canon mensual de 4.500.000 COP con servicios incluidos.',
        version: 2,
        landlordAgreed: true,
        tenantAgreed: false,
        createdByPropertyMemberId: MEMBERS.OFFICE_OWNER,
        propertyId: PROPERTIES.OFFICE,
        landlordMemberId: MEMBERS.OFFICE_OWNER,
        tenantMemberId: MEMBERS.OFFICE_PRELIMINARY_TENANT,
        monthlyRent: 4500000,
        depositAmount: 9000000,
        startDate: date('2026-11-01'),
        endDate: date('2027-10-31'),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.contract.createMany({
    data: [
      {
        id: CONTRACTS.APARTMENT_ACTIVE,
        propertyId: PROPERTIES.APARTMENT,
        landlordMemberId: MEMBERS.APARTMENT_OWNER,
        tenantMemberId: MEMBERS.APARTMENT_TENANT,
        monthlyRent: 2800000,
        depositAmount: 2800000,
        startDate: date('2026-01-01'),
        endDate: date('2026-12-31'),
        status: 'ACTIVO',
        createByUserId: USERS.OWNER,
      },
      {
        id: CONTRACTS.HOUSE_FINISHED,
        propertyId: PROPERTIES.HOUSE,
        landlordMemberId: MEMBERS.HOUSE_OWNER,
        tenantMemberId: MEMBERS.APARTMENT_TENANT,
        monthlyRent: 5000000,
        depositAmount: 5000000,
        startDate: date('2024-01-01'),
        endDate: date('2024-12-31'),
        status: 'FINALIZADO',
        createByUserId: USERS.OWNER,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.contractResources.createMany({
    data: [
      {
        contractId: CONTRACTS.APARTMENT_ACTIVE,
        resourceId: RESOURCES.CONTRACT_DOCUMENT,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.invitationLinked.createMany({
    data: [
      {
        id: '90000000-0000-4000-8000-000000000001',
        propertyId: PROPERTIES.OFFICE,
        invitedBy: USERS.OWNER,
        invitedUserId: USERS.INVITED,
        invitedEmailTo: 'invitado@example.com',
        token: 'seed-invitation-token-consumed',
        status: 'CONSUMED',
        expirationTime: date('2026-12-31'),
      },
      {
        id: '90000000-0000-4000-8000-000000000002',
        propertyId: PROPERTIES.APARTMENT,
        invitedBy: USERS.OWNER,
        invitedUserId: USERS.PROVIDER,
        invitedEmailTo: 'proveedor@example.com',
        token: 'seed-invitation-token-draft',
        status: 'DRAFT',
        expirationTime: date('2027-12-31'),
      },
      {
        id: '90000000-0000-4000-8000-000000000003',
        propertyId: PROPERTIES.HOUSE,
        invitedBy: USERS.OWNER,
        invitedUserId: USERS.ADMIN,
        invitedEmailTo: 'admin@example.com',
        token: 'seed-invitation-token-expired',
        status: 'EXPIRED',
        expirationTime: date('2025-01-01'),
      },
    ],
    skipDuplicates: true,
  });

  const services = await prisma.service.findMany({
    where: { name: { in: ['Aseo y limpieza', 'Plomería'] } },
  });
  const cleaning = services.find(
    (service) => service.name === 'Aseo y limpieza',
  )!;
  const plumbing = services.find((service) => service.name === 'Plomería')!;

  await prisma.serviceOffering.createMany({
    data: [
      {
        id: OFFERINGS.CLEANING,
        serviceId: cleaning.id,
        providerUserId: USERS.PROVIDER,
        propertyMemberId: null,
        scope: 'PUBLIC',
        status: 'ACTIVE',
        priceTypeAgreement: 'FIXED',
        basePrice: 120000,
        currency: 'COP',
      },
      {
        id: OFFERINGS.PLUMBING,
        serviceId: plumbing.id,
        providerUserId: USERS.PROVIDER,
        propertyMemberId: null,
        scope: 'PUBLIC',
        status: 'ACTIVE',
        priceTypeAgreement: 'NEGOTIABLE',
        basePrice: 180000,
        currency: 'COP',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.serviceRequest.createMany({
    data: [
      {
        id: REQUESTS.COMPLETED,
        serviceOfferingId: OFFERINGS.CLEANING,
        propertyId: PROPERTIES.APARTMENT,
        requestedByUserId: USERS.TENANT,
        providerUserId: USERS.PROVIDER,
        status: 'COMPLETED',
        notes: 'Limpieza profunda antes de recibir visitas.',
        publishedPrice: 120000,
        agreedPrice: 120000,
        priceAgreedAt: date('2026-03-02'),
        currency: 'COP',
        requestedAt: date('2026-03-01'),
        acceptedAt: date('2026-03-02'),
        startedAt: date('2026-03-04'),
        completedAt: date('2026-03-04'),
      },
      {
        id: REQUESTS.NEGOTIATING,
        serviceOfferingId: OFFERINGS.PLUMBING,
        propertyId: PROPERTIES.APARTMENT,
        requestedByUserId: USERS.TENANT,
        providerUserId: USERS.PROVIDER,
        status: 'ACCEPTED',
        notes: 'Fuga en el lavamanos del baño principal.',
        publishedPrice: 180000,
        proposedPrice: 150000,
        proposedByUserId: USERS.TENANT,
        currency: 'COP',
        requestedAt: date('2026-10-01'),
        acceptedAt: date('2026-10-02'),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.serviceRequestHistory.createMany({
    data: [
      {
        id: 'a0000000-0000-4000-8000-000000000001',
        serviceRequestId: REQUESTS.COMPLETED,
        action: 'CREATED',
        fromStatus: null,
        toStatus: 'REQUESTED',
        actorUserId: USERS.TENANT,
        createdAt: date('2026-03-01'),
      },
      {
        id: 'a0000000-0000-4000-8000-000000000002',
        serviceRequestId: REQUESTS.COMPLETED,
        action: 'ACCEPTED',
        fromStatus: 'REQUESTED',
        toStatus: 'ACCEPTED',
        actorUserId: USERS.PROVIDER,
        createdAt: date('2026-03-02'),
      },
      {
        id: 'a0000000-0000-4000-8000-000000000003',
        serviceRequestId: REQUESTS.COMPLETED,
        action: 'STARTED',
        fromStatus: 'ACCEPTED',
        toStatus: 'IN_PROGRESS',
        actorUserId: USERS.PROVIDER,
        createdAt: date('2026-03-04'),
      },
      {
        id: 'a0000000-0000-4000-8000-000000000004',
        serviceRequestId: REQUESTS.COMPLETED,
        action: 'COMPLETED',
        fromStatus: 'IN_PROGRESS',
        toStatus: 'COMPLETED',
        actorUserId: USERS.PROVIDER,
        createdAt: date('2026-03-04'),
      },
      {
        id: 'a0000000-0000-4000-8000-000000000005',
        serviceRequestId: REQUESTS.NEGOTIATING,
        action: 'CREATED',
        fromStatus: null,
        toStatus: 'REQUESTED',
        actorUserId: USERS.TENANT,
        createdAt: date('2026-10-01'),
      },
      {
        id: 'a0000000-0000-4000-8000-000000000006',
        serviceRequestId: REQUESTS.NEGOTIATING,
        action: 'ACCEPTED',
        fromStatus: 'REQUESTED',
        toStatus: 'ACCEPTED',
        actorUserId: USERS.PROVIDER,
        createdAt: date('2026-10-02'),
      },
      {
        id: 'a0000000-0000-4000-8000-000000000007',
        serviceRequestId: REQUESTS.NEGOTIATING,
        action: 'PRICE_PROPOSED',
        fromStatus: 'ACCEPTED',
        toStatus: 'ACCEPTED',
        actorUserId: USERS.TENANT,
        reason:
          'Se propone un valor menor por tratarse de una reparación menor.',
        createdAt: date('2026-10-03'),
      },
    ],
    skipDuplicates: true,
  });

  const today = date('2026-10-18');
  const rentTransactions = monthlyDueDates.map(({ index, month, dueDate }) => {
    const overdue = index === 8;
    const paid = dueDate < today && !overdue;
    return {
      id: `b0000000-0000-4000-8000-0000000001${month}`,
      propertyId: PROPERTIES.APARTMENT,
      contractId: CONTRACTS.APARTMENT_ACTIVE,
      type: 'INCOME' as const,
      category: 'RENT' as const,
      status: paid
        ? ('PAID' as const)
        : overdue
          ? ('OVERDUE' as const)
          : index === 9
            ? ('PENDING' as const)
            : ('PLANNED' as const),
      description: `Canon de arrendamiento ${month}/2026`,
      amount: 2800000,
      currency: 'COP' as const,
      dueDate,
      occurredAt: dueDate,
      paidAt: paid ? date(`2026-${month}-04`) : null,
      isSimulated: true,
    };
  });

  await prisma.financialTransaction.createMany({
    data: [
      ...rentTransactions,
      {
        id: 'b0000000-0000-4000-8000-000000000201',
        propertyId: PROPERTIES.APARTMENT,
        contractId: CONTRACTS.APARTMENT_ACTIVE,
        type: 'INCOME',
        category: 'DEPOSIT',
        status: 'PAID',
        description: 'Depósito de garantía del contrato',
        amount: 2800000,
        currency: 'COP',
        dueDate: date('2026-01-01'),
        occurredAt: date('2026-01-01'),
        paidAt: date('2025-12-30'),
        isSimulated: true,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000202',
        propertyId: PROPERTIES.APARTMENT,
        contractId: CONTRACTS.APARTMENT_ACTIVE,
        type: 'EXPENSE',
        category: 'UTILITY',
        status: 'PAID',
        description: 'Servicio de energía septiembre 2026',
        amount: 185400.5,
        currency: 'COP',
        dueDate: date('2026-09-20'),
        occurredAt: date('2026-09-15'),
        paidAt: date('2026-09-18'),
        isSimulated: true,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000203',
        propertyId: PROPERTIES.APARTMENT,
        contractId: CONTRACTS.APARTMENT_ACTIVE,
        type: 'EXPENSE',
        category: 'UTILITY',
        status: 'PENDING',
        description: 'Servicio de agua octubre 2026',
        amount: 96300,
        currency: 'COP',
        dueDate: date('2026-10-25'),
        occurredAt: date('2026-10-10'),
        paidAt: null,
        isSimulated: true,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000204',
        propertyId: PROPERTIES.APARTMENT,
        contractId: null,
        type: 'EXPENSE',
        category: 'SERVICE',
        status: 'PAID',
        description: 'Servicio de aseo y limpieza',
        amount: 120000,
        currency: 'COP',
        dueDate: date('2026-03-04'),
        occurredAt: date('2026-03-04'),
        paidAt: date('2026-03-05'),
        isSimulated: true,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000205',
        propertyId: PROPERTIES.APARTMENT,
        contractId: null,
        type: 'EXPENSE',
        category: 'MAINTENANCE',
        status: 'PENDING',
        description: 'Reparación de fuga en lavamanos',
        amount: 150000,
        currency: 'COP',
        dueDate: date('2026-10-30'),
        occurredAt: date('2026-10-05'),
        paidAt: null,
        isSimulated: true,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000206',
        propertyId: PROPERTIES.HOUSE,
        contractId: CONTRACTS.HOUSE_FINISHED,
        type: 'INCOME',
        category: 'RENT',
        status: 'CANCELLED',
        description:
          'Canon de arrendamiento anulado por finalización de contrato',
        amount: 5000000,
        currency: 'COP',
        dueDate: date('2025-01-05'),
        occurredAt: date('2025-01-05'),
        paidAt: null,
        isSimulated: true,
      },
      {
        id: 'b0000000-0000-4000-8000-000000000207',
        propertyId: PROPERTIES.OFFICE,
        contractId: null,
        type: 'EXPENSE',
        category: 'OTHER',
        status: 'OVERDUE',
        description: 'Cuota de administración del edificio',
        amount: 650000,
        currency: 'COP',
        dueDate: date('2026-09-10'),
        occurredAt: date('2026-09-01'),
        paidAt: null,
        isSimulated: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.notifications.createMany({
    data: [
      {
        id: 'c0000000-0000-4000-8000-000000000001',
        transmitterId: USERS.OWNER,
        receiverId: USERS.TENANT,
        source: 'Contract-service',
        type: 'INFO',
        name: 'Contrato activado',
        content:
          'El contrato de arrendamiento del Apartamento Chapinero Alto ya se encuentra activo.',
        readAt: date('2026-01-02'),
      },
      {
        id: 'c0000000-0000-4000-8000-000000000002',
        transmitterId: USERS.OWNER,
        receiverId: USERS.PRELIMINARY_TENANT,
        source: 'Contract-service',
        type: 'INFO',
        name: 'Nuevo borrador de contrato',
        content:
          'Se ha generado la versión 2 del borrador de contrato para la Oficina Centro Empresarial.',
        readAt: null,
      },
      {
        id: 'c0000000-0000-4000-8000-000000000003',
        transmitterId: USERS.OWNER,
        receiverId: USERS.TENANT,
        source: 'financial-module',
        type: 'WARNING',
        name: 'Pago próximo a vencer',
        content:
          'El servicio de agua de octubre vence el 25 de octubre de 2026.',
        readAt: null,
      },
      {
        id: 'c0000000-0000-4000-8000-000000000004',
        transmitterId: USERS.OWNER,
        receiverId: USERS.OWNER,
        source: 'financial-module',
        type: 'ERROR',
        name: 'Obligación vencida',
        content:
          'La cuota de administración de la Oficina Centro Empresarial se encuentra vencida.',
        readAt: null,
      },
    ],
    skipDuplicates: true,
  });
}
