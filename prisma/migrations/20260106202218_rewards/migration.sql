/*
  Warnings:

  - You are about to drop the column `descritpion` on the `Reward` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reward" DROP COLUMN "descritpion",
ADD COLUMN     "description" TEXT;
