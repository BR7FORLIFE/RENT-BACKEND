---
name: rent-write-tests
description: Escribir o ampliar tests de RENT (unit de services/repositories, tests HTTP de controllers con supertest, e2e sin BD) con la infraestructura Jest/ESM del proyecto. Úsala al añadir o cambiar cualquier lógica.
---

# Tests en RENT

## Comandos
```bash
pnpm jest                     # unit + controllers (src/**/*.spec.ts)
pnpm jest path/al/archivo     # uno solo
pnpm jest --coverage
pnpm test:e2e                 # test/app.e2e-spec.ts (AppModule real, Prisma mockeado)
npx tsc --noEmit && npx eslint "src/**/*.spec.ts" "test/**/*.ts"
```

## Cómo está montado (importante)
- Proyecto ESM + Prisma generado con `import.meta` ⇒ Jest compila a **CJS** (`test/tsconfig.spec.json`) y `test/jest.shared.cjs` mapea: `generated/prisma/client`, `config/env`, `config/config`, `ollama` → stubs en `test/mocks/`; imports `.js` → `.ts`.
- `config/env` stub: constantes de prueba (`RENT_AUTH_HOST='http://auth.test'`, `ISSUER_EMAIL`…) y llave RSA efímera (`TEST_PRIVATE_KEY`).
- `config/config` stub: `resendClient.emails.send`, `axiosMicroserviceClient.get/post`, `axiosRentAuth.post` son `jest.fn()` (castea: `x as unknown as jest.Mock`).

## Patrones
**Service**: instanciar con `new Service(mock1 as never, ...)`, `jest.resetAllMocks()` en `beforeEach` y **volver a configurar** `prisma.$transaction.mockImplementation((cb) => cb(tx))` y cualquier `jest.fn(impl)` (el reset borra implementaciones). Verifica: (a) política requerida (`CheckPolicies` con el nombre exacto), (b) camino denegado ⇒ el repositorio NO se invoca, (c) argumentos de escritura incluyendo `tx`, (d) notificaciones.
Plantilla: `src/features/contract/services/contract.service.spec.ts`.

**Repository**: mock de `prisma` por modelo; si usa `db.$transaction([...])` mockéalo con `Promise.all`. Asserta `where/skip/take/orderBy` y la metadata de paginación. Plantilla: `contract.repository.spec.ts`.

**Controller (HTTP)**: `createControllerApp(Controller, [{ provide: Service, useValue: mock }])` de `test/helpers.ts` (guard falso ⇒ `TEST_USER`; filtro global real). Verifica código de estado, que el `userId` venga del JWT, validación Zod (406) y traducción de `AppException`. Silenciar `console.log` del filtro con `jest.spyOn(console,'log')`. Plantilla: `contract.controller.spec.ts`.

**E2E**: `test/app.e2e-spec.ts`; firma JWT con `signTestJwt(TEST_PRIVATE_KEY)`.

**Módulos que importan `../api.js` o IA**: `jest.mock('ruta/api.js', () => ({ getUserData: jest.fn() }))`.

## Bugs conocidos
Si encuentras un comportamiento incorrecto, **no lo "arregles" en el test**: escribe `it.failing('comportamiento correcto esperado', ...)` con un comentario `// BUG conocido: ...` y repórtalo. Al corregir el código, cambia `it.failing` → `it`. Lista en `CLAUDE.md` §32.6.

## Reglas
- Cada test, un comportamiento; nombres en español describiendo la regla de negocio.
- Casos obligatorios en lógica protegida: éxito, no-miembro, sin política, recurso inexistente, estado inválido.
- Nunca tests contra la BD real ni llamadas HTTP/IA/correo reales.
- Código de test con el estilo de Prettier del repo (`npx prettier --write`).
