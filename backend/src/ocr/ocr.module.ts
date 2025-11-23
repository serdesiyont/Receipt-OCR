import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrResolver } from './ocr.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OcrResolver, OcrService],
})
export class OcrModule {}
