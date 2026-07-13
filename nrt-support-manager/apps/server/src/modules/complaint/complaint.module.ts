import { Module } from '@nestjs/common';
import { ComplaintController } from './complaint.controller';

@Module({
  controllers: [ComplaintController],
})
export class ComplaintModule {}
