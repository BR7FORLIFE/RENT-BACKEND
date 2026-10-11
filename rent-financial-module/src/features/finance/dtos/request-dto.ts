import * as z from 'zod';
import { paginationSchema } from '../../../shared/pagination/pagination-schemas.js';

const typeEnum = z.enum(['INCOME', 'EXPENSE']);
const categoryEnum = z.enum([
  'RENT',
  'SERVICE',
  'UTILITY',
  'MAINTENANCE',
  'DEPOSIT',
  'OTHER',
]);
const statusEnum = z.enum([
  'PLANNED',
  'PENDING',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]);
const currencyEnum = z.enum(['COP', 'USD']);

const moneySchema = z
  .union([z.number(), z.string()])
  .transform((value) => String(value).trim())
  .pipe(
    z
      .string()
      .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Importe invalido (maximo 2 decimales)'),
  )
  .refine((value) => Number(value) > 0, 'El importe debe ser mayor a 0');

const dateSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha invalida')
  .transform((value) => new Date(value));

const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

export const propertyParamSchema = z.object({ propertyId: z.uuid() });

export const createFinancialTransactionDtoRequest = z
  .object({
    contractId: z.uuid().optional(),
    type: typeEnum,
    category: categoryEnum,
    status: z.enum(['PLANNED', 'PENDING', 'PAID']).default('PENDING'),
    description: z.string().trim().min(1).max(500),
    amount: moneySchema,
    currency: currencyEnum,
    dueDate: dateSchema.optional(),
    occurredAt: dateSchema.optional(),
    paidAt: dateSchema.optional(),
    isSimulated: z.boolean().default(true),
  })
  .strict()
  .refine((dto) => dto.status === 'PAID' || dto.paidAt === undefined, {
    message: 'paidAt solo aplica a movimientos pagados',
    path: ['paidAt'],
  });
export type CreateFinancialTransactionType = z.infer<
  typeof createFinancialTransactionDtoRequest
>;

export const updateFinancialTransactionDtoRequest = z
  .object({
    contractId: z.uuid().nullable().optional(),
    category: categoryEnum.optional(),
    description: z.string().trim().min(1).max(500).optional(),
    amount: moneySchema.optional(),
    currency: currencyEnum.optional(),
    dueDate: dateSchema.nullable().optional(),
    occurredAt: dateSchema.optional(),
  })
  .strict()
  .refine((dto) => Object.keys(dto).length > 0, {
    message: 'Debes enviar al menos un campo a actualizar',
  });
export type UpdateFinancialTransactionType = z.infer<
  typeof updateFinancialTransactionDtoRequest
>;

export const changeFinancialStatusDtoRequest = z
  .object({
    status: statusEnum,
    paidAt: dateSchema.optional(),
  })
  .strict()
  .refine((dto) => dto.status === 'PAID' || dto.paidAt === undefined, {
    message: 'paidAt solo aplica al estado PAID',
    path: ['paidAt'],
  });
export type ChangeFinancialStatusType = z.infer<
  typeof changeFinancialStatusDtoRequest
>;

export const markAsPaidDtoRequest = z
  .object({ paidAt: dateSchema.optional() })
  .strict();
export type MarkAsPaidType = z.infer<typeof markAsPaidDtoRequest>;

const dateRangeRefine = (dto: { from?: Date; to?: Date }) =>
  !dto.from || !dto.to || dto.from <= dto.to;

export const listFinancialTransactionsQuery = paginationSchema
  .extend({
    type: typeEnum.optional(),
    category: categoryEnum.optional(),
    status: statusEnum.optional(),
    currency: currencyEnum.optional(),
    contractId: z.uuid().optional(),
    isSimulated: booleanQuery.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .strict()
  .refine(dateRangeRefine, {
    message: 'from debe ser menor o igual a to',
    path: ['from'],
  });
export type ListFinancialTransactionsQueryType = z.infer<
  typeof listFinancialTransactionsQuery
>;

export const financialSummaryQuery = z
  .object({
    from: dateSchema,
    to: dateSchema,
  })
  .strict()
  .refine(dateRangeRefine, {
    message: 'from debe ser menor o igual a to',
    path: ['from'],
  });
export type FinancialSummaryQueryType = z.infer<typeof financialSummaryQuery>;
