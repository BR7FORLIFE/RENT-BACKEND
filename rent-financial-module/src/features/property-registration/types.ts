import z from 'zod';

export const TypeProperty = z.enum([
  'RESIDENTIAL',
  'COMMERCIAL',
  'INDUSTRIAL',
  'LAND_OR_SOIL',
  'URBAN',
  'AGRARIAN',
  'MIXED',
]);

export type TypePropertyType = z.infer<typeof TypeProperty>;

export const PropertyOccupation = z.enum(['OCCUPIED', 'VACANT', 'IN_PROCESS']);

export type PropertyOccupationType = z.infer<typeof PropertyOccupation>;

export const Street = z.enum([
  'STREET',
  'CAREER',
  'AVENUE',
  'DIAGONAL',
  'CROSS',
]);

export type TypeStreet = z.infer<typeof Street>;

export type PropertyActorRoleType =
  | 'LANDLORD'
  | 'TENANT'
  | 'PROPERTY_ADMINISTRATOR'
  | 'OPERATION_SUPPORT';

// IA Response Suggestion
export type PropertyField = 'PropertyName' | 'PropertyDescription';

export interface IASuggestionPropertyFields {
  name: keyof PropertyField;
  description: string;
}
