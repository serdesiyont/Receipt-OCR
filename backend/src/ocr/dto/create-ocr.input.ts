import { InputType, Field } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload';

@InputType()
export class CreateOcrInput {
  @Field(() => GraphQLUpload, { description: 'Receipt image file' })
  image: Promise<FileUpload>;
}
