import { TicketEntity } from './ticket.entity';

export interface CreateTicketData {
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  customerId: string;
  assigneeId: string | null;
  slaDeadline: Date | null;
}

export interface ITicketRepository {
  findById(id: string): Promise<TicketEntity | null>;
  findAll(): Promise<TicketEntity[]>;
  findByCustomerId(customerId: string): Promise<TicketEntity[]>;
  create(ticket: CreateTicketData): Promise<TicketEntity>;
  update(ticket: TicketEntity): Promise<TicketEntity>;
  findBreachedTickets(): Promise<TicketEntity[]>;
}
