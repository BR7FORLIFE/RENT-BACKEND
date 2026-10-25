import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service.js';
import type {
  Currency,
  Prisma,
} from '../../../../generated/prisma/client.js';

// contratos aceptados por el arrendatario cuyo canon ya debe generar ingresos
const RENT_CONTRACT_STATUSES = ['PENDIENTE_DOCUMENTACION', 'ACTIVO'] as const;
const RENT_SWEEP_INTERVAL_MS = 60 * 60 * 1000;

export interface ServiceExpenseSource {
  id: string;
  propertyId: string;
  agreedPrice: { toString(): string };
  currency: Currency;
  serviceName: string;
}

// marca para relacionar el gasto con la solicitud sin cambiar el esquema
const serviceTag = (requestId: string) => `[SR:${requestId}]`;

@Injectable()
export class FinanceAutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FinanceAutomationService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // simulacion del cobro del canon: barrido al iniciar y luego cada hora
    setTimeout(() => void this.safeSweep(), 5000).unref();
    this.timer = setInterval(
      () => void this.safeSweep(),
      RENT_SWEEP_INTERVAL_MS,
    );
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async safeSweep() {
    try {
      const created = await this.generateDueRent();
      if (created > 0) this.logger.log(`Ingresos de canon creados: ${created}`);
    } catch (error) {
      this.logger.error('Fallo la simulacion de ingresos de canon', error);
    }
  }

  // ---------------- gastos por servicios ----------------

  // Gasto (pendiente de pago) cuando la solicitud esta aceptada y con precio acordado.
  // Idempotente: si ya existe el gasto de esa solicitud no crea otro.
  async registerServiceExpense(source: ServiceExpenseSource) {
    const tag = serviceTag(source.id);
    const existing = await this.prisma.financialTransaction.findFirst({
      where: { propertyId: source.propertyId, description: { contains: tag } },
      select: { id: true },
    });
    if (existing) return existing;

    return await this.prisma.financialTransaction.create({
      data: {
        propertyId: source.propertyId,
        type: 'EXPENSE',
        category: 'SERVICE',
        status: 'PENDING',
        description: `Servicio: ${source.serviceName} ${tag}`,
        amount: source.agreedPrice.toString(),
        currency: source.currency,
        isSimulated: true,
      },
    });
  }

  // el servicio se completo: el gasto queda pagado
  async markServiceExpensePaid(requestId: string) {
    await this.prisma.financialTransaction.updateMany({
      where: {
        description: { contains: serviceTag(requestId) },
        status: { in: ['PLANNED', 'PENDING', 'OVERDUE'] },
      },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  // la solicitud se cancelo: el gasto no pagado se anula
  async cancelServiceExpense(requestId: string) {
    await this.prisma.financialTransaction.updateMany({
      where: {
        description: { contains: serviceTag(requestId) },
        status: { in: ['PLANNED', 'PENDING', 'OVERDUE'] },
      },
      data: { status: 'CANCELLED' },
    });
  }

  // ---------------- ingresos por canon (simulado) ----------------

  // Para cada contrato aceptado, cada mes desde su inicio hasta hoy cuya fecha de pago
  // (el dia del mes de startDate) ya llego registra un ingreso RENT. Idempotente por dueDate.
  async generateDueRent(propertyId?: string, now = new Date()) {
    const contracts = await this.prisma.contract.findMany({
      where: {
        status: { in: [...RENT_CONTRACT_STATUSES] },
        startDate: { lte: now },
        ...(propertyId && { propertyId }),
      },
    });

    let created = 0;
    for (const contract of contracts) {
      for (const dueDate of this.paymentDates(
        contract.startDate,
        contract.endDate,
        now,
      )) {
        const exists = await this.prisma.financialTransaction.findFirst({
          where: {
            contractId: contract.id,
            type: 'INCOME',
            category: 'RENT',
            dueDate,
          },
          select: { id: true },
        });
        if (exists) continue;

        const data: Prisma.FinancialTransactionUncheckedCreateInput = {
          propertyId: contract.propertyId,
          contractId: contract.id,
          type: 'INCOME',
          category: 'RENT',
          status: 'PAID',
          description: `Canon de arrendamiento ${dueDate.toISOString().slice(0, 7)}`,
          amount: contract.monthlyRent.toString(),
          currency: 'COP',
          dueDate,
          occurredAt: dueDate,
          paidAt: dueDate,
          isSimulated: true,
        };
        await this.prisma.financialTransaction.create({ data });
        created++;
      }
    }
    return created;
  }

  // fechas de pago mensuales (dia de startDate, ajustado al fin de mes) que ya llegaron
  private paymentDates(start: Date, end: Date, now: Date): Date[] {
    const dates: Date[] = [];
    const day = start.getUTCDate();
    const limit = end < now ? end : now;

    for (let i = 0; i < 600; i++) {
      const year = start.getUTCFullYear();
      const month = start.getUTCMonth() + i;
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const due = new Date(
        Date.UTC(
          year,
          month,
          Math.min(day, lastDay),
          start.getUTCHours(),
          start.getUTCMinutes(),
          start.getUTCSeconds(),
        ),
      );
      if (due > limit) break;
      dates.push(due);
    }
    return dates;
  }
}
