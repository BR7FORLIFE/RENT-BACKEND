---
name: rent-financial-module
description: Diseñar e implementar el módulo financiero de RENT (obligaciones, vencimientos, pagos parciales, saldos, mora, estado de cuenta, recibos). Úsala para cualquier trabajo de dinero/cartera; hoy el módulo NO existe en el código.
---

# Módulo financiero

Estado real: **no hay modelos financieros** en `schema.prisma` (solo `Currency`, `PaymentStatus` de servicios, montos en `Contract`/`EconomicPropertyInformation`). Esta skill es una guía de diseño; las decisiones abiertas se confirman con el usuario (CLAUDE.md §6, §14, §29). Si el usuario solo pide algo pequeño, no diseñes todo.

## Pasos
1. **Pre-requisitos**: el flujo de contrato debe funcionar (bugs B1, B2, B13 en `CLAUDE.md` §32.6) y existir un contrato `ACTIVO`.
2. **Confirmar con el usuario** (no asumir): generación de obligaciones (mensual automática vs manual), reglas de mora (tasa, días de gracia, base), moneda/redondeo, quién registra pagos (¿validación por el arrendador?), pasarela de pagos (¿otro microservicio?, el schema dice "el encargado es el módulo de pagos"), anulaciones.
3. **Modelar** sobre lo existente: obligación ligada a `Contract` (+ `propertyId`), responsable = `tenantMemberId`, beneficiario = `landlordMemberId`; concepto (canon, administración, parqueadero, servicio público → `PublicService`, extraordinaria); `Decimal` para montos; estados en español de CLAUDE.md §12 (verificar nombres finales en el schema); pagos como registros **inmutables** (append-only) y ajustes por contra-asiento; historial/auditoría de cambios de estado. Ver skill `rent-prisma-change`.
4. **Una sola fuente de verdad** para `saldo = obligación − Σ pagos` y `mora`; un servicio de cálculo puro (sin Prisma) fácil de testear; estado de cuenta se deriva, no se duplica.
5. **Autorización**: nuevas políticas (`VER_OBLIGACIONES`, `REGISTRAR_PAGO`, `ANULAR_OBLIGACION`, …) en `POLICIES_STATEMENTS` + seed + docs (skill `rent-authorization`). El arrendatario solo ve lo suyo; filtrar por `propertyId` y por miembro.
6. **Integridad**: operaciones de pago en transacción; idempotencia (clave/única por referencia de pago); bloqueo/validación contra doble pago y sobrepago; fechas en UTC.
7. **Precisión**: operar con `Prisma.Decimal` de extremo a extremo; el código actual convierte a `Number` en `createContract` (no replicar).
8. **Notificaciones**: vencimientos y mora por `NotificationService` + gateway.
9. **Tests**: cálculo de mora/saldo con tablas de casos (bordes de fecha, pagos parciales, sobrepago, anulado), autorización por rol, idempotencia (skill `rent-write-tests`).

Revisar `references/` (material visual del módulo) y `documentation/` antes de diseñar.
