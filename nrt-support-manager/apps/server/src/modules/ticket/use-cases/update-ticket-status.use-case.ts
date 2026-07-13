import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITicketRepository } from '../domain/ticket-repository.interface';
import { TicketEntity, TicketStatus } from '../domain/ticket.entity';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface UpdateTicketStatusDto {
  ticketId: string;
  status: TicketStatus;
  userId: string; // The user making the update (Agent or System)
}

@Injectable()
export class UpdateTicketStatusUseCase {
  constructor(
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: UpdateTicketStatusDto): Promise<TicketEntity> {
    const ticket = await this.ticketRepository.findById(dto.ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${dto.ticketId} not found.`);
    }

    const oldStatus = ticket.status;
    ticket.status = dto.status;
    ticket.updatedAt = new Date();

    // Specific logic for resolution
    if (dto.status === 'RESOLVED') {
      ticket.resolve();
    } else if (dto.status === 'CLOSED') {
      ticket.close();
    }

    const updated = await this.ticketRepository.update(ticket);

    // Notify/Log transitions
    await this.prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: dto.userId,
        senderRole: 'SYSTEM',
        body: `Ticket status updated from ${oldStatus} to ${dto.status}`,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        action: 'TICKET_STATUS_UPDATED',
        details: `Ticket ID ${ticket.id} status changed from ${oldStatus} to ${dto.status}`,
      },
    });

    return updated;
  }
}
