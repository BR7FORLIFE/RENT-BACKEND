/**
 * Frontera de integracion con pagos (NO implementada).
 *
 * Hoy RENT no tiene modulo de pagos (ver CLAUDE.md 32.1), por lo que este modulo NO crea,
 * simula ni marca pagos. El estado operativo de la solicitud (ServiceRequestStatus) es
 * independiente del estado financiero.
 *
 * Contrato previsto para cuando exista el modulo de pagos:
 *  - Una solicitud es "cobrable" cuando status = COMPLETED y agreedPrice != null; el modulo de
 *    pagos debe tomar `{ serviceRequestId, agreedPrice, currency, requestedByUserId (pagador),
 *    providerUserId (beneficiario) }` y es dueño del estado del pago (pendiente, pagado, fallido...).
 *  - La relacion se guarda del lado de pagos (referencia a serviceRequestId) o, si se decide
 *    guardarla aqui, con una columna nullable `paymentId` (cambio de esquema a acordar).
 *  - Este modulo solo expondria los datos anteriores; no duplica logica de pagos.
 */
export interface ServicePayableSnapshot {
  serviceRequestId: string;
  agreedPrice: string;
  currency: 'COP' | 'USD';
  payerUserId: string;
  beneficiaryUserId: string;
}
