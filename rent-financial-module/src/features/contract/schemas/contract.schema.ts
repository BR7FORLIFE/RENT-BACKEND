import z from 'zod';

export const StatusContractEnum = z.enum([
  'DRAFT',
  'PENDING_ACCEPTANCE',
  'PENDING_DOCUMENTATION',
  'ACTIVE',
  'REJECTED',
  'CANCELLED',
  'SUSPENDED',
  'FINISHED',
]);

export type StatusContractType = z.infer<typeof StatusContractEnum>;

export const contractSchema = z.object({
  id: z.uuid().optional(),
  propertyId: z.uuid(),
  landlordMemberId: z.uuid(),
  tenantMemberId: z.uuid(),
  monthlyRent: z.coerce.number(),
  depositAmount: z.coerce.number(),
  startDate: z.date(),
  endDate: z.date(),
  status: StatusContractEnum,
  createByUserId: z.uuid(),
  createAt: z.date().optional(),
  updateAt: z.date().optional(),
});

export type ContractType = z.infer<typeof contractSchema>;

export const ContractResourceSchema = z.object({
  contractId: z.uuid(),
  resourceId: z.uuid(),
});

export type ContractResourceType = z.infer<typeof ContractResourceSchema>;

/*REGLAS DE NEGOCIO PARA LOS CONTRATOS*
 *
 * REGLA IMPORTANTISIMA
 *
 * El el modelo de contratos para tu crear un acuerdo, (contrato) todas las partes ya sea propietario del
 * inmueble, persona quien hace el acuerdo de arrendamiento, la persona quien firma (arrendatario)
 * y la persona quien crea el contrato deben ser propertyMembers activos en dicho inmueble
 *
 * 1. Para tu poder acceder a un contrato debe ser un usuario activo en la aplicacion (nivel de software)
 *
 * Explicación: Un usuario puede tener derecho a tener un contrato en un inmueble si se encuentra registrado
 * en la app ya que asi se mantiene un mejor control de los arriendos
 *
 *
 * 2. Los usuarios con un contrato de arrendamiento pasan ser parte miembro de la propiedad con su rol o
 * distintos roles correspondientes como sea el caso
 *
 * 3. Cada contrato es unico e irrepetible ya que debe constatar la veracidad de un contrato legalmente, proximente
 * exportaciones de firmas y descargas en pdf o word
 *
 * 4. El contrato no esta ligado a un abogado o especialista, este modelo de negocio permite al arrendador
 * no depender de servicios externos si asi lo requiera, un contrato puede ser generada por IA y ser autetnticada
 * y verificada por un notario, sino es el caso puede prestar un servicio a un abogado y adjuntar en la aplicacion
 * el contrato digitalizado en cuestion
 *
 * 5. Hablando de estados de contratos una propiedad no puede crear otro contrato a otra persona si esta tiene
 * un estado de EXECUTION O PENDING con otro arrendatario, Puede hacerse si el estados de los contratos estan
 * pendientes o estan expiradas
 */
