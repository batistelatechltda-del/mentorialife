-- AlterTable
ALTER TABLE "life_area" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "life_area_sub_goal" ADD COLUMN     "chat_message_id" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "due_date" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "life_area_sub_goal" ADD CONSTRAINT "life_area_sub_goal_chat_message_id_fkey" FOREIGN KEY ("chat_message_id") REFERENCES "chat_message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
