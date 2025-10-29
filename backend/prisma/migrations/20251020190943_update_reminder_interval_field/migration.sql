/*
  Warnings:

  - Made the column `interval_in_minutes` on table `reminder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "reminder" ALTER COLUMN "interval_in_minutes" SET NOT NULL;
