import { Controller, Post, Patch, Get, Body, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('complaints')
export class ComplaintController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async submitComplaint(
    @Body('ticketId') ticketId: string,
    @Body('reason') reason: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignee: true },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found.`);
    }

    // Create complaint
    const complaint = await this.prisma.complaint.create({
      data: {
        ticketId,
        reason,
        status: 'PENDING',
      },
    });

    // Auto-escalation: If ticket was assigned to an agent, escalate to a manager
    const manager = 'manager@nrt.com';
    await this.prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        escalatedTo: manager,
        status: 'INVESTIGATING',
      },
    });

    // Log in messages
    await this.prisma.message.create({
      data: {
        ticketId,
        senderId: 'system',
        senderRole: 'SYSTEM',
        body: `A formal complaint has been filed for this ticket. Escalated to Manager (${manager}). Reason: ${reason}`,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
      },
    });

    // Log in audit log
    await this.prisma.auditLog.create({
      data: {
        userId: ticket.customerId,
        action: 'COMPLAINT_FILED',
        details: `Complaint filed for ticket ${ticketId}. Reason: ${reason}. Escalated to ${manager}.`,
      },
    });

    return { ...complaint, escalatedTo: manager, status: 'INVESTIGATING' };
  }

  @Get()
  async getAllComplaints() {
    return this.prisma.complaint.findMany({
      include: {
        ticket: {
          include: {
            customer: { include: { user: true } },
            assignee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id')
  async updateComplaintStatus(
    @Param('id') id: string,
    @Body('status') status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED',
    @Body('managerNotes') managerNotes?: string,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found.`);
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status,
      },
    });

    // Log in audit log
    await this.prisma.auditLog.create({
      data: {
        userId: 'manager@nrt.com',
        action: 'COMPLAINT_STATUS_UPDATED',
        details: `Complaint ${id} status updated to ${status}. Notes: ${managerNotes || 'None'}`,
      },
    });

    return updated;
  }
}
