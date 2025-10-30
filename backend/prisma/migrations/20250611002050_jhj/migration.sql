/*
  Warnings:

  - You are about to drop the column `is_complete` on the `goal` table. All the data in the column will be lost.
  - Changed the type of `sender` on the `chat_message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "message_sender" AS ENUM ('USER', 'BOT');

-- AlterTable
ALTER TABLE "calendar_event" ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "chat_message" DROP COLUMN "sender",
ADD COLUMN     "sender" "message_sender" NOT NULL;

-- AlterTable
ALTER TABLE "conversation" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "goal" DROP COLUMN "is_complete",
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "journal" ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "reminder" ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "chat_message_conversation_id_idx" ON "chat_message"("conversation_id");
