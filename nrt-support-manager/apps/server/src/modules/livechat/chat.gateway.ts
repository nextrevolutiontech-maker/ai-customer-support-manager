import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { OutboundDispatcherService } from '../integrations/outbound-dispatcher.service';
import { Logger } from '@nestjs/common';

interface SendMessagePayload {
  ticketId: string;
  senderId: string;
  senderRole: 'AGENT' | 'CUSTOMER';
  body: string;
  channel: 'LIVE_CHAT' | 'WHATSAPP' | 'EMAIL';
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboundDispatcher: OutboundDispatcherService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() ticketId: string, @ConnectedSocket() client: Socket) {
    client.join(ticketId);
    this.logger.log(`Client ${client.id} joined room ${ticketId}`);
    client.emit('joinedRoom', ticketId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Received message: ${JSON.stringify(payload)}`);

    const { ticketId, senderId, senderRole, body, channel } = payload;

    // 1. Save message to database
    const direction = senderRole === 'CUSTOMER' ? 'INBOUND' : 'OUTBOUND';
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

    // 2. Broadcast the message to all clients in the room
    this.server.to(ticketId).emit('message', message);

    // 3. Update the ticket's updatedAt timestamp
    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
      include: {
        customer: {
          include: { user: true },
        },
      },
    });

    // 4. Trigger Outbound API call if reply is sent by Support Agent
    if (senderRole === 'AGENT') {
      if (channel === 'WHATSAPP' && ticket.customer?.phoneNumber) {
        await this.outboundDispatcher.sendWhatsApp(ticket.customer.phoneNumber, body);
      } else if (channel === 'EMAIL' && ticket.customer?.user?.email) {
        await this.outboundDispatcher.sendEmail(
          ticket.customer.user.email,
          `Re: [Ticket #${ticket.id.slice(0, 8)}] ${ticket.title}`,
          body,
        );
      }
    }

    this.logger.log(`Broadcasted and dispatched message for room ${ticketId}`);
  }
}
