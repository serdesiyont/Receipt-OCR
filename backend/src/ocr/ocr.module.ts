import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrResolver } from './ocr.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'ocr',
    }),
  ],
  providers: [OcrResolver, OcrService],
})
export class OcrModule {}
