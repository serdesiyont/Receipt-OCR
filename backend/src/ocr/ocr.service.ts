import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOcrInput } from './dto/create-ocr.input';
import { UpdateOcrInput } from './dto/update-ocr.input';
import { PrismaService } from '../prisma/prisma.service';
import { Receipt } from 'generated/prisma/client';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import * as sharp from 'sharp';

@Injectable()
export class OcrService {
  constructor(private prisma: PrismaService) {}

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

    const stream = image.createReadStream();

    // Validate image resolution
    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk as Buffer));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    const imageMetadata = await ((sharp as any)(imageBuffer)).metadata();
    if (imageMetadata.width < 480) {
      throw new BadRequestException('Image width must be at least 480px.');
    }

    // Save the file
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
      writeStream.end(imageBuffer);
    });

    // Mock data extraction (OCR simulation)
    const mockData = {
      storeName: 'Mock Store',
      purchaseDate: new Date(),
      totalAmount: 100.5,
      items: [
        { name: 'Item 1', quantity: 2 },
        { name: 'Item 2', quantity: 1 },
      ],
    };

    // Save to PostgreSQL via Prisma
    const receipt = await this.prisma.receipt.create({
      data: {
        storeName: mockData.storeName,
        purchaseDate: mockData.purchaseDate,
        totalAmount: mockData.totalAmount,
        imageUrl: filePath, // Use the local file path
        items: {
          create: mockData.items,
        },
      },
      include: {
        items: true,
      },
    });

    return receipt;
  }

  async findAll(): Promise<Receipt[]> {
    return await this.prisma.receipt.findMany({ include: { items: true } });
  }

  async findOne(id: string) {
    return await this.prisma.receipt.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  update(id: string, updateOcrInput: UpdateOcrInput) {
    return `This action updates a #${id} ocr with ${JSON.stringify(updateOcrInput)}`;
  }
}
