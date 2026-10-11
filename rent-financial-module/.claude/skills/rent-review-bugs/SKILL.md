---
name: rent-review-bugs
description: Revisar y corregir los hallazgos conocidos (B1–B20) del análisis de RENT, convirtiendo cada test it.failing en una regresión. Úsala cuando el usuario pida arreglar bugs o auditar seguridad/flujo de contratos.
---

# Corregir hallazgos conocidos

La lista priorizada está en `CLAUDE.md` §32.6. Cada hallazgo tiene un test `it.failing` (búscalo con `grep -rn "BUG conocido\|VULNERABILIDAD conocida" src test`).

## Flujo por hallazgo
1. Lee el código y el test `it.failing` correspondiente; confirma que el bug sigue vigente (`pnpm jest <archivo>`).
2. Si el arreglo cambia un **contrato de API** (códigos HTTP, forma de respuesta) o requiere migración, **avisa y pide confirmación** antes (CLAUDE.md §6, §29). Ejemplos que lo requieren: B4 (401 en vez de 500), 401→403 de políticas, B3 (quitar `userId` del body de invitación).
3. Aplica el cambio mínimo.
4. Cambia `it.failing(` → `it(` en ese test (si el arreglo es correcto ahora debe pasar; con `it.failing` fallaría, es la señal).
5. Añade casos de regresión faltantes.
6. `npx tsc --noEmit && pnpm jest && pnpm test:e2e && pnpm build`.
7. Resume: archivos, cambio, tests, pendientes. No hacer commit salvo que se pida.

## Orden recomendado
B3 (suplantación) → B1/B2 (flujo de contrato bloqueado) → B4 (filtro) → B5 (PATCH property) → B6/B7/B8/B9 (datos incorrectos) → B12 (invitación reutilizable) → B10/B11/B13/B14/B15 → resto.

## Pistas de arreglo
- B1: comparar con `'PENDIENTE_ACEPTACION'` (o usar `StatusContractEnum`).
- B2: pasar `tenantPropertyMember.id`.
- B3: tomar `req.user.userId` en el controller, pasarlo al service y exigir política `ENVIAR_INVITACION_MIEMBRO`.
- B4: en `GlobalExceptionFilter` añadir rama `exception instanceof HttpException` → `exception.getStatus()`.
- B5: mover `ZodValidation` a `@Body(new ZodValidation(...))`.
- B7: `(page - 1) * limit`. B8: `bedrooms: structurePropertyInfo.bedrooms`. B9: `lotArea.toNumber()`.
- B11: igualar el `where` del `count` al del `findMany`.
- B12: marcar `CONSUMED` dentro de la misma transacción que crea el miembro (y validar que el token corresponda al usuario/propiedad).
