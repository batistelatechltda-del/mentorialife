-- AlterTable
ALTER TABLE "calendar_event" ADD COLUMN     "is_email_sent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "goal" ADD COLUMN     "is_email_sent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "journal" ADD COLUMN     "is_email_sent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "reminder" ADD COLUMN     "is_email_sent" BOOLEAN NOT NULL DEFAULT false;
