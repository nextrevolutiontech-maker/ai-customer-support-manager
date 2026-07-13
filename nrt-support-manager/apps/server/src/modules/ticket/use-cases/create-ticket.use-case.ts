import { Injectable, Inject } from '@nestjs/common';
import type { ITicketRepository } from '../domain/ticket-repository.interface';
import { TicketEntity, TicketStatus, TicketPriority, TicketCategory } from '../domain/ticket.entity';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface CreateTicketDto {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  customerId: string;
  channel?: 'EMAIL' | 'LIVE_CHAT' | 'WHATSAPP';
}

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: CreateTicketDto): Promise<TicketEntity> {
    // 1. Fetch SLA Policy for the ticket priority
    const policy = await this.prisma.sLAPolicy.findUnique({
      where: { priority: dto.priority },
    });

    const resolutionHours = policy ? policy.resolutionTimeHours : 24.0; // default 24h
    const slaDeadline = new Date(Date.now() + resolutionHours * 60 * 60 * 1000);

    // 2. Create the Ticket Entity
    const ticket = await this.ticketRepository.create({
      title: dto.title,
      description: dto.description,
      status: 'OPEN',
      priority: dto.priority,
      category: dto.category,
      customerId: dto.customerId,
      assigneeId: null,
      slaDeadline,
    });

    // 3. Create initial inbound message representing customer's support request
    await this.prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: dto.customerId,
        senderRole: 'CUSTOMER',
        body: dto.description,
        channel: dto.channel || 'EMAIL',
        direction: 'INBOUND',
      },
    });

    // 4. Log audit event
    await this.prisma.auditLog.create({
      data: {
        userId: dto.customerId,
        action: 'TICKET_CREATED',
        details: `Ticket "${ticket.title}" created with priority ${ticket.priority}. SLA Deadline set to ${slaDeadline.toISOString()}.`,
      },
    });

    return ticket;
  }
}
