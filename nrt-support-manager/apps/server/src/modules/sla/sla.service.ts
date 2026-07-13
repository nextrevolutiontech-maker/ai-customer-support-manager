import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkSlaBreaches() {
    this.logger.log('Checking SLA deadlines...');
    const now = new Date();

    // Find tickets that are not resolved/closed, have a deadline in the past, and are not yet marked breached
    const pendingTickets = await this.prisma.ticket.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaDeadline: { lt: now },
        slaBreached: false,
      },
      include: {
        customer: { include: { user: true } },
        assignee: true,
      },
    });

    for (const ticket of pendingTickets) {
      await this.prisma.$transaction(async (tx) => {
        // Mark breached
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { slaBreached: true },
        });

        // Add System message
        await tx.message.create({
          data: {
            ticketId: ticket.id,
            senderId: 'system',
            senderRole: 'SYSTEM',
            body: `SLA Alert: Ticket priority "${ticket.priority}" has breached its resolution SLA deadline of ${ticket.slaDeadline?.toISOString()}. Escalating to administration.`,
            channel: 'EMAIL',
            direction: 'OUTBOUND',
          },
        });

        // Log audit
        await tx.auditLog.create({
          data: {
            userId: ticket.assigneeId || 'system',
            action: 'SLA_BREACHED',
            details: `Ticket ID ${ticket.id} ("${ticket.title}") breached SLA deadline.`,
          },
        });
      });

      this.logger.warn(`SLA Breached for Ticket ID ${ticket.id}`);
    }
  }

  async getViolations() {
    return this.prisma.ticket.findMany({
      where: { slaBreached: true },
      include: {
        customer: { include: { user: true } },
        assignee: true,
      },
      orderBy: { slaDeadline: 'asc' },
    });
  }

  async getPolicies() {
    return this.prisma.sLAPolicy.findMany();
  }
}
