import { Injectable } from '@nestjs/common';
import { ITicketRepository } from '../domain/ticket-repository.interface';
import { TicketEntity, TicketStatus, TicketPriority, TicketCategory } from '../domain/ticket.entity';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Ticket as PrismaTicket } from '@prisma/client';

@Injectable()
export class PrismaTicketRepository implements ITicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(doc: PrismaTicket): TicketEntity {
    return new TicketEntity(
      doc.id,
      doc.title,
      doc.description,
      doc.status as TicketStatus,
      doc.priority as TicketPriority,
      doc.category as TicketCategory,
      doc.customerId,
      doc.assigneeId,
      doc.slaDeadline,
      doc.slaBreached,
      doc.createdAt,
      doc.updatedAt,
    );
  }

  async findById(id: string): Promise<TicketEntity | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });
    return ticket ? this.mapToEntity(ticket) : null;
  }

  async findAll(): Promise<TicketEntity[]> {
    const tickets = await this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((t) => this.mapToEntity(t));
  }

  async findByCustomerId(customerId: string): Promise<TicketEntity[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((t) => this.mapToEntity(t));
  }

  async create(ticket: Omit<TicketEntity, 'id' | 'createdAt' | 'updatedAt' | 'slaBreached'>): Promise<TicketEntity> {
    const doc = await this.prisma.ticket.create({
      data: {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        customerId: ticket.customerId,
        assigneeId: ticket.assigneeId,
        slaDeadline: ticket.slaDeadline,
        slaBreached: false,
      },
    });
    return this.mapToEntity(doc);
  }

  async update(ticket: TicketEntity): Promise<TicketEntity> {
    const doc = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        assigneeId: ticket.assigneeId,
        slaDeadline: ticket.slaDeadline,
        slaBreached: ticket.slaBreached,
      },
    });
    return this.mapToEntity(doc);
  }

  async findBreachedTickets(): Promise<TicketEntity[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        slaBreached: true,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    });
    return tickets.map((t) => this.mapToEntity(t));
  }
}
