/*
  Warnings:

  - You are about to drop the `UserRewards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserRewards" DROP CONSTRAINT "UserRewards_rewardId_fkey";

-- DropForeignKey
ALTER TABLE "UserRewards" DROP CONSTRAINT "UserRewards_userId_fkey";

-- AlterTable
ALTER TABLE "UserState" ADD COLUMN     "streakRun" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "UserRewards";

-- CreateTable
CREATE TABLE "AppliedReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppliedReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppliedReward_userId_idx" ON "AppliedReward"("userId");

-- CreateIndex
CREATE INDEX "AppliedReward_rewardId_idx" ON "AppliedReward"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "AppliedReward_userId_rewardId_key" ON "AppliedReward"("userId", "rewardId");

-- CreateIndex
CREATE INDEX "DailyCheckIn_userId_idx" ON "DailyCheckIn"("userId");

-- AddForeignKey
ALTER TABLE "AppliedReward" ADD CONSTRAINT "AppliedReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedReward" ADD CONSTRAINT "AppliedReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
