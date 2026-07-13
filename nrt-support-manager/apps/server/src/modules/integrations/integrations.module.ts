import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [TicketModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
