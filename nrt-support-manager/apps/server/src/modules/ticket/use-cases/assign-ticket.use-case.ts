import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITicketRepository } from '../domain/ticket-repository.interface';
import { TicketEntity } from '../domain/ticket.entity';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface AssignTicketDto {
  ticketId: string;
  assigneeId: string;
}

@Injectable()
export class AssignTicketUseCase {
  constructor(
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: AssignTicketDto): Promise<TicketEntity> {
    // 1. Fetch Ticket
    const ticket = await this.ticketRepository.findById(dto.ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${dto.ticketId} not found.`);
    }

    // 2. Verify agent exists
    const agent = await this.prisma.user.findUnique({
      where: { id: dto.assigneeId, role: { in: ['AGENT', 'ADMIN'] } },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${dto.assigneeId} not found.`);
    }

    // 3. Execute domain transition
    ticket.assignTo(dto.assigneeId);

    // 4. Persist
    const updated = await this.ticketRepository.update(ticket);

    // 5. Log activity
    await this.prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: 'system',
        senderRole: 'SYSTEM',
        body: `Ticket assigned to agent: ${agent.name}`,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: dto.assigneeId,
        action: 'TICKET_ASSIGNED',
        details: `Ticket ID ${ticket.id} assigned to ${agent.name} (${agent.email})`,
      },
    });

    return updated;
  }
}
