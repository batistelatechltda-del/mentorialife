-- AlterTable
ALTER TABLE "goal" ADD COLUMN     "sub_goal_id" TEXT;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_sub_goal_id_fkey" FOREIGN KEY ("sub_goal_id") REFERENCES "life_area_sub_goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
