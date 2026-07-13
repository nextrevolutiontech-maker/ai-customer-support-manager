import { Controller, Get } from '@nestjs/common';
import { SlaService } from './sla.service';

@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get('violations')
  async getViolations() {
    return this.slaService.getViolations();
  }

  @Get('policies')
  async getPolicies() {
    return this.slaService.getPolicies();
  }
}
