import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { createWorker } from 'tesseract.js';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { join } from 'path';
import { mkdir } from 'fs/promises';

@Processor('ocr', { concurrency: 5 })
export class QueueProcessor
  extends WorkerHost
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(QueueProcessor.name);
  private readonly cachePath = join(process.cwd(), 'tessdata');
  private workerPool: any[] = [];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async onModuleInit() {
    this.logger.log('Initializing Tesseract worker pool...');
    await mkdir(this.cachePath, { recursive: true });

    // Initialize workers sequentially to avoid race conditions on initial download
    // and to have them ready for processing.
    for (let i = 0; i < 5; i++) {
      try {
        const worker = await createWorker('eng', 1, {
          cachePath: this.cachePath,
        });
        this.workerPool.push(worker);
        this.logger.log(`Worker ${i + 1} initialized`);
      } catch (error) {
        this.logger.error(`Failed to initialize worker ${i + 1}`, error);
      }
    }

    if (this.workerPool.length === 0) {
      this.logger.error('No workers initialized. OCR will fail.');
    } else {
      this.logger.log(
        `Tesseract worker pool initialized with ${this.workerPool.length} workers.`,
      );
    }
  }

  async onModuleDestroy() {
    for (const worker of this.workerPool) {
      await worker.terminate();
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing job ${job.id} for receipt ${job.data.receiptId}`,
    );
    const { receiptId, filePath } = job.data;

    const worker = this.workerPool.pop();
    if (!worker) {
      throw new Error('No OCR workers available');
    }

    try {
      const ret = await worker.recognize(filePath);
      const extractedText = ret.data.text;
      this.logger.log(`OCR completed for job ${job.id}`);

      // Basic parsing of the extracted text.
      // This is a simple example and would need to be made more robust.
      const lines = extractedText.split('\n');
      const storeName = lines[0] || 'Unknown Store';
      const totalAmountMatch = extractedText.match(/Total\s+([\d.]+)/);
      const totalAmount = totalAmountMatch
        ? parseFloat(totalAmountMatch[1])
        : 0;

      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: {
          storeName,
          totalAmount,
          status: 'COMPLETED',
          // You would also parse and create the items here
        },
      });
      this.logger.log(`Receipt ${receiptId} updated successfully`);
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}`, error.stack);
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: {
          status: 'FAILED',
        },
      });
      throw error;
    } finally {
      if (worker) {
        this.workerPool.push(worker);
      }
    }
  }
}
