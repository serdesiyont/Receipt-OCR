import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueProcessor } from './queue.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ocr',
    }),
    PrismaModule,
  ],
  providers: [QueueProcessor],
})
export class QueueModule {}
