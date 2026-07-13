import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getStats() {
    const totalTickets = await this.prisma.ticket.count();
    const openTickets = await this.prisma.ticket.count({ where: { status: 'OPEN' } });
    const inProgressTickets = await this.prisma.ticket.count({ where: { status: 'IN_PROGRESS' } });
    const resolvedTickets = await this.prisma.ticket.count({ where: { status: 'RESOLVED' } });
    const closedTickets = await this.prisma.ticket.count({ where: { status: 'CLOSED' } });
    
    const slaBreachedTickets = await this.prisma.ticket.count({
      where: {
        slaBreached: true,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    });

    const feedbackList = await this.prisma.feedback.findMany();
    const avgCsat =
      feedbackList.length > 0
        ? feedbackList.reduce((acc, curr) => acc + curr.score, 0) / feedbackList.length
        : 0;

    // Tickets by category
    const techCount = await this.prisma.ticket.count({ where: { category: 'Technical' } });
    const billingCount = await this.prisma.ticket.count({ where: { category: 'Billing' } });
    const generalCount = await this.prisma.ticket.count({ where: { category: 'General' } });

    // Recent audit logs
    const recentLogs = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    // Recent complaints
    const recentComplaints = await this.prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        ticket: {
          include: {
            customer: { include: { user: true } },
          },
        },
      },
    });

    // Agents list
    const agents = await this.prisma.user.findMany({
      where: { role: { in: ['AGENT', 'ADMIN'] } },
    });

    return {
      metrics: {
        totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        slaBreaches: slaBreachedTickets,
        averageCsat: Number(avgCsat.toFixed(1)),
      },
      categories: {
        Technical: techCount,
        Billing: billingCount,
        General: generalCount,
      },
      recentLogs,
      recentComplaints,
      agents,
    };
  }
}
