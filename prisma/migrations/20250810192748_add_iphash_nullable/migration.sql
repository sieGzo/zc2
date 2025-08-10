/*
  Warnings:

  - You are about to alter the column `ip` on the `Visit` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(45)`.
  - You are about to alter the column `userAgent` on the `Visit` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(120)`.

*/
-- AlterTable
ALTER TABLE "public"."Visit" ADD COLUMN     "ipHash" VARCHAR(64),
ALTER COLUMN "ip" SET DATA TYPE VARCHAR(45),
ALTER COLUMN "userAgent" SET DATA TYPE VARCHAR(120);

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "public"."Visit"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_ipHash_idx" ON "public"."Visit"("ipHash");
