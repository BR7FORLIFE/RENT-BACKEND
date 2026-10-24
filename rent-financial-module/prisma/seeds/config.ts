export const SEED_KEY = 'rent-seed-v1';

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const CONTRACT_TERM_MONTHS = 12;
export const MAX_START_OFFSET = 3;

export const PROPERTY_COUNT = Math.max(1, readInt('SEED_PROPERTY_COUNT', 30));
export const LANDLORD_COUNT = Math.max(1, Math.ceil(PROPERTY_COUNT / 3));
export const TEST_USER_ID =
  process.env.SEED_TEST_USER_ID ?? 'c838dfe4-56d6-4ffa-b238-eba2fb90a8be';
export const TEST_USER_PROPERTY_COUNT = Math.max(
  0,
  readInt('SEED_TEST_USER_PROPERTY_COUNT', PROPERTY_COUNT),
);
export const PROVIDER_COUNT = 6;
export const HISTORY_MONTHS = Math.max(
  MAX_START_OFFSET + CONTRACT_TERM_MONTHS + 1,
  readInt('SEED_HISTORY_MONTHS', 24),
);

export const USD_EVERY = 10;
export const USD_OFFSET = 3;

export const MAINTENANCE_PROBABILITY = 0.24;
export const CANCELLED_MAINTENANCE_PROBABILITY = 0.05;

export const LATE_FEE_RATE = 0.04;
export const LATE_FEE_AFTER_DAYS = 5;
export const UNPAID_AFTER_DAYS = 22;

export const TENANT_RISK_LEVELS = [0.05, 0.1, 0.15, 0.3, 0.6, 0.9] as const;
export const TENANT_RISK_WEIGHTS = [30, 25, 20, 12, 8, 5] as const;

export const INSERT_BATCH_SIZE = 500;

const reference = process.env.SEED_REFERENCE_DATE
  ? new Date(process.env.SEED_REFERENCE_DATE)
  : new Date();

export const NOW: Date = new Date(
  Math.floor(reference.getTime() / 1000) * 1000,
);
