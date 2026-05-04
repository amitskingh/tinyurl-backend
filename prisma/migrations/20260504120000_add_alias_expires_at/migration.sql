-- AlterTable
ALTER TABLE "Alias" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Alias_expiresAt_idx" ON "Alias"("expiresAt");
