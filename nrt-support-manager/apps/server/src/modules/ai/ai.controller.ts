import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('classify')
  async classify(@Body('title') title: string, @Body('description') description: string) {
    return this.aiService.classifyTicket(title, description);
  }

  @Get('suggest-reply/:ticketId')
  async suggestReply(@Param('ticketId') ticketId: string) {
    const reply = await this.aiService.getSuggestedReply(ticketId);
    return { reply };
  }

  @Get('summary/:ticketId')
  async summary(@Param('ticketId') ticketId: string) {
    const summary = await this.aiService.generateSummary(ticketId);
    return { summary };
  }

  @Post('chatbot')
  async chatbot(@Body('message') message: string) {
    return this.aiService.getChatbotResponse(message);
  }
}
