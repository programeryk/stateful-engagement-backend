-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descritpion" TEXT,
    "type" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "effects" JSONB,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRewards_userId_idx" ON "UserRewards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRewards_userId_rewardId_key" ON "UserRewards"("userId", "rewardId");

-- AddForeignKey
ALTER TABLE "UserRewards" ADD CONSTRAINT "UserRewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRewards" ADD CONSTRAINT "UserRewards_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
