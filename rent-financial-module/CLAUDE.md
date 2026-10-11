# RENT — Sistema de Gestión de Arrendamientos

## 1. Propósito del proyecto

RENT es una plataforma para la gestión integral de inmuebles arrendados.

El objetivo principal es digitalizar y centralizar los procesos administrativos, financieros y de comunicación relacionados con los arrendamientos, reduciendo la dependencia de procesos manuales, intermediarios y tiempos de respuesta prolongados.

La plataforma centraliza:

* Propiedades e inmuebles.
* Propietarios / arrendadores.
* Arrendatarios.
* Miembros asociados a propiedades.
* Contratos y contratos preliminares.
* Documentación.
* Obligaciones económicas.
* Pagos.
* Estados de cuenta.
* Deudas y morosidad.
* Servicios públicos.
* Notificaciones.
* Reportes financieros.
* PQRS y solicitudes mediante tickets.
* Información necesaria para la toma de decisiones administrativas.

Desde la perspectiva del arrendatario, RENT debe proporcionar una experiencia transparente para consultar contratos, obligaciones, pagos, estados de cuenta, servicios asociados y solicitudes.

Desde la perspectiva administrativa, debe permitir controlar propiedades, contratos, obligaciones, cartera, pagos, documentación y demás operaciones asociadas al negocio.

---

# 2. Objetivos funcionales principales

El sistema busca:

1. Centralizar la información de propiedades, arrendatarios, contratos y obligaciones.
2. Gestionar documentación relacionada con los arrendamientos.
3. Gestionar estados de cuenta, pagos y obligaciones económicas.
4. Gestionar servicios públicos y otros servicios asociados a inmuebles.
5. Mejorar la comunicación mediante notificaciones, anuncios y mensajes.
6. Gestionar PQRS mediante tickets con trazabilidad.
7. Reducir procesos manuales.
8. Proporcionar a los usuarios acceso oportuno a su información.
9. Generar información organizada para apoyar decisiones administrativas.
10. Mantener trazabilidad sobre operaciones importantes.

---

# 3. Stack tecnológico

El backend actual utiliza principalmente:

* Node.js
* TypeScript
* NestJS 11
* Prisma 7
* PostgreSQL
* Zod
* JWT
* Passport JWT
* Socket.IO / WebSockets
* Axios
* Resend
* Jest
* Supertest
* pnpm

El proyecto utiliza una arquitectura orientada a módulos/features dentro de NestJS.

El cliente Prisma se genera en:

```text
generated/prisma
```

No debe modificarse manualmente el código generado por Prisma.

---

# 4. Arquitectura general

La aplicación sigue una separación aproximada entre:

```text
src/
├── core/
├── features/
├── shared/
├── config/
└── types/
```

## `src/core`

Contiene infraestructura y componentes transversales de la aplicación.

Actualmente incluye, entre otros:

* autenticación
* autorización
* acceso a base de datos
* Prisma
* filtros de excepciones
* pipes
* integración de IA
* tipos compartidos

## `src/features`

Contiene las funcionalidades principales del dominio.

Actualmente existen o están en desarrollo funcionalidades relacionadas con:

* contratos
* registro y administración de propiedades
* miembros de propiedades
* roles de propiedades
* servicios
* servicios públicos
* notificaciones
* reportes financieros
* integración con el microservicio de autenticación
* funcionalidades globales

## `src/shared`

Contiene componentes reutilizables que no pertenecen exclusivamente a una funcionalidad.

Ejemplo actual:

```text
src/shared/pagination
```

---

# 5. Regla fundamental: entender antes de modificar

Antes de modificar código:

1. Identificar el módulo afectado.
2. Leer las implementaciones existentes relacionadas.
3. Revisar DTOs, schemas, servicios, repositorios y tipos involucrados.
4. Revisar las relaciones Prisma relevantes.
5. Revisar cómo otros módulos implementan patrones similares.
6. Determinar las dependencias e impactos del cambio.
7. Solo después implementar.

No asumir que una funcionalidad debe implementarse desde cero si ya existe una abstracción reutilizable.

Preferir reutilizar patrones existentes antes que introducir una arquitectura paralela.

---

# 6. Regla de cambios mínimos

Cuando se solicite una modificación:

* Modificar únicamente los archivos necesarios.
* No refactorizar código no relacionado con la tarea.
* No cambiar nombres públicos sin necesidad.
* No alterar contratos de API existentes sin indicarlo explícitamente.
* No reemplazar patrones existentes simplemente por preferencia personal.
* No introducir dependencias nuevas si las existentes pueden resolver el problema.
* No eliminar funcionalidades existentes sin autorización explícita.

Si un cambio requiere modificar varias capas, explicar brevemente el impacto antes de realizar cambios importantes.

---

# 7. Arquitectura de una feature

Cuando corresponda, las features pueden seguir una estructura similar a:

```text
feature/
├── controller
├── module
├── dtos/
├── schemas/
├── services/
├── repository/
├── exceptions/
└── types/
```

Mantener la separación de responsabilidades.

### Controller

Responsabilidades:

* recibir requests
* validar/coordinar entrada
* delegar lógica
* devolver respuestas

Evitar colocar lógica de negocio compleja directamente en controllers.

### Service

Responsabilidades:

* lógica de negocio
* validaciones de dominio
* coordinación de operaciones
* aplicación de reglas funcionales

### Repository

Responsabilidades:

* acceso a persistencia
* consultas Prisma
* operaciones relacionadas directamente con la base de datos

Evitar acoplar controllers directamente a Prisma.

### Schema / DTO

Utilizar las estructuras de validación existentes y respetar el patrón actual del proyecto.

---

# 8. Base de datos y Prisma

La fuente principal del modelo de datos es:

```text
prisma/schema.prisma
```

Las migraciones se encuentran en:

```text
prisma/migrations/
```

El cliente generado se encuentra en:

```text
generated/prisma/
```

## Reglas

* No modificar manualmente `generated/prisma`.
* No modificar archivos dentro de `dist`.
* No modificar `node_modules`.
* Los cambios estructurales de base de datos deben partir de `prisma/schema.prisma`.
* Antes de modificar modelos existentes, analizar sus relaciones e impacto.
* Tener especial cuidado con cambios que afecten contratos, propiedades, miembros o información financiera.
* No eliminar campos o relaciones existentes sin evaluar migraciones e impacto sobre código existente.
* No crear modelos duplicados para representar conceptos que ya existen.
* Revisar las migraciones existentes antes de proponer cambios destructivos.

---

# 9. Seguridad y autenticación

La autenticación y autorización son componentes críticos del sistema.

RENT debe garantizar que un usuario:

* esté autenticado antes de acceder a recursos protegidos;
* solamente acceda a recursos para los que tenga autorización;
* solamente visualice información correspondiente a sus propiedades, contratos y relaciones;
* no pueda obtener información financiera de otros usuarios mediante manipulación de IDs;
* no pueda ejecutar operaciones que su rol o política no permita.

El sistema utiliza JWT para autenticación.

Existe integración con un microservicio de autenticación.

No asumir que estar autenticado implica estar autorizado.

Siempre diferenciar:

```text
Authentication = ¿Quién eres?
Authorization  = ¿Qué puedes hacer?
```

---

# 10. Modelo de autorización de RENT

RENT utiliza un sistema de miembros, roles y políticas asociado a propiedades.

Los conceptos principales incluyen:

* Property
* PropertyMember
* PropertyMemberRole
* PropertyActorRole
* PolicyStatement
* PropertyActorRolePolicyStatements
* PropertyMemberPoliciesOverride

La autorización puede depender tanto del rol como de las políticas asignadas al miembro.

No implementar autorización únicamente comprobando el rol si existe una política más específica aplicable.

Antes de modificar una operación protegida, revisar cómo funciona actualmente el sistema de policies.

La seguridad debe verificarse a nivel de backend, no solamente en frontend.

---

# 11. Contratos

Los contratos son una parte central del dominio.

El proyecto contiene funcionalidades relacionadas con:

* contratos
* contratos preliminares / ContractDraft
* recursos/documentos asociados
* participantes del contrato
* información económica
* fechas contractuales

Los cambios relacionados con contratos pueden tener impacto financiero.

Antes de modificar la lógica contractual revisar:

```text
Contract
ContractDraft
Property
PropertyMember
```

y sus relaciones en Prisma.

No modificar la lógica contractual de forma aislada cuando el cambio pueda afectar obligaciones financieras.

---

# 12. Módulo financiero

El módulo financiero busca gestionar las obligaciones económicas relacionadas con los arrendamientos.

Conceptos funcionales principales:

* Canon de arrendamiento.
* Administración.
* Parqueadero.
* Servicios públicos.
* Cuotas extraordinarias.
* Otros conceptos configurables.
* Fechas de vencimiento.
* Pagos.
* Pagos parciales.
* Estados de pago.
* Cuentas por cobrar.
* Cuentas por pagar.
* Saldos a favor.
* Mora.
* Deudas.
* Recibos.
* Facturas.
* Comprobantes.
* Estados de cuenta.
* Reportes financieros.
* Trazabilidad financiera.

Estados financieros contemplados:

```text
PENDIENTE
PAGADO
PARCIALMENTE_PAGADO
VENCIDO
EN_MORA
ANULADO
```

Los nombres reales de enums/modelos deben verificarse en `prisma/schema.prisma` antes de utilizarlos.

---

# 13. Reglas financieras importantes

Las operaciones financieras deben diseñarse pensando en:

* precisión monetaria;
* trazabilidad;
* consistencia;
* historial;
* idempotencia cuando corresponda;
* estados claramente definidos;
* relaciones con contratos y propiedades;
* autorización;
* auditoría.

No utilizar `float` para representar dinero si el modelo existente permite una representación decimal adecuada.

Antes de cambiar una obligación financiera, determinar:

1. quién la creó;
2. a qué propiedad pertenece;
3. a qué contrato está asociada;
4. quién es responsable de pagarla;
5. quién es el beneficiario;
6. qué pagos existen;
7. cuál es el saldo pendiente;
8. si existen intereses/mora;
9. qué historial debe conservarse.

Las operaciones financieras importantes deben preservar trazabilidad.

---

# 14. Mora

La mora debe considerar:

* fecha de vencimiento;
* fecha efectiva de pago;
* días de mora;
* reglas configuradas;
* valor pendiente;
* intereses o recargos aplicables.

No implementar cálculos de mora arbitrariamente.

Antes de modificar esta lógica, identificar las reglas actualmente definidas por el proyecto y verificar si la mora depende del contrato, obligación o configuración administrativa.

---

# 15. Estados de cuenta y deuda

El estado de cuenta debe permitir representar de manera consistente:

```text
Obligación
    ↓
Pagos
    ↓
Saldo pendiente
    ↓
Vencimiento
    ↓
Mora
    ↓
Total adeudado
```

Evitar calcular valores financieros de forma diferente en distintos servicios.

Si existe una regla financiera centralizada, reutilizarla.

---

# 16. Servicios públicos

Los servicios públicos están asociados a propiedades y pueden representar obligaciones económicas.

Ejemplos:

* energía
* agua
* gas
* internet
* otros servicios

El sistema contempla entidades relacionadas con:

```text
PublicService
PublicServiceType
PropertyServiceAssignment
Service
```

Antes de crear nuevas entidades relacionadas con servicios públicos, revisar las existentes.

---

# 17. Notificaciones

El sistema utiliza WebSockets / Socket.IO para funcionalidades de notificación.

Existe un módulo:

```text
src/features/notifications
```

con gateway, repository y service.

Existe autenticación específica para WebSockets.

Los cambios relacionados con WebSockets deben considerar:

* autenticación del socket;
* autorización;
* namespace;
* eventos existentes;
* estructura de `client.data`;
* compatibilidad con el cliente frontend.

No modificar el protocolo de eventos sin revisar primero el frontend.

---

# 18. Comunicación con microservicios

Existe integración con un microservicio de autenticación mediante:

```text
src/features/microservice-auth
```

No duplicar en este servicio lógica que pertenece al servicio de autenticación.

Antes de modificar una funcionalidad relacionada con usuarios:

1. determinar qué servicio es responsable de la información;
2. determinar qué información debe obtenerse mediante el microservicio;
3. evitar duplicar fuentes de verdad;
4. respetar los contratos de comunicación existentes.

---

# 19. IA

Existe integración relacionada con IA en:

```text
src/core/IA
```

Antes de añadir una nueva integración de IA, revisar la implementación existente.

No introducir proveedores adicionales sin una necesidad clara.

No colocar API keys, secretos o credenciales directamente en el código.

---

# 20. Variables de entorno y secretos

Nunca escribir secretos directamente en:

* código fuente;
* `CLAUDE.md`;
* README;
* commits;
* ejemplos de código;
* archivos públicos.

No revelar:

* JWT private keys;
* API keys;
* database URLs;
* tokens;
* credenciales;
* secretos de servicios externos.

Usar variables de entorno.

Los archivos `.env` deben considerarse información sensible.

---

# 21. Archivos generados y dependencias

No analizar ni modificar innecesariamente:

```text
node_modules/
dist/
generated/prisma/
```

Estos directorios contienen dependencias o artefactos generados.

Para comprender la implementación real, priorizar:

```text
src/
prisma/
test/
documentation/
README.md
package.json
```

Si `dist` y `src` parecen diferir, considerar `src` como fuente principal del código TypeScript, salvo que exista una razón explícita para investigar el artefacto compilado.

---

# 22. Documentación existente

El proyecto contiene documentación útil en:

```text
documentation/
```

incluyendo información relacionada con:

* dominio;
* políticas;
* roles;
* flujos de PropertyMember;
* tareas pendientes.

También existe:

```text
references/
```

con material visual relacionado con el módulo financiero.

Antes de diseñar cambios importantes de dominio o autorización, revisar la documentación existente.

No asumir que el README es la única fuente de información.

---

# 23. Estado funcional conocido

Las siguientes funcionalidades se consideran implementadas o iniciadas:

### Autenticación

* autenticación de usuarios;
* control de acceso;
* roles;
* protección de rutas;
* cierre de sesión;
* integración con microservicio de autenticación.

### Propiedades

* registro de propiedades;
* administración de propiedades;
* asociación de propietarios;
* asociación de miembros;
* gestión de ocupación;
* relaciones con contratos y servicios.

### Arrendatarios

* registro;
* consulta;
* información de contacto;
* asociación mediante contratos;
* gestión de información.

### Canon

* configuración;
* actualización;
* vigencia;
* consulta.

### Contratos

* contratos;
* contratos preliminares;
* información contractual;
* recursos/documentos relacionados.

### Finanzas

El módulo financiero está en desarrollo y debe evolucionar sobre el dominio existente, evitando romper contratos y propiedades ya implementados.

Entre las funcionalidades objetivo están:

* obligaciones;
* vencimientos;
* pagos;
* estados de pago;
* cuentas por cobrar;
* cuentas por pagar;
* saldos a favor;
* mora;
* deuda;
* recibos;
* reportes;
* trazabilidad;
* control de acceso financiero.

No asumir que todas las funcionalidades financieras descritas en los requisitos ya están implementadas.

Antes de implementar una funcionalidad marcada como objetivo, comprobar el estado real del código y Prisma.

---

# 24. Requisitos funcionales como contexto

Los requisitos funcionales del proyecto definen, entre otros:

* autenticación y autorización;
* gestión de propiedades;
* gestión de arrendatarios;
* gestión contractual;
* gestión financiera;
* servicios públicos;
* estados de cuenta;
* deuda;
* mora;
* documentos;
* reportes;
* trazabilidad.

Los requisitos proporcionados por el proyecto tienen prioridad sobre suposiciones del modelo.

Cuando exista contradicción entre:

```text
requisito
vs.
implementación actual
```

no modificar automáticamente la implementación.

Primero identificar la contradicción y explicar el impacto.

---

# 25. Testing y validación

Después de realizar cambios importantes:

1. Ejecutar TypeScript/build.
2. Ejecutar tests relevantes.
3. Ejecutar lint cuando corresponda.
4. Revisar errores generados.
5. Verificar que no se hayan modificado archivos no relacionados.

Tests existentes:

```text
test/
```

No declarar una tarea terminada solamente porque el código parece correcto.

Siempre que sea razonable, verificar:

```text
typecheck
→ tests
→ lint
```

---

# 26. Git

Antes de realizar cambios grandes, revisar:

```bash
git status
```

No sobrescribir cambios locales del usuario.

No ejecutar comandos destructivos como:

```bash
git reset --hard
git clean -fd
```

sin autorización explícita.

No eliminar trabajo existente para "simplificar" una implementación.

Al finalizar una tarea, informar:

* archivos modificados;
* cambios principales;
* tests ejecutados;
* problemas pendientes.

No crear commits automáticamente salvo que se solicite.

---

# 27. Cómo trabajar en este proyecto

Para cada tarea seguir preferentemente este flujo:

```text
1. Entender la solicitud
        ↓
2. Localizar archivos relacionados
        ↓
3. Revisar implementación existente
        ↓
4. Revisar Prisma / relaciones
        ↓
5. Identificar impacto
        ↓
6. Proponer solución si el cambio es significativo
        ↓
7. Implementar cambios mínimos
        ↓
8. Ejecutar validaciones
        ↓
9. Revisar errores
        ↓
10. Entregar resumen
```

No saltar directamente al paso de implementación cuando la tarea afecte arquitectura, base de datos, seguridad o lógica financiera.

---

# 28. Regla contra sobreingeniería

No introducir:

* patrones innecesarios;
* abstracciones excesivas;
* nuevos frameworks;
* nuevas librerías;
* microservicios adicionales;
* capas innecesarias;
* refactors masivos;

si la funcionalidad puede implementarse correctamente utilizando la arquitectura existente.

Priorizar:

```text
claridad
+
consistencia
+
mantenibilidad
+
seguridad
+
simplicidad
```

---

# 29. Regla para decisiones ambiguas

Si existen varias implementaciones técnicamente válidas y la decisión afecta:

* arquitectura;
* base de datos;
* contratos API;
* seguridad;
* modelo financiero;
* autorización;
* infraestructura;

no asumir silenciosamente.

Explicar las alternativas y solicitar confirmación cuando la decisión sea difícil de revertir.

Para cambios pequeños y no ambiguos, proceder directamente.

---

# 30. Prioridad de fuentes

Cuando necesites comprender el proyecto, utiliza esta prioridad:

1. Código fuente actual.
2. `prisma/schema.prisma`.
3. Tests.
4. Documentación del proyecto.
5. README.
6. Requisitos funcionales.
7. Inferencias.

Nunca presentar una inferencia como si fuera una regla existente del sistema.

Si no puedes determinar algo con certeza, indicarlo.

---

# 31. Principio general

RENT es un sistema de gestión de arrendamientos con información potencialmente sensible y operaciones financieras.

Por lo tanto, cualquier implementación debe priorizar:

```text
Seguridad
   ↓
Integridad de datos
   ↓
Autorización
   ↓
Trazabilidad
   ↓
Consistencia financiera
   ↓
Mantenibilidad
   ↓
Experiencia de usuario
```

El objetivo no es solamente producir código que funcione.

El código debe integrarse correctamente con el dominio, arquitectura, seguridad y reglas existentes de RENT.

---

# 32. Reporte de análisis del código (estado real al 2026-10-10)

> Generado leyendo `src/`, `prisma/schema.prisma`, `documentation/` y ejecutando la suite de tests.
> Prioridad de fuentes: código > Prisma > tests > docs (ver sección 30). Lo marcado como **inferencia** no está confirmado.

## 32.1 Qué es realmente este servicio

Aunque el repositorio se llama `rent-financial-module`, hoy es el **microservicio de propiedades, miembros, roles/políticas y contratos** de RENT. **El módulo financiero aún NO existe**: en `schema.prisma` no hay modelos de obligación, pago, mora, factura ni estado de cuenta. Solo hay restos: `Currency`, `PaymentStatus` (usado únicamente en `PropertyServiceAssignment`), `Contract.monthlyRent/depositAmount` y `EconomicPropertyInformation`. Cualquier trabajo financiero parte de cero y debe colgar de `Contract` + `PropertyMember` (ver 32.9).

- Puerto `3002` (`PORT`), prefijo global `/rent-financial`, Swagger en `/api` (sin prefijo).
- Auth: JWT **RS256** emitido por el microservicio `rent-auth`; este servicio solo valida con `public.pem`. Payload usado: `{ userId, rols }` (`JwtPassport.validate`). `rols` (roles globales) **no se usa** para autorizar; la autorización es por `PropertyMember` + políticas.
- Llamadas servicio→servicio: `src/features/property-registration/api.ts` (`getUserData`, `getAllUsers`) con token de cliente obtenido por `MicroserviceAuthService` (cache con margen de 5 s).
- ESM puro (`"type": "module"`, `module: nodenext`): **todos los imports relativos llevan sufijo `.js`**.
- Dockerfile ejecuta `entrypoint.sh`: `prisma migrate deploy` → `prisma db seed` → `node dist/src/main.js`. El seed real es `prisma/seed.ts`, configurado en `prisma.config.ts` (`seed: 'pnpm tsx prisma/seed.ts'`); la clave `prisma.seed` de `package.json` apunta a una ruta inexistente (`prisma/seeds/seed.ts`) y es residual en Prisma 7.

## 32.2 Mapa de módulos (`src/`)

| Ruta | Rol |
|---|---|
| `core/auth` | `JwtAuthGuard` (HTTP), `JwtPassport` (strategy RS256), `WsJwtGuard` (token en `handshake.auth.token`, deja usuario en `client.data.user`) |
| `core/database` | `PrismaService` (adapter `pg`, global). Cliente generado en `generated/prisma` (usa `import.meta`) |
| `core/filters` + `global-exception.ts` | `GlobalExceptionFilter`; jerarquía `AppException(message,status,error)` — **toda excepción de dominio debe extenderla** |
| `core/pipes` | `ZodValidation(schema)` → `schema.parse`; Zod falla → filtro responde **406** (no 400) |
| `core/IA` | Cliente Ollama (`CallModelStream`, solo `chat` no-stream pese al nombre). Modelo/host por env |
| `config/` | `env.ts` (lee `public.pem` al importar), `config.ts` (Resend + axios + interceptor Bearer) |
| `shared/pagination` | `paginationSchema` (page≥1, limit 1–100, default 100) y tipos. `paginate()` está vacío; cada repo repite la lógica de metadata |
| `features/property-registration` | Propiedades, miembros, invitaciones, IA de sugerencias |
| `features/contract` | Contratos y borradores (`ContractDraft`) |
| `features/system-property-role` | Motor de autorización (roles/políticas). Sin controller |
| `features/notifications` | Gateway Socket.IO (namespace `notifications`) + persistencia. Sin controller HTTP |
| `features/global` | `GlobalRepository` (direction, resource images, invitations). `GlobalController` **no está registrado** en `GlobalModule` y su handler está vacío |
| `features/microservice-auth` | Token de servicio para hablar con `rent-auth` |
| `types/global-types.ts` | **Catálogos de UUID hardcodeados** de roles, tipos de propiedad, ocupación y políticas (deben coincidir con el seed de BD) |

Patrón de capas: `Controller → Service → Repository → Prisma`. Los repositorios aceptan `db: Prisma.TransactionClient = this.prisma` como último parámetro para participar en `prisma.$transaction`. Comentarios y mensajes de error están en español.

## 32.3 Endpoints (todos bajo `/rent-financial`, JWT salvo indicación)

**Property** (`/property`)
- `POST /` registrar (crea propiedad + dirección + miembro ACTIVE + rol PROPIETARIO, en transacción)
- `GET /` listar propiedades **donde `Property.userId == yo`** (solo dueño)
- `GET /:id` detalle (miembro ACTIVE; **no exige política `VER_INMUEBLE`**)
- `PATCH /:propertyId` editar (política `EDITAR_INMUEBLE`) — ver bug B6
- `POST /IA-registration-suggestion`, `GET /:propertyId/documentation` (`VER_DOCUMENTOS_INMUEBLE`), `POST /:propertyId/documents` (`SUBIR_DOCUMENTOS_INMUEBLE`)
- `DELETE /` stub vacío

**Property member** (`/property-member`): `POST invite-property-member`, `GET properties`, `GET property/:id`, `GET property/:id/getall?status`, `GET :memberId/property/:id/get`, `POST :memberId` (asignar roles), `GET :propertyId/me`, `POST :memberId/status`. Las operaciones de administración de miembros exigen ser **dueño** (`Property.userId`), no una política.

**Público**: `GET /property-process-public/accept-invitation?token=` (sin JWT; crea el miembro IN_PROCESS).

**Contract** (`/contract`): `POST /`, `GET property/:pid`, `GET :cid/property/:pid`, `POST acceptedOrRejected`, `POST draft`, `GET draft/property/:pid/getall`, `GET draft/getAcceptedContracts/property/:pid[/id/:did]`, `GET draft/:did/property/:pid`, `POST draft/:did/agree`, `POST :cid/documents`, `PATCH :cid/property/:pid/status`.

**WebSocket** namespace `notifications`: cliente emite `init` (con `auth.token`) → servidor emite `notifications:init`; nuevas notificaciones llegan por `notification:new` a la room `user:<userId>`.

## 32.4 Modelo de autorización (cómo funciona de verdad)

1. `JwtAuthGuard` → `req.user = { userId, rols }`.
2. `SystemPropertyService.verifyPropertyMemberByUserIdInPropertyId(userId, propertyId)` → exige `PropertyMember` con `status = ACTIVE` (IN_PROCESS/DESACTIVE se rechazan).
3. `SystemPropertyService.CheckPolicies(memberId, [POLICY...])`: políticas efectivas = unión de las políticas de **todos** los roles del miembro − overrides con `active=false`. Permite si **alguna** de las permitidas coincide (`some`, no `every`).
4. `checkRoles` es la variante por nombre de rol (hoy casi sin uso).
5. Excepciones: `PoliciesAuthorizationNotAllowed` responde **401** (semánticamente debería ser 403).

Reglas del dominio observadas: el creador de la propiedad recibe rol `PROPIETARIO`; un invitado entra `IN_PROCESS` con rol `MIEMBRO` y pasa a `ACTIVE` cuando el dueño le asigna roles; el arrendatario recibe `ARRENDADO_PRELIMINAR` al crearse un borrador y pasa a `ARRENDADO` al aceptar el contrato. Las políticas del bloque "finanzas / documentos / notificaciones / servicios prestados" están **vacías** en `POLICIES_STATEMENTS`.

## 32.5 Flujo de contratos

```text
ContractDraft (v1..vN, por propiedad)
  generateContractDraft  [REGISTRAR_CONTRATOS]  → notifica a ambas partes, asigna ARRENDADO_PRELIMINAR
  agreeContractDraft     (landlord y tenant por separado)
        ↓ (landlordAgreed && tenantAgreed, última versión)
Contract.createContract [REGISTRAR_CONTRATOS]  → PENDIENTE_ACEPTACION (copia términos del borrador)
        ↓ AcceptedOrRejected (tenant)
   RECHAZADO | PENDIENTE_DOCUMENTACION  (+ rol ARRENDADO)
        ↓ loadContractDocumentation [SUBIR_DOCUMENTOS_CONTRATO]
   ACTIVO  ──PATCH status──▶ SUSPENDIDO [SUSPENDER_CONTRATOS] | FINALIZADO [FINALIZAR_CONTRATOS]
```
Regla: no se crea contrato si la propiedad ya tiene uno `ACTIVO`. Estados definidos: `BORRADOR` (sin uso), `PENDIENTE_ACEPTACION`, `PENDIENTE_DOCUMENTACION`, `ACTIVO`, `RECHAZADO`, `SUSPENDIDO`, `FINALIZADO`. **No hay máquina de estados**: las transiciones están dispersas en el servicio. Montos: `Decimal` en BD pero el servicio los convierte a `Number` (riesgo de precisión para finanzas).

## 32.6 Hallazgos (bugs y riesgos) — **CORREGIDOS el 2026-10-10** (ver README); sus tests `it.failing` ya son tests normales de regresión

(Histórico) Los tests `it.failing` **pasaban mientras el bug existía y fallarán cuando se corrija**: al arreglar un bug, cambiar ese `it.failing` por `it` (así queda como regresión). No se corrigió ningún bug (regla 6 y 24 de este archivo): requieren decisión del usuario.

| # | Sev. | Dónde | Problema |
|---|---|---|---|
| B1 | **Crítico** | `contract.service.ts:515` | Compara `status` con `'PENDING_ACCEPTANCE'` (enum real: `PENDIENTE_ACEPTACION`) → **ningún contrato puede aceptarse/rechazarse**; el flujo se bloquea antes de `PENDIENTE_DOCUMENTACION` |
| B2 | **Crítico** | `contract.service.ts:503` | `findContractByIdAndTenantMemberId` recibe el `userId` en lugar del `PropertyMember.id` |
| B3 | **Crítico (seguridad)** | `property-member.controller.ts:43-47` | `invitePropertyMembers` toma el `userId` del **body**, no del JWT: cualquier usuario autenticado puede suplantar al dueño. Tampoco valida política |
| B4 | Alto | `core/filters/exception.filter.ts` | `HttpException` de Nest (401 Passport, 403 guard, 404 ruta) se convierte en **500**. Un token inválido responde 500 |
| B5 | Alto | `property-registration.controller.ts:87` | `@UsePipes(ZodValidation(EditingPropertyDtoRequest))` a nivel de método también valida `@Param('propertyId')` (string) → `PATCH /property/:id` siempre 406. Mover el pipe a `@Body(...)` |
| B6 | Alto | `property.service.ts` (`editingProperty`) | `direction` se pasa cruda a Prisma (requiere `update` anidado); `toInsert` incluye `propertyId` inexistente en `ResourceImages`; `updateResourcesImages` borra por `assetId` global (puede afectar otras propiedades) |
| B7 | Alto | `property.repository.ts:349` | `skip = page - 1 * limit` (precedencia) → skip negativo en página 1 con limit 100 |
| B8 | Alto | `property.repository.ts:436` | `bedrooms` se guarda con el valor de `bathrooms` |
| B9 | Medio | `property-mapper.service.ts:39` | `lotArea` se mapea con `area` |
| B10 | Medio | `contract.service.ts` (`createContract`) | Ignora `dto.landlordMemberId` (usa al creador) y no verifica que el borrador aceptado sea del `tenantMemberId` pedido |
| B11 | Medio | `contract.repository.ts:100` | `findAllContractAccepted`: el `count` no filtra por aceptación → `total`/`totalPages` erróneos. Igual en `findAllPartialPropertyInfoByPropertyMemberId` (count ignora `status`) |
| B12 | Medio | `property-member.service.ts` (`acceptPropertyMemberInvitation`) | La invitación nunca pasa a `CONSUMED` → el enlace es reutilizable (segundo uso → violación de unique `userId+propertyId` = 500). El token no está atado al usuario que lo consume |
| B13 | Medio | `contract.service.ts` (`handleContractStatus`) | Sin validación de estado origen: se puede finalizar/suspender un contrato `RECHAZADO` o `FINALIZADO` |
| B14 | Medio | `property.repository.ts:125` | `findByFMIOrPredialNumber` solo valida el predial si no hay `fmi`; además la unicidad es por `userId`, no global |
| B15 | Medio | `contract.service.ts` (`AcceptedOrRejected...`) | `updatePropertyActorRole` se ejecuta **fuera** de la transacción; la rama RECHAZADO no es transaccional |
| B16 | Bajo | `contract.service.ts` (`generateContractDraft`) | Versión calculada fuera de la transacción → carrera con `@@unique([propertyId, version])` (500) |
| B17 | Bajo | `invitation-generation.service.ts:44` | URL de aceptación **hardcodeada** a un dominio ngrok; `propertyName` se inyecta sin escapar en el HTML del correo |
| B18 | Bajo | `contract.repository.ts` / `property*.repository.ts` | `db.$transaction([...])` sobre un `TransactionClient` fallaría si se invoca dentro de otra transacción |
| B19 | Bajo | `property-member.service.ts` | El dueño puede desactivarse a sí mismo (`changeStatusPropertyMember`) |
| B20 | Bajo | varios | `contractDraft` no valida `endDate > startDate`; `console.log(exception)` en el filtro puede registrar datos sensibles; `GlobalController` y `DELETE /property` son stubs |

Deuda de diseño (no bugs): `GET /property/:id` y varias lecturas no exigen política (solo membresía); administración de miembros depende de "ser dueño" en vez de políticas; las notificaciones se emiten por WebSocket dentro de la transacción antes del commit; `NotificationSchema` documenta `transmitterId/receiverId` como "propertyMember" pero el código usa `userId`.

## 32.7 Testing

- **Unit + controller (HTTP con supertest):** `pnpm test` → 29 suites, 324 tests, ~91 % statements. Specs junto al código: `src/**/*.spec.ts`.
- **E2E sin BD:** `pnpm test:e2e` → `test/app.e2e-spec.ts` levanta `AppModule` real con `PrismaService` mockeado y JWT RS256 firmado con una llave efímera.
- Configuración: `jest.config.cjs` (unit) y `test/jest-e2e.config.cjs`, ambas sobre `test/jest.shared.cjs`. Como el proyecto es ESM y el cliente Prisma generado usa `import.meta`, Jest compila a CJS (`test/tsconfig.spec.json`) y, vía `moduleNameMapper`, sustituye `generated/prisma/client`, `config/env`, `config/config` y `ollama` por stubs de `test/mocks/`. Los imports `.js` se mapean a `.ts`.
- Utilidades: `test/helpers.ts` → `createControllerApp(controller, providers)` (guard falso que inyecta `TEST_USER`, `GlobalExceptionFilter` activo) y `signTestJwt`.
- Convención (sigue vigente para bugs futuros: `it.failing` mientras no se corrija): mocks de repositorio/servicio con `jest.fn()` y `as never`; `jest.resetAllMocks()` en `beforeEach` (**ojo:** resetea también implementaciones de `jest.fn(impl)`/factories de `jest.mock`; reconfigurarlas en `beforeEach`). Los bugs conocidos se documentan con `it.failing`.
- Limitación: no hay tests contra PostgreSQL real (las consultas Prisma se verifican por forma, no por resultado). Para eso haría falta una BD de pruebas (`docker-compose.yml` ya define una Postgres en el puerto 5431).
- ESLint relaja las reglas `no-unsafe-*` solo para `*.spec.ts` y `test/`.
- Verificación al día de este reporte: `tsc --noEmit` OK, `nest build` OK, lint de specs OK, unit 324/324, e2e 7/7.

## 32.8 Skills del proyecto (`.claude/skills/`)

| Skill | Cuándo usarla |
|---|---|
| `rent-new-feature` | Crear una feature/módulo NestJS con las capas y convenciones de RENT |
| `rent-authorization` | Añadir/proteger un endpoint con membresía, políticas y roles; agregar una política nueva |
| `rent-prisma-change` | Modificar `schema.prisma`, migraciones, seed y catálogos de UUID |
| `rent-write-tests` | Escribir tests (unit, controller, e2e) con la infraestructura del proyecto |
| `rent-financial-module` | Diseñar/implementar el módulo financiero (obligaciones, pagos, mora, estado de cuenta) |
| `rent-review-bugs` | Revisar/corregir los hallazgos B1–B20 y convertir su `it.failing` en regresión |

## 32.9 Punto de partida recomendado para el módulo financiero

1. Resolver antes B1, B2, B4 y B13 (el flujo de contrato debe llegar a `ACTIVO` de forma fiable; las obligaciones nacerán de un contrato `ACTIVO`).
2. Modelar sobre `Contract`/`PropertyMember` (no duplicar conceptos): obligación (concepto, monto `Decimal`, vencimiento, responsable = `tenantMemberId`, beneficiario = `landlordMemberId`), pagos parciales, estado y bitácora inmutable. Reutilizar `Currency` y revisar/renombrar `PaymentStatus` (hoy mezcla estados de pasarela).
3. Añadir políticas financieras al catálogo (`POLICIES_STATEMENTS`) y a los seeds; hoy el bloque está vacío.
4. Definir la regla de mora con el usuario antes de implementarla (sección 14: no inventarla). Centralizar el cálculo de saldo/mora en un único servicio.
5. Evitar `Number` para dinero: operar con `Prisma.Decimal` de extremo a extremo.
