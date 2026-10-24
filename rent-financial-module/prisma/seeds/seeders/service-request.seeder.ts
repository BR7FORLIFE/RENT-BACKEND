import type { PrismaClient } from "../prisma.js";
import { INSERT_BATCH_SIZE } from "../config.js";
import { getPortfolio } from "../plan/portfolio.js";
import type { MaintenanceEventPlan, RequestStatus } from "../plan/types.js";
import { addMinutes } from "../utils/dates.js";
import { chunk } from "../utils/batch.js";
import { stableId } from "../utils/hash.js";

type HistoryAction =
  | "CREATED"
  | "ACCEPTED"
  | "REJECTED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED"
  | "PRICE_PROPOSED"
  | "PRICE_AGREED";

interface HistoryEntry {
  action: HistoryAction;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  actorUserId: string;
  reason: string | null;
  createdAt: Date;
}

function buildHistory(event: MaintenanceEventPlan): HistoryEntry[] {
  const entries: HistoryEntry[] = [
    {
      action: "CREATED",
      fromStatus: null,
      toStatus: "REQUESTED",
      actorUserId: event.requestedByUserId,
      reason: null,
      createdAt: event.requestedAt,
    },
    {
      action: "ACCEPTED",
      fromStatus: "REQUESTED",
      toStatus: "ACCEPTED",
      actorUserId: event.providerUserId,
      reason: null,
      createdAt: event.acceptedAt,
    },
  ];

  if (event.cancelledAt !== null) {
    entries.push({
      action: "CANCELLED",
      fromStatus: "ACCEPTED",
      toStatus: "CANCELLED",
      actorUserId: event.ownerId,
      reason: "El propietario canceló la solicitud",
      createdAt: event.cancelledAt,
    });
    return entries;
  }

  if (event.proposedPrice !== null && event.proposedByUserId !== null) {
    entries.push({
      action: "PRICE_PROPOSED",
      fromStatus: "ACCEPTED",
      toStatus: "ACCEPTED",
      actorUserId: event.proposedByUserId,
      reason: null,
      createdAt: addMinutes(event.acceptedAt, 60),
    });
  }

  if (event.priceAgreedAt !== null) {
    entries.push({
      action: "PRICE_AGREED",
      fromStatus: "ACCEPTED",
      toStatus: "ACCEPTED",
      actorUserId: event.ownerId,
      reason: null,
      createdAt: event.priceAgreedAt,
    });
  }

  if (event.startedAt !== null) {
    entries.push({
      action: "STARTED",
      fromStatus: "ACCEPTED",
      toStatus: "IN_PROGRESS",
      actorUserId: event.providerUserId,
      reason: null,
      createdAt: event.startedAt,
    });
  }

  if (event.completedAt !== null) {
    entries.push({
      action: "COMPLETED",
      fromStatus: "IN_PROGRESS",
      toStatus: "COMPLETED",
      actorUserId: event.providerUserId,
      reason: null,
      createdAt: event.completedAt,
    });
  }

  return entries;
}

export async function seedServiceRequests(prisma: PrismaClient): Promise<void> {
  const { maintenanceEvents } = getPortfolio();

  for (const batch of chunk(maintenanceEvents, INSERT_BATCH_SIZE)) {
    const history = batch.map((event) => ({ event, entries: buildHistory(event) }));

    await prisma.serviceRequest.createMany({
      data: history.map(({ event, entries }) => ({
        id: event.id,
        serviceOfferingId: event.offeringId,
        propertyId: event.propertyId,
        requestedByUserId: event.requestedByUserId,
        providerUserId: event.providerUserId,
        status: event.status,
        notes: event.notes,
        publishedPrice: event.publishedPrice,
        proposedPrice: event.proposedPrice,
        proposedByUserId: event.proposedByUserId,
        agreedPrice: event.agreedPrice,
        priceAgreedAt: event.priceAgreedAt,
        currency: event.currency,
        requestedAt: event.requestedAt,
        acceptedAt: event.acceptedAt,
        startedAt: event.startedAt,
        completedAt: event.completedAt,
        cancelledAt: event.cancelledAt,
        createdAt: event.requestedAt,
        updatedAt: (entries[entries.length - 1] ?? { createdAt: event.requestedAt }).createdAt,
      })),
      skipDuplicates: true,
    });

    await prisma.serviceRequestHistory.createMany({
      data: history.flatMap(({ event, entries }) =>
        entries.map((entry, position) => ({
          id: stableId(`service-request-history:${event.id}:${position}`),
          serviceRequestId: event.id,
          action: entry.action,
          fromStatus: entry.fromStatus,
          toStatus: entry.toStatus,
          actorUserId: entry.actorUserId,
          reason: entry.reason,
          createdAt: entry.createdAt,
        })),
      ),
      skipDuplicates: true,
    });
  }
}
