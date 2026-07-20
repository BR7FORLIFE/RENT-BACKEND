import { Injectable } from '@nestjs/common';
import type {
  IASuggestionPropertyFields,
  PropertyActorRoleType,
  PropertyField,
} from '../types.js';
import { ActorRoleException } from '../exceptions/domain-exceptions.js';
import { CallModelStream } from '../../../core/IA/IA-cclient.js';

@Injectable()
export class PropertyHelper {
  cleanUndefined<T extends object>(obj: T): Partial<T> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        acc[key as keyof T] = value;
      }

      return acc;
    }, {} as Partial<T>);
  }

  IsActorRole(
    expected: PropertyActorRoleType,
    current: PropertyActorRoleType[],
    compare: boolean = true,
  ) {
    if (compare) {
      if (!current.includes(expected)) {
        throw new ActorRoleException(
          `Se esperaba un actor role ${expected} pero a cambio se recibio otro rol`,
        );
      }
    } else {
      if (current.includes(expected)) {
        throw new ActorRoleException(
          `Verifica el rol ${expected} antes de realizar la acción`,
        );
      }
    }
  }
}

export async function CreateSuggestionByPropertyField(field: PropertyField) {
  const STRUCTURE_PROMPT = `
    You are assisting a user in creating a new real estate property listing.

    Generate a generic suggestion for the following property field: "${field}".
The suggestion should serve as a template that the user can later personalize.

    Requirements:
    - The response MUST be entirely in Spanish.
    - The property name must be short, attractive, professional, and generic.
    - Do not mention any specific city, country, address, neighborhood, or real location.
    - Do not invent specific details such as bedrooms, bathrooms, area, amenities, or price.
    - The description must be generic, professional, and suitable for almost any residential property.
    - The description should encourage the user to personalize it later.
    - The description must be between 60 and 100 words.
    - Return ONLY a valid JSON object.
    - Do not include markdown, code fences, explanations, or any extra text.

    Response format:

    {
      "name": "Property name",
      "description": "Property description"
    }
  `;

  const IAresponse = await CallModelStream(STRUCTURE_PROMPT);
  return JSON.parse(IAresponse.message.content) as IASuggestionPropertyFields;
}
