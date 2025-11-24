import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { createWorker } from 'tesseract.js';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ParsedReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ParsedReceipt {
  storeName: string;
  purchaseDate: string | null;
  totalAmount: number;
  items: ParsedReceiptItem[];
}

@Processor('ocr', { concurrency: 5 })
export class QueueProcessor
  extends WorkerHost
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(QueueProcessor.name);
  private readonly cachePath = join(process.cwd(), 'tessdata');
  private workerPool: any[] = [];
  private readonly gemini = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY ?? '',
  );

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
      const extractedText: string = String(ret.data.text ?? '');
      this.logger.log(`OCR completed for job ${job.id}`);

      // Use Gemini to parse the extracted text into structured data
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });

      const prompt = `You are a receipt parsing assistant.
Given the OCR text of a shopping receipt, extract the following information as JSON:
{
  "storeName": string,
  "purchaseDate": string | null, // ISO 8601, or null if unknown
  "totalAmount": number,
  "items": Array<{
    "name": string,
    "quantity": number,
    "price": number
  }>
}

Rules:
- If you are not sure about purchaseDate, set it to null.
- totalAmount should be the final amount paid.
- items should only contain individual purchased items, not totals or taxes.
- Return ONLY valid JSON, with no markdown, comments, or extra text.

Here is the OCR text:
"""
${extractedText}
"""`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text();

      // Strip possible markdown code fences like ```json ... ```
      const cleanedText = rawText
        .replace(/^```[a-zA-Z]*\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      let parsed: ParsedReceipt;
      try {
        const json = JSON.parse(cleanedText) as Partial<ParsedReceipt>;

        parsed = {
          storeName: json.storeName ?? 'Unknown Store',
          purchaseDate: json.purchaseDate ?? null,
          totalAmount:
            typeof json.totalAmount === 'number' ? json.totalAmount : 0,
          items: Array.isArray(json.items)
            ? (json.items as ParsedReceiptItem[])
            : [],
        };
      } catch (parseError) {
        this.logger.error(
          `Failed to parse Gemini response as JSON for job ${job.id}: ${cleanedText}`,
        );
        throw parseError;
      }

      const storeName: string = parsed.storeName || 'Unknown Store';
      const totalAmount: number = parsed.totalAmount;

      const purchaseDate: Date | null = parsed.purchaseDate
        ? new Date(parsed.purchaseDate)
        : null;

      const items: ParsedReceiptItem[] = parsed.items
        .filter(
          (item) => item && typeof item.name === 'string' && item.name.trim(),
        )
        .map((item) => ({
          name: String(item.name).trim(),
          quantity:
            typeof item.quantity === 'number' && item.quantity > 0
              ? item.quantity
              : 1,
          price:
            typeof item.price === 'number' && item.price >= 0 ? item.price : 0,
        }));

      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: {
          storeName,
          totalAmount,
          purchaseDate,
          status: 'COMPLETED',
          items: {
            create: items,
          },
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
