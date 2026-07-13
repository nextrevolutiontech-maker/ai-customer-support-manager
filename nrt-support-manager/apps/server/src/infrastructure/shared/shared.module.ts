import { Module, Global } from '@nestjs/common';
import { OutboundDispatcherService } from '../../modules/integrations/outbound-dispatcher.service';

@Global()
@Module({
  providers: [OutboundDispatcherService],
  exports: [OutboundDispatcherService],
})
export class SharedModule {}
