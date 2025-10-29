/*
  Warnings:

  - You are about to drop the column `first_name` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profile" DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "phone_number",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "mentor_name" TEXT;

-- AlterTable
ALTER TABLE "verification" ADD COLUMN     "full_name" TEXT;
