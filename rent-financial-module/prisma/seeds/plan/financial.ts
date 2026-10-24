import {
  CONTRACT_TERM_MONTHS,
  HISTORY_MONTHS,
  LATE_FEE_AFTER_DAYS,
  LATE_FEE_RATE,
  NOW,
  UNPAID_AFTER_DAYS,
} from '../config.js';
import {
  addDays,
  addMinutes,
  atDay,
  calendarMonth,
  maxDate,
  minDate,
  monthLabel,
} from '../utils/dates.js';
import { rngFor, stableId, type Rng } from '../utils/hash.js';
import { roundMoney } from '../utils/money.js';
import { getPortfolio } from './portfolio.js';
import type {
  ContractPlan,
  FinancialCategory,
  FinancialTransactionPlan,
  MaintenanceEventPlan,
  PropertyPlan,
  RecordStatus,
  TransactionType,
} from './types.js';

interface RowInput {
  key: string;
  property: PropertyPlan;
  contractId: string | null;
  type: TransactionType;
  category: FinancialCategory;
  description: string;
  amount: number;
  occurredAt: Date;
  dueDate: Date;
  paidAt: Date | null;
  forceStatus?: RecordStatus;
}

const INSURANCE_MONTHS = [1, 4, 7, 10];
const TAX_MONTH = 4;
const HIGH_UTILITY_MONTHS = [12, 1, 6, 7];

function resolve(input: RowInput): {
  status: RecordStatus;
  paidAt: Date | null;
} {
  if (input.forceStatus !== undefined) {
    return { status: input.forceStatus, paidAt: null };
  }
  if (input.occurredAt > NOW) {
    return { status: 'PLANNED', paidAt: null };
  }
  if (input.paidAt !== null && input.paidAt <= NOW) {
    return { status: 'PAID', paidAt: input.paidAt };
  }
  if (input.dueDate > NOW) {
    return { status: 'PENDING', paidAt: null };
  }
  return { status: 'OVERDUE', paidAt: null };
}

function toRow(input: RowInput, rng: Rng): FinancialTransactionPlan {
  const { status, paidAt } = resolve(input);
  const createdMinutes = rng.int(0, 90);
  const createdBack = rng.int(1, 600);
  const updatedDays = rng.int(0, 2);

  const createdAt =
    status === 'PLANNED'
      ? addMinutes(NOW, -createdBack)
      : minDate(addMinutes(input.occurredAt, createdMinutes), NOW);
  const updatedAt =
    paidAt !== null
      ? minDate(maxDate(createdAt, paidAt), NOW)
      : minDate(addDays(createdAt, updatedDays), NOW);

  return {
    id: stableId(input.key),
    propertyId: input.property.id,
    contractId: input.contractId,
    type: input.type,
    category: input.category,
    status,
    description: input.description,
    amount: input.amount,
    currency: input.property.currency,
    dueDate: input.dueDate,
    occurredAt: input.occurredAt,
    paidAt,
    isSimulated: true,
    createdAt,
    updatedAt,
  };
}

function paidBefore(dueDate: Date, occurredAt: Date, daysEarly: number): Date {
  return maxDate(addDays(dueDate, -daysEarly), occurredAt);
}

function monthRows(
  property: PropertyPlan,
  monthIndex: number,
  monthDate: Date,
  events: MaintenanceEventPlan[],
  rng: Rng,
): FinancialTransactionPlan[] {
  const rows: FinancialTransactionPlan[] = [];
  const label = monthLabel(monthDate);
  const prefix = `tx:${property.index}:${monthIndex}`;
  const currency = property.currency;
  const contractPosition = Math.floor(
    (monthIndex - property.startOffset) / CONTRACT_TERM_MONTHS,
  );
  const contract = property.contracts[contractPosition] as ContractPlan;
  const rentScale = contract.monthlyRent / property.firstRent;
  const calendar = calendarMonth(monthDate);

  const rentOccurred = atDay(monthDate, 1, rng.int(7, 17), rng.int(0, 59));
  const rentDue = atDay(monthDate, 5, 23, 0);
  const delayDays = Math.floor(rng.exponential(1 + 10 * property.tenantRisk));
  const earlyDays = rng.int(0, 3);
  const rentPaid =
    delayDays > UNPAID_AFTER_DAYS
      ? null
      : maxDate(addDays(rentDue, delayDays - earlyDays), rentOccurred);

  const rentRow = toRow(
    {
      key: `${prefix}:rent`,
      property,
      contractId: contract.id,
      type: 'INCOME',
      category: 'RENT',
      description: `Pago de canon de arrendamiento - ${label}`,
      amount: contract.monthlyRent,
      occurredAt: rentOccurred,
      dueDate: rentDue,
      paidAt: rentPaid,
    },
    rng,
  );
  rows.push(rentRow);

  if (
    rentRow.status === 'PAID' &&
    rentRow.paidAt !== null &&
    delayDays > LATE_FEE_AFTER_DAYS
  ) {
    rows.push(
      toRow(
        {
          key: `${prefix}:late-fee`,
          property,
          contractId: contract.id,
          type: 'INCOME',
          category: 'OTHER',
          description: `Recargo por mora - ${label}`,
          amount: roundMoney(contract.monthlyRent * LATE_FEE_RATE, currency),
          occurredAt: rentRow.paidAt,
          dueDate: rentRow.paidAt,
          paidAt: rentRow.paidAt,
        },
        rng,
      ),
    );
  }

  if (monthIndex === property.startOffset) {
    const depositOccurred = atDay(monthDate, 1, rng.int(7, 17), rng.int(0, 59));
    const depositDue = atDay(monthDate, 5, 23, 0);
    rows.push(
      toRow(
        {
          key: `${prefix}:deposit`,
          property,
          contractId: contract.id,
          type: 'INCOME',
          category: 'DEPOSIT',
          description: `Depósito de garantía - ${label}`,
          amount: property.depositAmount,
          occurredAt: depositOccurred,
          dueDate: depositDue,
          paidAt: paidBefore(depositDue, depositOccurred, rng.int(0, 2)),
        },
        rng,
      ),
    );
  }

  const adminOccurred = atDay(monthDate, 2, rng.int(7, 17), rng.int(0, 59));
  const adminDue = atDay(monthDate, 10, 23, 0);
  rows.push(
    toRow(
      {
        key: `${prefix}:admin`,
        property,
        contractId: null,
        type: 'EXPENSE',
        category: 'SERVICE',
        description: `Cuota de administración - ${label}`,
        amount: roundMoney(
          property.firstRent * property.adminPct * rentScale,
          currency,
        ),
        occurredAt: adminOccurred,
        dueDate: adminDue,
        paidAt: paidBefore(adminDue, adminOccurred, rng.int(0, 3)),
      },
      rng,
    ),
  );

  if (property.utilitiesIncluded) {
    const utilityOccurred = atDay(monthDate, 3, rng.int(7, 17), rng.int(0, 59));
    const utilityDue = atDay(monthDate, 15, 23, 0);
    const season = HIGH_UTILITY_MONTHS.includes(calendar) ? 1.1 : 1;
    rows.push(
      toRow(
        {
          key: `${prefix}:utility`,
          property,
          contractId: null,
          type: 'EXPENSE',
          category: 'UTILITY',
          description: `Pago de servicios públicos - ${label}`,
          amount: roundMoney(
            property.firstRent *
              property.utilityPct *
              season *
              rng.float(0.92, 1.08),
            currency,
          ),
          occurredAt: utilityOccurred,
          dueDate: utilityDue,
          paidAt: paidBefore(utilityDue, utilityOccurred, rng.int(0, 4)),
        },
        rng,
      ),
    );
  }

  if (INSURANCE_MONTHS.includes(calendar)) {
    const insuranceOccurred = atDay(
      monthDate,
      4,
      rng.int(7, 17),
      rng.int(0, 59),
    );
    const insuranceDue = atDay(monthDate, 20, 23, 0);
    rows.push(
      toRow(
        {
          key: `${prefix}:insurance`,
          property,
          contractId: null,
          type: 'EXPENSE',
          category: 'OTHER',
          description: `Póliza de seguro del inmueble - ${label}`,
          amount: roundMoney(
            property.firstRent * property.insurancePct,
            currency,
          ),
          occurredAt: insuranceOccurred,
          dueDate: insuranceDue,
          paidAt: paidBefore(insuranceDue, insuranceOccurred, rng.int(0, 5)),
        },
        rng,
      ),
    );
  }

  if (calendar === TAX_MONTH) {
    const taxOccurred = atDay(monthDate, 3, rng.int(7, 17), rng.int(0, 59));
    const taxDue = atDay(monthDate, 28, 23, 0);
    rows.push(
      toRow(
        {
          key: `${prefix}:tax`,
          property,
          contractId: null,
          type: 'EXPENSE',
          category: 'OTHER',
          description: `Impuesto predial - ${label}`,
          amount: roundMoney(
            property.firstRent *
              property.taxPct *
              (1 + 0.05 * Math.floor(monthIndex / 12)),
            currency,
          ),
          occurredAt: taxOccurred,
          dueDate: taxDue,
          paidAt: paidBefore(taxDue, taxOccurred, rng.int(0, 6)),
        },
        rng,
      ),
    );
  }

  for (const event of events.filter((item) => item.monthIndex === monthIndex)) {
    const occurredAt =
      event.cancelledAt ?? event.completedAt ?? event.requestedAt;
    const dueDate = addDays(occurredAt, 7);
    rows.push(
      toRow(
        {
          key: `${prefix}:maintenance:${event.id}`,
          property,
          contractId: null,
          type: 'EXPENSE',
          category: 'MAINTENANCE',
          description: `Mantenimiento: ${event.serviceName} - ${label}`,
          amount: event.amount,
          occurredAt,
          dueDate,
          paidAt: paidBefore(dueDate, occurredAt, rng.int(0, 5)),
          forceStatus: event.status === 'CANCELLED' ? 'CANCELLED' : undefined,
        },
        rng,
      ),
    );
  }

  return rows;
}

function plannedRows(
  property: PropertyPlan,
  monthDate: Date,
  rng: Rng,
): FinancialTransactionPlan[] {
  const rows: FinancialTransactionPlan[] = [];
  const label = monthLabel(monthDate);
  const prefix = `tx:${property.index}:${HISTORY_MONTHS}`;
  const occurredAt = atDay(monthDate, 1, 8, 0);
  const currentContract = property.contracts[
    property.currentContractIndex
  ] as ContractPlan;

  if (property.nextMonthCovered) {
    rows.push(
      toRow(
        {
          key: `${prefix}:rent`,
          property,
          contractId: currentContract.id,
          type: 'INCOME',
          category: 'RENT',
          description: `Pago de canon de arrendamiento - ${label}`,
          amount: currentContract.monthlyRent,
          occurredAt,
          dueDate: atDay(monthDate, 5, 23, 0),
          paidAt: null,
          forceStatus: 'PLANNED',
        },
        rng,
      ),
    );
  }

  rows.push(
    toRow(
      {
        key: `${prefix}:admin`,
        property,
        contractId: null,
        type: 'EXPENSE',
        category: 'SERVICE',
        description: `Cuota de administración - ${label}`,
        amount: roundMoney(
          property.firstRent *
            property.adminPct *
            (currentContract.monthlyRent / property.firstRent),
          property.currency,
        ),
        occurredAt,
        dueDate: atDay(monthDate, 10, 23, 0),
        paidAt: null,
        forceStatus: 'PLANNED',
      },
      rng,
    ),
  );

  return rows;
}

let cached: FinancialTransactionPlan[] | null = null;

export function buildFinancialTransactions(): FinancialTransactionPlan[] {
  if (cached !== null) {
    return cached;
  }

  const portfolio = getPortfolio();
  const rows: FinancialTransactionPlan[] = [];

  for (const property of portfolio.properties) {
    const rng = rngFor(`finance:${property.index}`);
    const events = portfolio.maintenanceEvents.filter(
      (event) => event.propertyId === property.id,
    );

    for (
      let monthIndex = property.startOffset;
      monthIndex < HISTORY_MONTHS;
      monthIndex += 1
    ) {
      const monthDate = portfolio.monthDates[monthIndex] as Date;
      rows.push(...monthRows(property, monthIndex, monthDate, events, rng));
    }

    rows.push(
      ...plannedRows(
        property,
        portfolio.monthDates[HISTORY_MONTHS] as Date,
        rng,
      ),
    );
  }

  cached = rows.sort(
    (left, right) => left.occurredAt.getTime() - right.occurredAt.getTime(),
  );
  return cached;
}
