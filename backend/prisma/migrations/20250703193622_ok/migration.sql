/*
  Warnings:

  - You are about to drop the column `sub_goals` on the `life_area` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "life_area" DROP COLUMN "sub_goals";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "is_notification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "push_notification" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "push_subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_area_sub_goal" (
    "id" TEXT NOT NULL,
    "life_area_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_area_sub_goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscription_user_id_key" ON "push_subscription"("user_id");

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_area_sub_goal" ADD CONSTRAINT "life_area_sub_goal_life_area_id_fkey" FOREIGN KEY ("life_area_id") REFERENCES "life_area"("id") ON DELETE CASCADE ON UPDATE CASCADE;
