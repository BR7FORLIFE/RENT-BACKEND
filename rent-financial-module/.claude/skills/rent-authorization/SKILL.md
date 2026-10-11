---
name: rent-authorization
description: Proteger un endpoint o servicio de RENT con membresía de propiedad, políticas (PolicyStatement) y roles; añadir una política nueva. Úsala siempre que una operación acceda a datos de una propiedad, contrato o información financiera.
---

# Autorización en RENT

Authentication ≠ Authorization. El JWT solo da `userId`; el acceso a recursos se decide por **PropertyMember + roles + políticas** (ver `CLAUDE.md` §10 y §32.4).

## Patrón estándar en un service
```ts
const member = await this.systemRole.verifyPropertyMemberByUserIdInPropertyId(userId, propertyId); // exige ACTIVE
await this.systemRole.CheckPolicies(member.id, [POLICIES_STATEMENTS_NAMES.VER_CONTRATOS]);
// ...recién ahora consultar, SIEMPRE filtrando por propertyId
```
- Todo repositorio que reciba un id de recurso debe filtrar también por `propertyId` (evita IDOR: acceder al contrato de otra propiedad cambiando el id).
- `CheckPolicies(memberId, allowed, 'ALLOW'|'NOT_ALLOW')`: con varias políticas basta **una** (`some`). Si la acción exige varias, llama varias veces.
- Variante `verifyPropertyMemberByIdAndPropertyId` valida otros miembros (landlord/tenant) de la misma propiedad; `...WithoutStatus` no exige ACTIVE.
- Operaciones que solo puede hacer el dueño usan `propertyRepository.findPropertyById(userId, propertyId)` (filtra `Property.userId`). Prefiere políticas para lógica nueva; el "ser dueño" actual es deuda.
- Para transiciones con permisos distintos por destino (p. ej. SUSPENDER vs FINALIZAR) valida la política **de la transición concreta**.
- Nunca confíes en `userId`/`ownerId` que llegue en body o params.

## Añadir una política nueva (checklist)
1. `src/types/global-types.ts` → `POLICIES_STATEMENTS`: nueva llave con **UUID v4 nuevo** (`crypto.randomUUID()`), nombre en MAYÚSCULAS_ESPAÑOL (`VERBO_RECURSO`). `POLICIES_STATEMENTS_NAMES` se deriva solo.
2. Seed: insertar el `PolicyStatement` (`policyName` = la llave) y vincularlo con los roles correctos en `PropertyActorRolePolicyStatements` (ver skill `rent-prisma-change`). Sin seed la política **no existe en BD** y todo acceso se denegará.
3. Usarla con `POLICIES_STATEMENTS_NAMES.X` en el service.
4. Documentar en `documentation/policies.txt` y `documentation/rols-policies.txt` (marcar `[HECHO]`).
5. Test: caso permitido, caso denegado (`PoliciesAuthorizationNotAllowed`) y que **no** se toque el repositorio cuando se deniega (ver `contract.service.spec.ts`).

## Roles (catálogos en `global-types.ts`)
Propietario/arrendador: `TYPE_LANDORD_ACTOR_ROLES_UUIDS`; arrendatario: `TYPE_TENANT_ACTOR_ROLES_UUIDS` (`ARRENDADO_PRELIMINAR` → `ARRENDADO`); resto: `TYPE_PROPERTY_ACTOR_ROLE_UUIDS`.

## WebSockets
`WsJwtGuard` NO lanza si el token es inválido: el handler debe comprobar `client.data.user` y `disconnect()`.

## Ojo con
- `PoliciesAuthorizationNotAllowed` devuelve 401 (debería ser 403) — no lo cambies sin avisar (contrato de API).
- Un override `active=false` revoca una política heredada del rol.
