import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class Item {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  quantity: number;

  @Field(() => Float, { nullable: true })
  price: number;
}
