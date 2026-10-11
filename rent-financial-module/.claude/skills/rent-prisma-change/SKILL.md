---
name: rent-prisma-change
description: Modificar el modelo de datos de RENT (schema.prisma, migraciones, seed, catálogos de UUID) de forma segura. Úsala para añadir modelos/campos/enums o cambiar relaciones.
---

# Cambios en Prisma

Reglas (`CLAUDE.md` §8): la fuente es `prisma/schema.prisma`; **nunca** editar `generated/prisma`, `dist` ni `node_modules`. Prisma 7 con `prisma.config.ts` y adapter `pg`.

## Antes de tocar
1. Lee el modelo y todas sus relaciones (`Property`, `PropertyMember`, `Contract`, `ContractDraft` son sensibles; los cambios afectan lo financiero).
2. `grep` del campo/modelo en `src/` y `test/` para medir impacto.
3. Revisa `prisma/migrations/` (hay una migración inicial `20260917153639_init_database`). No hagas cambios destructivos (drop/rename) sin plan de migración de datos y **sin confirmación del usuario**.
4. No dupliques conceptos existentes (p. ej. `Currency`, `PaymentStatus`, `ResourceImages`).

## Convenciones del schema
- IDs `String @id @default(uuid())` (las tablas lookup usan UUID fijo definido en `global-types.ts`).
- Columnas en BD `snake_case` vía `@map`; campos TS en camelCase. Timestamps `createAt`/`updateAt` (`@default(now())`, `@updatedAt`) — mantener esa ortografía.
- Dinero: `Decimal`. Cascadas: hijas de `Property` con `onDelete: Cascade`.
- Comentarios `//` en español explicando decisiones de integridad.

## Flujo
```bash
# editar prisma/schema.prisma
pnpm prisma migrate dev --name <cambio_descriptivo>   # requiere BD (docker-compose: puerto 5431) y .env
pnpm prisma generate
npx tsc --noEmit && pnpm jest
```
- No ejecutes `migrate reset` ni `db push --force-reset` sin autorización.
- Si añades tablas lookup/roles/políticas: actualiza el **seed** (`prisma/seed.ts`, configurado en `prisma.config.ts`) y `src/types/global-types.ts` con el **mismo UUID**. Un UUID distinto entre seed y código produce FK errors en runtime.
- Si cambias un tipo usado en repositorios, actualiza `repository-types.ts` y los mappers (`property-mapper.service.ts`).
- El stub de tests `test/mocks/prisma-client.ts` solo expone `PrismaClient` y `Prisma.Decimal`; si un código nuevo usa más del namespace `Prisma` en runtime, amplíalo.

## Cierre
Informar: modelos tocados, migración generada, impacto en código, comandos ejecutados. No commitear sin pedirlo.
