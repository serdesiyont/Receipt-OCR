import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Item } from './item.entity';

@ObjectType()
export class Ocr {
  @Field(() => String)
  id: string;

  @Field(() => String)
  storeName: string;

  @Field(() => Date)
  purchaseDate: Date;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => String)
  imageUrl: string;

  @Field(() => [Item], { nullable: true })
  items: Item[];
}
