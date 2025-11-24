import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Item } from './item.entity';
import { isNullableType } from 'graphql';

@ObjectType()
export class Ocr {
  @Field(() => String)
  id: string;

  @Field(() => String)
  storeName: string;

  @Field(() => Date, { nullable: true })
  purchaseDate: Date;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => String)
  imageUrl: string;

  @Field(() => [Item], { nullable: true })
  items: Item[];

  @Field(() => String)
  status: string;
}
