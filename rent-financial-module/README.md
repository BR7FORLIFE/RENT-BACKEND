# RENT — rent-financial-module

Microservicio NestJS de RENT para **propiedades, miembros, roles/políticas y contratos** de arrendamiento. El módulo financiero (obligaciones, pagos, mora, estados de cuenta) **aún no está implementado**.

Contexto técnico completo del proyecto: [`CLAUDE.md`](./CLAUDE.md) (sección 32).

## Stack

Node 22 · TypeScript · NestJS 11 · Prisma 7 (PostgreSQL) · Zod · JWT RS256 (Passport) · Socket.IO · Resend · Ollama · Jest · pnpm

## Puesta en marcha

```bash
pnpm install
cp .env.example .env          # completar con valores reales (nunca commitear secretos)
pnpm prisma generate
pnpm prisma migrate deploy && pnpm prisma db seed
pnpm start:dev                # http://localhost:3002/rent-financial · Swagger en /api
```

Requiere `public.pem` (llave pública de `rent-auth`) en la raíz y una PostgreSQL (`docker-compose.yml` levanta una en el puerto 5431).

## Tests

```bash
pnpm jest            # unit + controllers (324 tests, ~91 % cobertura)
pnpm test:e2e        # app real con Prisma mockeado
pnpm jest --coverage
```

Los bugs conocidos están cubiertos por tests `it.failing`: pasan mientras el bug exista y fallan al corregirlo. Al arreglar uno, cambiar `it.failing` por `it`. Detalles en `CLAUDE.md` §7 y §32.7.

---

# Bugs corregidos, por orden de prioridad

**Estado: B1–B20 corregidos** (excepto lo indicado como pendiente al final). Cada uno tiene ahora un test de regresión normal (antes `it.failing`). Lo marcado con ⚠️ cambió el contrato de la API:

- ⚠️ `POST /property-member/invite-property-member`: el body ya **no acepta `userId`**; el propietario sale del JWT.
- ⚠️ Los 401/403/404 de Nest ya conservan su status (antes 500).
- ⚠️ Falta de política ⇒ **403 FORBIDDEN** (antes 401).
- ⚠️ Borradores: se rechaza `endDate <= startDate` (406).
- ⚠️ El propietario no puede cambiar su propio estado de miembro (406).
- Nueva variable de entorno `PUBLIC_BASE_URL` (enlaces de correos; ver `.env.example`).

El detalle original de cada bug se conserva abajo como referencia.

## 🔴 P0 — Seguridad

### 1. B3 · Suplantación del propietario al invitar miembros
- **Dónde:** `property-member.controller.ts:43-47`
- **Problema:** `POST /property-member/invite-property-member` toma el `userId` del **body**, no del JWT, y no valida ninguna política. Cualquier usuario autenticado puede invitar miembros a una propiedad ajena enviando el `userId` del dueño.
- **Arreglo:** usar `req.user.userId`, quitar `userId` del DTO ⚠️ y exigir `ENVIAR_INVITACION_MIEMBRO`.
- **Test:** `property-member.controller.spec.ts` ("usa el userId del JWT…").

## 🔴 P1 — Flujo de contratos bloqueado

### 2. B1 · Ningún contrato puede aceptarse o rechazarse
- **Dónde:** `contract.service.ts:515`
- **Problema:** compara con `'PENDING_ACCEPTANCE'`; el enum real es `PENDIENTE_ACEPTACION`. Siempre lanza `deniedTransitionedStatusContract`, por lo que ningún contrato llega a `PENDIENTE_DOCUMENTACION` ni a `ACTIVO`.
- **Arreglo:** comparar con `'PENDIENTE_ACEPTACION'` (o usar `StatusContractEnum`).

### 3. B2 · Contrato buscado con el `userId` en vez del id de miembro
- **Dónde:** `contract.service.ts:503`
- **Problema:** `findContractByIdAndTenantMemberId` recibe el `userId` del JWT; la columna es `tenantMemberId` (id de `PropertyMember`).
- **Arreglo:** pasar `tenantPropertyMember.id`.

## 🟠 P2 — Errores HTTP y endpoints rotos

### 4. B4 · Los 401/403/404 de Nest se convierten en 500
- **Dónde:** `core/filters/exception.filter.ts`
- **Problema:** el filtro solo distingue `AppException` y `ZodError`. Un token inválido o ausente responde 500.
- **Arreglo:** añadir una rama `HttpException` que conserve `getStatus()` ⚠️.

### 5. B5 · `PATCH /property/:propertyId` siempre responde 406
- **Dónde:** `property-registration.controller.ts:87`
- **Problema:** `@UsePipes(ZodValidation(EditingPropertyDtoRequest))` a nivel de método también valida `@Param('propertyId')`.
- **Arreglo:** mover el pipe a `@Body(new ZodValidation(...))`.

## 🟠 P3 — Datos incorrectos o corruptos

| # | Dónde | Problema | Arreglo |
|---|---|---|---|
| 6 · B8 | `property.repository.ts:436` | `bedrooms` se guarda con el valor de `bathrooms` | `bedrooms: structurePropertyInfo.bedrooms` |
| 7 · B7 | `property.repository.ts:349` | `skip = page - 1 * limit` (precedencia): skip negativo en página 1 con `limit` 100 | `(page - 1) * limit` |
| 8 · B9 | `property-mapper.service.ts:39` | `lotArea` se mapea con `area` | `lotArea.toNumber()` |
| 9 · B6 | `property.service.ts` (`editingProperty`) | `direction` se pasa cruda a Prisma; `toInsert` incluye `propertyId` inexistente en `ResourceImages`; el borrado por `assetId` es global y puede afectar otras propiedades | operación anidada `update`, quitar `propertyId`, acotar el borrado a la propiedad |

## 🟡 P4 — Integridad del dominio

### 10. B12 · Invitaciones reutilizables
- **Dónde:** `property-member.service.ts` (`acceptPropertyMemberInvitation`)
- **Problema:** la invitación nunca pasa a `CONSUMED`; un segundo uso produce un 500 por la unique `userId+propertyId`. El token no está atado al usuario que lo consume.
- **Arreglo:** marcar `CONSUMED` en la misma transacción y validar el token contra el usuario/propiedad.

### 11. B13 · Transiciones de estado sin validar
- **Dónde:** `contract.service.ts` (`handleContractStatus`)
- **Problema:** se puede finalizar o suspender un contrato `RECHAZADO` o `FINALIZADO`.
- **Arreglo:** validar el estado de origen (idealmente una máquina de estados).

### 12. B10 · `createContract` ignora datos del request
- **Problema:** descarta `landlordMemberId` (usa al creador) y no comprueba que el borrador aceptado pertenezca al `tenantMemberId` pedido.

### 13. B15 · Operaciones fuera de transacción
- **Problema:** en `AcceptedOrRejectedContractByTenant`, `updatePropertyActorRole` corre fuera de la transacción y la rama `RECHAZADO` no es transaccional.

### 14. B11 · Paginación con totales erróneos
- **Dónde:** `contract.repository.ts:100`; `findAllPartialPropertyInfoByPropertyMemberId`
- **Problema:** el `count` no usa el mismo `where` que el `findMany` (ignora la aceptación / el `status`).

### 15. B14 · Detección de propiedad duplicada incompleta
- **Dónde:** `property.repository.ts:125`
- **Problema:** con `fmi` presente nunca valida el número predial; la unicidad es por `userId`, no global.

## 🟢 P5 — Menores

| # | Problema |
|---|---|
| B16 | La versión del borrador se calcula fuera de la transacción: carrera contra `@@unique([propertyId, version])` (500). |
| B17 | URL de aceptación **hardcodeada** a un dominio ngrok en `invitation-generation.service.ts:44`; `propertyName` se inyecta sin escapar en el HTML del correo. |
| B18 | `db.$transaction([...])` sobre un `TransactionClient` fallaría si se invoca dentro de otra transacción. |
| B19 | El dueño puede desactivarse a sí mismo (`changeStatusPropertyMember`). |
| B20 | Falta validar `endDate > startDate` en borradores; `console.log(exception)` del filtro puede registrar datos sensibles; `GlobalController` y `DELETE /property` son stubs. |

## Pendiente / decisiones abiertas

- B14: la unicidad de fmi/predial sigue siendo **por usuario** (ahora se validan ambos campos); volverla global es una decisión de negocio.
- B16: la versión del borrador se calcula dentro de la transacción, pero sin bloqueo la carrera concurrente sigue posible (la constraint única la detiene con error).
- B18: los repositorios usan `Promise.all` en vez de `$transaction([...])`, por lo que funcionan dentro de transacciones.
- B20: `GlobalController` y `DELETE /property` siguen siendo stubs.

## Deuda de diseño (no son bugs)

- `PoliciesAuthorizationNotAllowed` responde 401; semánticamente debería ser 403 ⚠️.
- Varias lecturas (`GET /property/:id`) exigen membresía pero no política; la administración de miembros depende de "ser dueño" en lugar de políticas.
- Los montos pasan por `Number` en `createContract`; el módulo financiero debe usar `Prisma.Decimal` de extremo a extremo.
- Las notificaciones por WebSocket se emiten dentro de la transacción, antes del commit.

---

# Estructura

```text
src/
├── core/        auth (JWT/WS), database (Prisma), filtros, pipes, IA
├── config/      env y clientes externos (Resend, axios)
├── features/    property-registration · contract · system-property-role ·
│                notifications · global · microservice-auth
├── shared/      paginación
└── types/       catálogos de UUID (roles, políticas, tipos)
prisma/          schema, migraciones y seed
test/            e2e, helpers y mocks de Jest
documentation/   dominio, políticas y roles
```
