import type { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    rols: string[];
  };
}

export const TYPE_PROPERTY_UUIDS = {
  RESIDENTIAL: '7dafb0f7-2a7e-458e-87b3-e7b20ae48865',
  COMMERCIAL: '6ab5e790-4a91-4858-b37d-2f568b61352f',
  INDUSTRIAL: '05734a3e-66f9-41b8-bc65-6b6dfe465362',
  LAND_OR_SOIL: 'ca8d728b-d100-4069-9395-c24062158752',
  URBAN: '8822645b-1782-4e32-aa33-97d7e6972e66',
  AGRARIAN: 'd30138b1-2c6e-4fb9-9ad5-a14937b3ae9a',
  MIXED: 'f836f3f1-f384-4c2c-b5a3-bcf3a184ed44',
} as const;

export const TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS = {
  OCCUPIED: '40542d8a-5ace-4545-9856-60a102ea4c99',
  VACANT: '62bcd0b4-af48-421b-b6e3-be1b6c2f7547',
  IN_PROCESS: '601183f2-95f4-443c-8175-d7fc3ce8e854',
} as const;

export const TYPE_PROPERTY_ACTOR_ROLE_UUIDS = {
  LANDLORD: '8d03ffcf-d98f-4307-a04f-7de9a7c78f0f',
  TENANT: '8ec6bd2c-924a-4870-8837-a4d8da5ed6d1',
  PROPERTY_ADMINISTRATOR: '67551911-6091-463f-8ebd-fc79558f9853',
  OPERATION_SUPPORT: '8574b63d-e51b-4299-b528-858c04e52729',
} as const;
