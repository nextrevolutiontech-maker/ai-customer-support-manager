import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { SharedModule } from './infrastructure/shared/shared.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { SlaModule } from './modules/sla/sla.module';
import { LiveChatModule } from './modules/livechat/livechat.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ComplaintModule } from './modules/complaint/complaint.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    SharedModule,
    TicketModule,
    SlaModule,
    LiveChatModule,
    KnowledgeModule,
    FeedbackModule,
    ComplaintModule,
    CustomerModule,
    DashboardModule,
    IntegrationsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
