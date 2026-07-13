import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CreateTicketUseCase } from '../ticket/use-cases/create-ticket.use-case';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('whatsapp/webhook')
  async receiveWhatsAppMessage(
    @Body('fromNumber') fromNumber: string,
    @Body('name') name: string,
    @Body('body') body: string,
  ) {
    if (!fromNumber || !body) {
      throw new BadRequestException('fromNumber and body are required.');
    }

    // 1. Find or create customer by phone number
    let profile = await this.prisma.customerProfile.findFirst({
      where: { phoneNumber: fromNumber },
      include: { user: true },
    });

    if (!profile) {
      const email = `${fromNumber.replace('+', '')}@whatsapp.nrt.com`;
      const user = await this.prisma.user.create({
        data: {
          email,
          name: name || `WhatsApp User ${fromNumber}`,
          role: 'CUSTOMER',
        },
      });

      profile = await this.prisma.customerProfile.create({
        data: {
          userId: user.id,
          phoneNumber: fromNumber,
          company: 'WhatsApp Support Channel',
          notes: 'Created via WhatsApp Incoming message',
        },
        include: { user: true },
      });
    }

    // 2. Check for active open ticket
    let ticket = await this.prisma.ticket.findFirst({
      where: {
        customerId: profile.id,
        status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] },
      },
    });

    if (!ticket) {
      // Create ticket
      const ticketEntity = await this.createTicketUseCase.execute({
        title: `WhatsApp chat from ${fromNumber}`,
        description: body,
        category: 'GENERAL',
        priority: 'MEDIUM',
        customerId: profile.id,
        channel: 'WHATSAPP',
      });
      return { status: 'success', action: 'ticket_created', ticketId: ticketEntity.id };
    }

    // Append message to existing ticket
    const msg = await this.prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: profile.id,
        senderRole: 'CUSTOMER',
        body,
        channel: 'WHATSAPP',
        direction: 'INBOUND',
      },
    });

    return { status: 'success', action: 'message_appended', messageId: msg.id };
  }

  @Post('email/receive')
  async receiveEmail(
    @Body('fromEmail') fromEmail: string,
    @Body('name') name: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
  ) {
    if (!fromEmail || !body || !subject) {
      throw new BadRequestException('fromEmail, subject, and body are required.');
    }

    // 1. Find or create customer by email
    let user = await this.prisma.user.findUnique({
      where: { email: fromEmail },
      include: { customerProfile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: fromEmail,
          name: name || fromEmail.split('@')[0],
          role: 'CUSTOMER',
        },
        include: { customerProfile: true },
      });

      const profile = await this.prisma.customerProfile.create({
        data: {
          userId: user.id,
          company: 'Email Support Channel',
          notes: 'Created via Email Incoming message',
        },
      });
      user.customerProfile = profile;
    }

    const customerProfileId = user.customerProfile!.id;

    // 2. Check for open ticket matching subject or active open tickets
    let ticket = await this.prisma.ticket.findFirst({
      where: {
        customerId: customerProfileId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] },
      },
    });

    if (!ticket) {
      // Create new ticket
      const ticketEntity = await this.createTicketUseCase.execute({
        title: subject,
        description: body,
        category: 'GENERAL',
        priority: 'MEDIUM',
        customerId: customerProfileId,
        channel: 'EMAIL',
      });
      return { status: 'success', action: 'ticket_created', ticketId: ticketEntity.id };
    }

    // Append to existing ticket
    const msg = await this.prisma.message.create({
      data: {
        ticketId: ticket.id,
        senderId: customerProfileId,
        senderRole: 'CUSTOMER',
        body,
        channel: 'EMAIL',
        direction: 'INBOUND',
      },
    });

    return { status: 'success', action: 'message_appended', messageId: msg.id };
  }
}
