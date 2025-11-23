import { CreateOcrInput } from './create-ocr.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateOcrInput extends PartialType(CreateOcrInput) {
  @Field(() => String)
  id: string;
}
