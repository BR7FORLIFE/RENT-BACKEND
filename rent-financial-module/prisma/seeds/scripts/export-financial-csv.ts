import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildFinancialTransactions } from '../plan/financial.js';

const COLUMNS = [
  'id',
  'property_id',
  'contract_id',
  'type',
  'category',
  'status',
  'description',
  'amount',
  'currency',
  'due_date',
  'occurred_at',
  'paid_at',
  'is_simulated',
  'created_at',
  'updated_at',
] as const;

function formatDate(value: Date | null): string {
  return value === null ? '' : `${value.toISOString().slice(0, 19)}Z`;
}

function escapeCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

const rows = buildFinancialTransactions().map((row) =>
  [
    row.id,
    row.propertyId,
    row.contractId ?? '',
    row.type,
    row.category,
    row.status,
    row.description,
    row.amount.toFixed(2),
    row.currency,
    formatDate(row.dueDate),
    formatDate(row.occurredAt),
    formatDate(row.paidAt),
    String(row.isSimulated),
    formatDate(row.createdAt),
    formatDate(row.updatedAt),
  ]
    .map(escapeCell)
    .join(','),
);

const target = resolve(
  process.argv[2] ?? 'prisma/seeds/output/financial_transactions.csv',
);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${COLUMNS.join(',')}\n${rows.join('\n')}\n`, 'utf8');

console.log(`${rows.length} filas exportadas a ${target}`);
