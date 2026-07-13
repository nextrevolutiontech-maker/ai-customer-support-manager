import { Controller, Get, Post, Patch, Body, Param, Inject } from '@nestjs/common';
import { CreateTicketUseCase } from '../use-cases/create-ticket.use-case';
import type { CreateTicketDto } from '../use-cases/create-ticket.use-case';
import { AssignTicketUseCase } from '../use-cases/assign-ticket.use-case';
import { UpdateTicketStatusUseCase } from '../use-cases/update-ticket-status.use-case';
import type { ITicketRepository } from '../domain/ticket-repository.interface';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { OutboundDispatcherService } from '../../integrations/outbound-dispatcher.service';

@Controller('tickets')
export class TicketController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly assignTicketUseCase: AssignTicketUseCase,
    private readonly updateTicketStatusUseCase: UpdateTicketStatusUseCase,
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    private readonly prisma: PrismaService,
    private readonly outboundDispatcher: OutboundDispatcherService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTicketDto) {
    return this.createTicketUseCase.execute(dto);
  }

  @Get()
  async findAll() {
    return this.prisma.ticket.findMany({
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        assignee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        assignee: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        complaint: true,
        feedback: true,
      },
    });
    return ticket;
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    return this.assignTicketUseCase.execute({ ticketId: id, assigneeId });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @Body('userId') userId: string,
  ) {
    return this.updateTicketStatusUseCase.execute({ ticketId: id, status, userId });
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id') ticketId: string,
    @Body('body') body: string,
    @Body('senderId') senderId: string,
    @Body('senderRole') senderRole: 'AGENT' | 'CUSTOMER',
    @Body('channel') channel: 'WHATSAPP' | 'EMAIL' | 'LIVE_CHAT',
  ) {
    const direction = senderRole === 'CUSTOMER' ? 'INBOUND' : 'OUTBOUND';
    
    // 1. Create message in DB
    const message = await this.prisma.message.create({
      data: {
        ticketId,
        senderId,
        senderRole,
        body,
        channel,
        direction,
      },
    });

    // 2. Set ticket to IN_PROGRESS if agent replied
    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: senderRole === 'AGENT' ? 'IN_PROGRESS' : undefined,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          include: { user: true },
        },
      },
    });

    // 3. Dispatch outbound message to customer via Cloud APIs if credentials are active
    if (senderRole === 'AGENT') {
      if (channel === 'WHATSAPP' && updatedTicket.customer?.phoneNumber) {
        await this.outboundDispatcher.sendWhatsApp(updatedTicket.customer.phoneNumber, body);
      } else if (channel === 'EMAIL' && updatedTicket.customer?.user?.email) {
        await this.outboundDispatcher.sendEmail(
          updatedTicket.customer.user.email,
          `Re: [Ticket #${updatedTicket.id.slice(0, 8)}] ${updatedTicket.title}`,
          body,
        );
      }
    }

    return message;
  }
}
