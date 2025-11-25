-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_receiptID_fkey";

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_receiptID_fkey" FOREIGN KEY ("receiptID") REFERENCES "public"."Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
