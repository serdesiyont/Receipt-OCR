import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Item {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  quantity: number;
}
