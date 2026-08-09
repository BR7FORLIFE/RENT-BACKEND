import z from 'zod';
import { TYPE_PROPERTY_ACTOR_ROLE_UUIDS } from '../../types/global-types.js';

export const TypeProperty = z.enum([
  'RESIDENCIAL',
  'COMERCIAL',
  'INDUSTRIAL',
  'TERRENO',
  'URBANO',
  'AGRARIO',
  'MIXTO',
]);

export type TypePropertyType = z.infer<typeof TypeProperty>;

export const PropertyOccupation = z.enum([
  'OCUPADO',
  'DESOCUPADO',
  'EN_PROCESO',
]);

export type PropertyOccupationType = z.infer<typeof PropertyOccupation>;

export const Street = z.enum(['CALLE', 'CARRERA', 'AVENIDA', 'DIAGONAL']);

export type TypeStreet = z.infer<typeof Street>;

export type PropertyActorRoleType = keyof typeof TYPE_PROPERTY_ACTOR_ROLE_UUIDS;

// IA Response Suggestion
export type PropertyField = 'PropertyName' | 'PropertyDescription';

export interface IASuggestionPropertyFields {
  name: keyof PropertyField;
  description: string;
}
