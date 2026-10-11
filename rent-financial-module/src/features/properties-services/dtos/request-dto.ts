import * as z from 'zod';
import { paginationSchema } from '../../../shared/pagination/pagination-schemas.js';

const currencyEnum = z.enum(['COP', 'USD']);
const priceTypeEnum = z.enum([
  'FIXED',
  'NEGOTIABLE',
  'CUSTOM_QUOTE',
  'PERCENTAGE',
]);
const scopeEnum = z.enum(['PROPERTY', 'PUBLIC']);
const offeringStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);
const requestStatusEnum = z.enum([
  'REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

// Dinero: positivo, hasta 10 enteros y 2 decimales (Decimal(12,2)). Se mantiene como string
// para no perder precision (nunca float).
const moneySchema = z
  .union([z.number(), z.string()])
  .transform((value) => String(value).trim())
  .pipe(
    z
      .string()
      .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Importe invalido (maximo 2 decimales)'),
  )
  .refine((value) => Number(value) > 0, 'El importe debe ser mayor a 0');

const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

// ---------- Catalogo ----------
export const listServicesQuery = paginationSchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  isActive: booleanQuery.optional(),
});
export type ListServicesQueryType = z.infer<typeof listServicesQuery>;

export const createServiceDtoRequest = z
  .object({
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().min(1).max(500),
  })
  .strict();
export type CreateServiceType = z.infer<typeof createServiceDtoRequest>;

export const updateServiceDtoRequest = z
  .object({
    name: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .refine(
    (v) => v.name !== undefined || v.description !== undefined,
    'Debes enviar al menos name o description',
  );
export type UpdateServiceType = z.infer<typeof updateServiceDtoRequest>;

export const changeServiceStatusDtoRequest = z
  .object({ isActive: z.boolean() })
  .strict();
export type ChangeServiceStatusType = z.infer<
  typeof changeServiceStatusDtoRequest
>;

// ---------- Ofertas ----------
export const createOfferingDtoRequest = z
  .object({
    serviceId: z.uuid(),
    scope: scopeEnum,
    // PROPERTY: membresia del proveedor en el inmueble al que queda atada la oferta.
    // PUBLIC: no se envia.
    propertyMemberId: z.uuid().optional(),
    priceTypeAgreement: priceTypeEnum,
    basePrice: moneySchema,
    currency: currencyEnum,
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
  })
  .strict()
  .refine(
    (v) => (v.scope === 'PROPERTY') === (v.propertyMemberId !== undefined),
    {
      message:
        'propertyMemberId es obligatorio con alcance PROPERTY y no se admite con PUBLIC',
      path: ['propertyMemberId'],
    },
  )
  .refine((v) => !v.validUntil || !v.validFrom || v.validUntil > v.validFrom, {
    message: 'validUntil debe ser posterior a validFrom',
    path: ['validUntil'],
  });
export type CreateOfferingType = z.infer<typeof createOfferingDtoRequest>;

export const updateOfferingDtoRequest = z
  .object({
    priceTypeAgreement: priceTypeEnum.optional(),
    basePrice: moneySchema.optional(),
    currency: currencyEnum.optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'No hay campos para actualizar');
export type UpdateOfferingType = z.infer<typeof updateOfferingDtoRequest>;

export const changeOfferingStatusDtoRequest = z
  .object({ status: offeringStatusEnum })
  .strict();
export type ChangeOfferingStatusType = z.infer<
  typeof changeOfferingStatusDtoRequest
>;

export const listOfferingsQuery = paginationSchema
  .extend({
    serviceId: z.uuid().optional(),
    providerUserId: z.uuid().optional(),
    scope: scopeEnum.optional(),
    status: offeringStatusEnum.optional(),
    currency: currencyEnum.optional(),
    minPrice: moneySchema.optional(),
    maxPrice: moneySchema.optional(),
    onlyValid: booleanQuery.optional(),
    // lista blanca de columnas ordenables
    sortBy: z
      .enum(['createdAt', 'basePrice', 'validUntil'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (v) =>
      !v.minPrice || !v.maxPrice || Number(v.minPrice) <= Number(v.maxPrice),
    {
      message: 'minPrice no puede ser mayor a maxPrice',
      path: ['minPrice'],
    },
  );
export type ListOfferingsQueryType = z.infer<typeof listOfferingsQuery>;

// ---------- Solicitudes ----------
export const createServiceRequestDtoRequest = z
  .object({
    serviceOfferingId: z.uuid(),
    propertyId: z.uuid(),
    notes: z.string().trim().min(1).max(1000).optional(),
    // solo para ofertas NEGOTIABLE / PERCENTAGE: propuesta inicial del solicitante
    proposedPrice: moneySchema.optional(),
  })
  .strict();
export type CreateServiceRequestType = z.infer<
  typeof createServiceRequestDtoRequest
>;

export const listServiceRequestsQuery = paginationSchema.extend({
  status: requestStatusEnum.optional(),
});
export type ListServiceRequestsQueryType = z.infer<
  typeof listServiceRequestsQuery
>;

export const serviceRequestActionDtoRequest = z
  .object({ reason: z.string().trim().min(1).max(500).optional() })
  .strict();
export type ServiceRequestActionType = z.infer<
  typeof serviceRequestActionDtoRequest
>;

export const proposePriceDtoRequest = z.object({ price: moneySchema }).strict();
export type ProposePriceType = z.infer<typeof proposePriceDtoRequest>;
