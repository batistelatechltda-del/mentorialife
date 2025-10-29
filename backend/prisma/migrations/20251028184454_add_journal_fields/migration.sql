-- AlterTable
ALTER TABLE "journal" ADD COLUMN     "category" TEXT,
ADD COLUMN     "emoji" TEXT,
ADD COLUMN     "favorite" BOOLEAN NOT NULL DEFAULT false;
