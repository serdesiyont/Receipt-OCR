import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOcrInput } from './dto/create-ocr.input';
import { UpdateOcrInput } from './dto/update-ocr.input';
import { PrismaService } from '../prisma/prisma.service';
import { Receipt } from 'generated/prisma/client';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { basename, join } from 'path';
import * as sharp from 'sharp';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OcrService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('ocr') private ocrQueue: Queue,
  ) {}

  private toPublicImageUrl(source: string): string {
    if (!source) {
      return '';
    }

    if (source.startsWith('/uploads/')) {
      return source;
    }

    if (source.startsWith('http://') || source.startsWith('https://')) {
      return source;
    }

    const filename = basename(source);
    return `/uploads/${filename}`;
  }

  async create(createOcrInput: CreateOcrInput) {
    const image = await createOcrInput.image;
    const { filename, mimetype } = image;

    // Validate image type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(mimetype)) {
      throw new BadRequestException(
        'Invalid image type. Only JPEG and PNG are allowed.',
      );
    }

    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    const publicUrl = this.toPublicImageUrl(filename);

    const stream = image.createReadStream();

    // Validate image resolution
    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk as Buffer));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    const imageMetadata = await (sharp as any)(imageBuffer).metadata();
    if (imageMetadata.width < 480 || imageMetadata.height < 480) {
      throw new BadRequestException(
        'Image width and height must be at least 480px.',
      );
    }

    // Save the file
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
      writeStream.end(imageBuffer);
    });

    //Save to PostgreSQL via Prisma
    const receipt = await this.prisma.receipt.create({
      data: {
        storeName: 'Processing...',
        purchaseDate: null,
        totalAmount: 0,
        imageUrl: publicUrl,
        status: 'PENDING',
      },
      include: {
        items: true,
      },
    });

    await this.ocrQueue.add('process_receipt', {
      receiptId: receipt.id,
      filePath,
    });

    return receipt;
  }

  async findAll(): Promise<Receipt[]> {
    const receipts = await this.prisma.receipt.findMany({
      include: { items: true },
    });

    return receipts.map((receipt) => ({
      ...receipt,
      imageUrl: this.toPublicImageUrl(receipt.imageUrl),
    }));
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!receipt) {
      return receipt;
    }

    return {
      ...receipt,
      imageUrl: this.toPublicImageUrl(receipt.imageUrl),
    };
  }

  update(id: string, updateOcrInput: UpdateOcrInput) {
    return `This action updates a #${id} ocr with ${JSON.stringify(updateOcrInput)}`;
  }
}
