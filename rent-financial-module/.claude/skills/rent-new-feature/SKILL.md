---
name: rent-new-feature
description: Crear una feature o módulo NestJS nuevo en RENT (controller, service, repository, DTOs Zod, excepciones, módulo) siguiendo las convenciones reales del proyecto. Úsala al añadir endpoints o dominios nuevos.
---

# Nueva feature en RENT

Antes de escribir: lee una feature existente equivalente (`src/features/contract` es la referencia más completa) y `CLAUDE.md` secciones 7, 28 y 32.

## Estructura
```text
src/features/<feature>/
├── <feature>.controller.ts
├── <feature>.module.ts
├── dtos/request-dto.ts        # schemas Zod de entrada + tipos z.infer
├── dtos/response-dto.ts       # interfaces de respuesta
├── schemas/<feature>.schema.ts# schemas del dominio/persistencia
├── services/<feature>.service.ts
├── repository/<feature>.repository.ts
├── repository/repository-types.ts
└── exceptions/exceptions.ts
```

## Reglas del proyecto
1. **ESM**: todo import relativo termina en `.js` (`import { X } from './x.js'`). Tipos con `import type`.
2. **Controller** con `@UseGuards(JwtAuthGuard)` a nivel de clase. El `userId` sale **siempre** de `req.user.userId` (`AuthRequest`), nunca del body/params.
3. **Validación**: `@Body(new ZodValidation(schema))` / `@Query(new ZodValidation(paginationSchema))`. **No uses `@UsePipes` a nivel de método** si el handler tiene `@Param` (se aplicaría también al param y devolvería 406; ver bug B5). Zod ⇒ 406.
4. **Service**: lógica de negocio + autorización (ver skill `rent-authorization`). Las escrituras multi-tabla van en `this.prismaClient.$transaction(async (tx) => ...)` pasando `tx` a cada repositorio.
5. **Repository**: único lugar con Prisma. Último parámetro `db: Prisma.TransactionClient = this.prisma`. Paginación: `skip=(page-1)*limit`, `take=limit`, metadata `{limit,page,total,totalPages,hasNextPage,hasPreviousPage}`; el `count` debe llevar **el mismo `where`** que el `findMany`.
6. **Excepciones**: clase que extiende `AppException(message, status, error)` de `core/global-exception.ts`. Mensajes en español. 404 para no encontrado, 406 para regla de negocio (convención actual), 403 para autorización nueva.
7. **Módulo**: importa `PrismaModule` y `SytemPropertyRoleModule` (para políticas); regístralo en `AppModule`. Exporta solo lo que otros módulos consuman.
8. Dinero: usa `Prisma.Decimal`/strings en la capa de persistencia; evita `number` para montos nuevos.
9. Notificaciones: `NotificationService.sendNotification(...)` (persiste) + `NotificationGateway.sendNotification(userId, n)` (tiempo real). Importa `NotificationModule`.
10. Comentarios breves en español, estilo del código vecino. Sin librerías nuevas.

## Cierre
- Escribe tests con la skill `rent-write-tests` (service, repository, controller).
- Ejecuta `npx tsc --noEmit && pnpm jest && pnpm build` y revisa `git status`.
