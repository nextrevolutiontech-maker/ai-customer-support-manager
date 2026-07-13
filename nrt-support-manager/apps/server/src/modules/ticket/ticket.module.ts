import { Module } from '@nestjs/common';
import { TicketController } from './infra/ticket.controller';
import { PrismaTicketRepository } from './infra/prisma-ticket.repository';
import { CreateTicketUseCase } from './use-cases/create-ticket.use-case';
import { AssignTicketUseCase } from './use-cases/assign-ticket.use-case';
import { UpdateTicketStatusUseCase } from './use-cases/update-ticket-status.use-case';

@Module({
  controllers: [TicketController],
  providers: [
    {
      provide: 'ITicketRepository',
      useClass: PrismaTicketRepository,
    },
    CreateTicketUseCase,
    AssignTicketUseCase,
    UpdateTicketStatusUseCase,
  ],
  exports: [
    'ITicketRepository',
    CreateTicketUseCase,
    AssignTicketUseCase,
    UpdateTicketStatusUseCase,
  ],
})
export class TicketModule {}
