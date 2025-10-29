/*
  Warnings:

  - A unique constraint covering the columns `[user_id,name]` on the table `life_area` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "life_area_user_id_name_key" ON "life_area"("user_id", "name");
