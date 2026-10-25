import {
  CANCELLED_MAINTENANCE_PROBABILITY,
  CONTRACT_TERM_MONTHS,
  HISTORY_MONTHS,
  LANDLORD_COUNT,
  MAINTENANCE_PROBABILITY,
  MAX_START_OFFSET,
  NOW,
  PROPERTY_COUNT,
  PROVIDER_COUNT,
  TEST_USER_ID,
  TEST_USER_PROPERTY_COUNT,
  TENANT_RISK_LEVELS,
  TENANT_RISK_WEIGHTS,
  USD_EVERY,
  USD_OFFSET,
} from '../config.js';
import {
  CITIES,
  OCCUPIED_OCCUPATION_KEY,
  PROPERTY_TYPES,
  PUBLIC_SERVICE_TYPES,
  SERVICES,
  STREET_TYPES,
  STREET_TYPE_WEIGHTS,
  type Range,
} from '../data/catalogs.js';
import { rngFor, stableId, type Rng } from '../utils/hash.js';
import {
  addDays,
  addMinutes,
  addMonths,
  atDay,
  monthStart,
} from '../utils/dates.js';
import { round2, roundMoney, roundTo } from '../utils/money.js';
import type {
  ContractPlan,
  Currency,
  MaintenanceEventPlan,
  Portfolio,
  PropertyPlan,
  PublicServicePlan,
  ServiceOfferingPlan,
} from './types.js';

let cached: Portfolio | null = null;

export function getPortfolio(): Portfolio {
  if (cached === null) {
    cached = buildPortfolio();
  }
  return cached;
}

function intIn(rng: Rng, range: Range): number {
  return rng.int(range[0], range[1]);
}

function buildPortfolio(): Portfolio {
  const historyStart = addMonths(monthStart(NOW), -(HISTORY_MONTHS - 1));
  const monthDates = Array.from({ length: HISTORY_MONTHS + 1 }, (_, offset) =>
    addMonths(historyStart, offset),
  );

  const landlordIds = Array.from({ length: LANDLORD_COUNT }, (_, index) =>
    stableId(`user:landlord:${index}`),
  );
  const totalProperties = PROPERTY_COUNT + TEST_USER_PROPERTY_COUNT;
  const tenantIds = Array.from({ length: totalProperties }, (_, index) =>
    stableId(`user:tenant:${index}`),
  );
  const providerIds = Array.from({ length: PROVIDER_COUNT }, (_, index) =>
    stableId(`user:provider:${index}`),
  );

  const offerings = buildOfferings(providerIds, historyStart);
  // Los inmuebles con índice >= PROPERTY_COUNT pertenecen al usuario de pruebas
  const properties = Array.from({ length: totalProperties }, (_, index) =>
    buildProperty(index, landlordIds, tenantIds, historyStart),
  );
  const maintenanceEvents = properties.flatMap((property) =>
    buildMaintenanceEvents(property, monthDates, offerings),
  );

  return {
    historyStart,
    monthDates,
    landlordIds: TEST_USER_PROPERTY_COUNT > 0 ? [...landlordIds, TEST_USER_ID] : landlordIds,
    tenantIds,
    providerIds,
    properties,
    offerings,
    maintenanceEvents,
  };
}

function buildOfferings(
  providerIds: string[],
  historyStart: Date,
): ServiceOfferingPlan[] {
  const offerings: ServiceOfferingPlan[] = [];
  const currencies: Currency[] = ['COP', 'USD'];

  providerIds.forEach((providerUserId, providerIndex) => {
    for (let slot = 0; slot < 3; slot += 1) {
      const service = SERVICES[(providerIndex * 2 + slot) % SERVICES.length];
      if (service === undefined) {
        continue;
      }
      for (const currency of currencies) {
        const key = `${providerIndex}:${service.key}:${currency}`;
        const rng = rngFor(`offering:${key}`);
        const basePrice =
          currency === 'COP'
            ? roundTo(
                rng.float(service.priceCop[0], service.priceCop[1]),
                5_000,
              )
            : roundTo(rng.float(service.priceUsd[0], service.priceUsd[1]), 1);

        offerings.push({
          id: stableId(`offering:${key}`),
          serviceKey: service.key,
          providerUserId,
          currency,
          priceType: service.priceType,
          basePrice,
          createdAt: addDays(historyStart, -30),
        });
      }
    }
  });

  return offerings;
}

function buildProperty(
  index: number,
  landlordIds: string[],
  tenantIds: string[],
  historyStart: Date,
): PropertyPlan {
  const rng = rngFor(`property:${index}`);
  const id = stableId(`property:${index}`);
  const ownerId =
    index >= PROPERTY_COUNT
      ? TEST_USER_ID
      : (landlordIds[index % landlordIds.length] as string);
  const tenantId = tenantIds[index] as string;

  const profile = rng.weighted(
    PROPERTY_TYPES,
    PROPERTY_TYPES.map((item) => item.weight),
  );
  const city = rng.weighted(
    CITIES,
    CITIES.map((item) => item.weight),
  );
  const neighborhood = rng.pick(city.neighborhoods);

  const currency: Currency = index % USD_EVERY === USD_OFFSET ? 'USD' : 'COP';
  const rentRange = currency === 'COP' ? profile.rentCop : profile.rentUsd;
  const rentStep = currency === 'COP' ? 50_000 : 5;
  const firstRent = roundTo(rng.float(rentRange[0], rentRange[1]), rentStep);

  const startOffset = rng.int(0, MAX_START_OFFSET);
  const currentContractIndex = Math.floor(
    (HISTORY_MONTHS - 1 - startOffset) / CONTRACT_TERM_MONTHS,
  );
  const nextMonthCovered =
    Math.floor((HISTORY_MONTHS - startOffset) / CONTRACT_TERM_MONTHS) ===
    currentContractIndex;

  const landlordMemberId = stableId(`member:landlord:${index}`);
  const tenantMemberId = stableId(`member:tenant:${index}`);

  const contracts: ContractPlan[] = [];
  let rent = firstRent;
  for (let position = 0; position <= currentContractIndex; position += 1) {
    if (position > 0) {
      rent = roundTo(rent * rng.float(1.05, 1.07), rentStep);
    }
    const startDate = addMonths(
      historyStart,
      startOffset + position * CONTRACT_TERM_MONTHS,
    );
    const endDate = new Date(
      addMonths(startDate, CONTRACT_TERM_MONTHS).getTime() - 1000,
    );
    const isCurrent = position === currentContractIndex;

    contracts.push({
      id: stableId(`contract:${index}:${position}`),
      propertyId: id,
      landlordMemberId,
      tenantMemberId,
      monthlyRent: rent,
      depositAmount: firstRent,
      startDate,
      endDate,
      status: isCurrent ? 'ACTIVO' : 'FINALIZADO',
      createByUserId: ownerId,
      createAt: addDays(startDate, -15),
      updateAt: isCurrent ? startDate : endDate,
    });
  }

  const area = round2(rng.float(profile.area[0], profile.area[1]));
  const structure = {
    bedrooms: intIn(rng, profile.bedrooms),
    bathrooms: intIn(rng, profile.bathrooms),
    floors: intIn(rng, profile.floors),
    parkingSpaces: intIn(rng, profile.parking),
    area,
    lotArea: round2(
      area * rng.float(profile.lotFactor[0], profile.lotFactor[1]),
    ),
    constructionYear: rng.int(1985, 2022),
  };

  const publicServices: PublicServicePlan[] = [];
  for (const type of PUBLIC_SERVICE_TYPES) {
    if (rng.chance(type.presence)) {
      publicServices.push({
        id: stableId(`public-service:${index}:${type.key}`),
        typeKey: type.key,
        accountNumber: String(rng.int(10_000_000, 99_999_999)),
      });
    }
  }

  const description =
    structure.bedrooms > 0
      ? `${profile.name} de ${structure.bedrooms} habitaciones en ${neighborhood}, ${city.city}`
      : `${profile.name} en ${neighborhood}, ${city.city}`;

  const predialNumber = Array.from({ length: 5 }, () =>
    String(rng.int(0, 9999)).padStart(4, '0'),
  ).join('');

  const firstContract = contracts[0] as ContractPlan;

  return {
    index,
    id,
    ownerId,
    tenantId,
    typeKey: profile.key,
    occupationKey: OCCUPIED_OCCUPATION_KEY,
    name: `${profile.name} ${neighborhood} ${index + 1}`,
    description,
    fmi: `${city.fmiCircle}-${rng.int(10_000, 999_999)}`,
    predialNumber,
    currency,
    firstRent,
    currentRent: rent,
    depositAmount: firstRent,
    utilitiesIncluded: rng.chance(0.4),
    adminPct: rng.float(0.07, 0.13),
    utilityPct: rng.float(0.06, 0.12),
    insurancePct: rng.float(0.1, 0.2),
    taxPct: rng.float(0.35, 0.8),
    tenantRisk: rng.weighted(TENANT_RISK_LEVELS, TENANT_RISK_WEIGHTS),
    startOffset,
    currentContractIndex,
    nextMonthCovered,
    landlordMemberId,
    tenantMemberId,
    createAt: addDays(firstContract.startDate, -45),
    direction: {
      latitude:
        Math.round((city.latitude + rng.float(-0.03, 0.03)) * 1e6) / 1e6,
      longitude:
        Math.round((city.longitude + rng.float(-0.03, 0.03)) * 1e6) / 1e6,
      department: city.department,
      city: city.city,
      neighborhood,
      typeStreet: rng.weighted(STREET_TYPES, STREET_TYPE_WEIGHTS),
      numberStreet: rng.int(1, 120),
      complement: `${profile.complementLabel} ${rng.int(1, 1200)}`,
    },
    structure,
    publicServices,
    contracts,
  };
}

function buildMaintenanceEvents(
  property: PropertyPlan,
  monthDates: Date[],
  offerings: ServiceOfferingPlan[],
): MaintenanceEventPlan[] {
  const events: MaintenanceEventPlan[] = [];

  for (
    let monthIndex = property.startOffset;
    monthIndex < HISTORY_MONTHS;
    monthIndex += 1
  ) {
    const rng = rngFor(`maintenance:${property.index}:${monthIndex}`);
    if (!rng.chance(MAINTENANCE_PROBABILITY)) {
      continue;
    }

    const service = rng.weighted(
      SERVICES,
      SERVICES.map((item) => item.weight),
    );
    const candidates = offerings.filter(
      (offering) =>
        offering.serviceKey === service.key &&
        offering.currency === property.currency,
    );
    if (candidates.length === 0) {
      continue;
    }
    const offering = rng.pick(candidates);

    const monthDate = monthDates[monthIndex] as Date;
    const requestedAt = atDay(
      monthDate,
      rng.int(2, 18),
      rng.int(8, 17),
      rng.int(0, 59),
    );
    const finishAt = addDays(requestedAt, 5);
    if (finishAt > NOW) {
      continue;
    }

    const cancelled = rng.chance(CANCELLED_MAINTENANCE_PROBABILITY);
    const publishedPrice = offering.basePrice;
    let proposedPrice: number | null = null;
    let proposedByUserId: string | null = null;
    let agreedPrice: number | null = null;

    if (!cancelled) {
      if (offering.priceType === 'FIXED') {
        agreedPrice = publishedPrice;
      } else if (offering.priceType === 'NEGOTIABLE') {
        proposedPrice = roundMoney(
          publishedPrice * rng.float(1.05, 1.35),
          property.currency,
        );
        proposedByUserId = offering.providerUserId;
        agreedPrice = roundMoney(
          publishedPrice * rng.float(0.95, 1.25),
          property.currency,
        );
      } else {
        proposedPrice = roundMoney(
          publishedPrice * rng.float(1.2, 2.0),
          property.currency,
        );
        proposedByUserId = offering.providerUserId;
        agreedPrice = roundMoney(
          proposedPrice * rng.float(0.9, 1.0),
          property.currency,
        );
      }
    }

    const acceptedAt = addDays(requestedAt, 1);

    events.push({
      id: stableId(`service-request:${property.index}:${monthIndex}`),
      propertyId: property.id,
      propertyIndex: property.index,
      monthIndex,
      serviceKey: service.key,
      serviceName: service.name,
      offeringId: offering.id,
      providerUserId: offering.providerUserId,
      requestedByUserId: rng.chance(0.5) ? property.ownerId : property.tenantId,
      ownerId: property.ownerId,
      currency: property.currency,
      priceType: offering.priceType,
      status: cancelled ? 'CANCELLED' : 'COMPLETED',
      publishedPrice,
      proposedPrice,
      proposedByUserId,
      agreedPrice,
      amount: agreedPrice ?? publishedPrice,
      requestedAt,
      acceptedAt,
      priceAgreedAt: cancelled ? null : addMinutes(acceptedAt, 150),
      startedAt: cancelled ? null : addDays(requestedAt, 3),
      completedAt: cancelled ? null : finishAt,
      cancelledAt: cancelled ? addDays(requestedAt, 2) : null,
      notes: `Solicitud de ${service.name.toLowerCase()} para ${property.name}`,
    });
  }

  return events;
}
