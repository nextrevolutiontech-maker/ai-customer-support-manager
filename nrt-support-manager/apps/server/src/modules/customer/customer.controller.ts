import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.customerProfile.findMany({
      include: {
        user: true,
        tickets: true,
      },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: {
        user: true,
        tickets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Customer profile with ID ${id} not found.`);
    }

    // Get audit logs for this customer user
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { userId: profile.userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      profile,
      history: auditLogs,
    };
  }
}
