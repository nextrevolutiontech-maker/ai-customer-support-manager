import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async submitFeedback(
    @Body('ticketId') ticketId: string,
    @Body('score') score: number,
    @Body('comment') comment?: string,
  ) {
    // Verify ticket is RESOLVED or CLOSED
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new BadRequestException(`Ticket with ID ${ticketId} not found.`);
    }

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      throw new BadRequestException('Feedback can only be submitted for resolved or closed tickets.');
    }

    // Save feedback
    const feedback = await this.prisma.feedback.create({
      data: {
        ticketId,
        score,
        comment,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId: ticket.customerId,
        action: 'SUBMITTED_FEEDBACK',
        details: `Customer submitted feedback for ticket ${ticketId}. Score: ${score}`,
      },
    });

    return feedback;
  }

  @Get()
  async getAllFeedback() {
    return this.prisma.feedback.findMany({
      include: {
        ticket: {
          include: {
            customer: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
