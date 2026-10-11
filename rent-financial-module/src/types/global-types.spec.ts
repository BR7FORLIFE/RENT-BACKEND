import {
  POLICIES_STATEMENTS,
  POLICIES_STATEMENTS_NAMES,
  TYPE_LANDORD_ACTOR_ROLES_UUIDS,
  TYPE_PROPERTY_ACTOR_ROLE_UUIDS,
  TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS,
  TYPE_PROPERTY_UUIDS,
  TYPE_TENANT_ACTOR_ROLES_UUIDS,
} from './global-types.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('catálogos globales (UUIDs sincronizados con el seed de BD)', () => {
  const catalogs = {
    TYPE_PROPERTY_UUIDS,
    TYPE_PROPERTY_OCCUPATION_TYPE_UUIDS,
    TYPE_PROPERTY_ACTOR_ROLE_UUIDS,
    TYPE_TENANT_ACTOR_ROLES_UUIDS,
    TYPE_LANDORD_ACTOR_ROLES_UUIDS,
    POLICIES_STATEMENTS,
  };

  it.each(Object.entries(catalogs))(
    '%s contiene solo UUIDs válidos',
    (_n, c) => {
      for (const value of Object.values(c)) {
        expect(value).toMatch(UUID);
      }
    },
  );

  it.each(Object.entries(catalogs))('%s no repite UUIDs', (_n, c) => {
    const values = Object.values(c);
    expect(new Set(values).size).toBe(values.length);
  });

  it('no hay UUIDs compartidos entre catálogos de roles (evita colisiones en PropertyActorRole)', () => {
    const roles = [
      ...Object.values(TYPE_PROPERTY_ACTOR_ROLE_UUIDS),
      ...Object.values(TYPE_TENANT_ACTOR_ROLES_UUIDS),
      ...Object.values(TYPE_LANDORD_ACTOR_ROLES_UUIDS),
    ];
    expect(new Set(roles).size).toBe(roles.length);
  });

  it('POLICIES_STATEMENTS_NAMES mapea cada llave a sí misma', () => {
    expect(Object.keys(POLICIES_STATEMENTS_NAMES)).toEqual(
      Object.keys(POLICIES_STATEMENTS),
    );
    for (const [k, v] of Object.entries(POLICIES_STATEMENTS_NAMES)) {
      expect(v).toBe(k);
    }
  });
});
