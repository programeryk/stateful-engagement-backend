/*
  Warnings:

  - You are about to drop the `Entity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EntityState` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Entity" DROP CONSTRAINT "Entity_userId_fkey";

-- DropForeignKey
ALTER TABLE "EntityState" DROP CONSTRAINT "EntityState_entityId_fkey";

-- DropTable
DROP TABLE "Entity";

-- DropTable
DROP TABLE "EntityState";
