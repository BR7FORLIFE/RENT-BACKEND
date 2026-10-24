import type { PrismaClient } from "../prisma.js";
import { INSERT_BATCH_SIZE } from "../config.js";
import { buildFinancialTransactions } from "../plan/financial.js";
import { chunk } from "../utils/batch.js";

export async function seedFinancialTransactions(prisma: PrismaClient): Promise<number> {
  const rows = buildFinancialTransactions();

  for (const batch of chunk(rows, INSERT_BATCH_SIZE)) {
    await prisma.financialTransaction.createMany({
      data: batch.map((row) => ({
        id: row.id,
        propertyId: row.propertyId,
        contractId: row.contractId,
        type: row.type,
        category: row.category,
        status: row.status,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        dueDate: row.dueDate,
        occurredAt: row.occurredAt,
        paidAt: row.paidAt,
        isSimulated: row.isSimulated,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      skipDuplicates: true,
    });
  }

  return rows.length;
}
