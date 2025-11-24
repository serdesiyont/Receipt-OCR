import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { OcrService } from './ocr.service';
import { Ocr } from './entities/ocr.entity';
import { CreateOcrInput } from './dto/create-ocr.input';
import { UpdateOcrInput } from './dto/update-ocr.input';

@Resolver(() => Ocr)
export class OcrResolver {
  constructor(private readonly ocrService: OcrService) {}

  @Mutation(() => Ocr)
  createOcr(@Args('createOcrInput') createOcrInput: CreateOcrInput) {
    return this.ocrService.create(createOcrInput);
  }

  @Query(() => [Ocr], { name: 'receipts' })
  findAll() {
    return this.ocrService.findAll();
  }

  @Query(() => Ocr, { name: 'receipt' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.ocrService.findOne(id);
  }

  @Mutation(() => Ocr)
  updateOcr(@Args('updateOcrInput') updateOcrInput: UpdateOcrInput) {
    return this.ocrService.update(updateOcrInput.id, updateOcrInput);
  }

  // @Mutation(() => Ocr)
  // removeOcr(@Args('id', { type: () => String }) id: string) {
  //   return this.ocrService.remove(id); // This also needs update in service if I change it there
  // }
}
