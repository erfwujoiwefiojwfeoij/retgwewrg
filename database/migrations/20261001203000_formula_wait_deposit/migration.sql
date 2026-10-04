-- AlterEnum
ALTER TYPE "PayMethod" ADD VALUE 'DEPOSIT';

-- CreateEnum
CREATE TYPE "WaitStatus" AS ENUM ('WAITING', 'OFFERED', 'DONE', 'DROPPED');

-- AlterTable
ALTER TABLE "SalonClient" ADD COLUMN "deposit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "source" TEXT,
ADD COLUMN "returnWeeks" INTEGER;

-- CreateTable
CREATE TABLE "VisitFormula" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitEntry" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "wishDate" DATE,
    "note" TEXT,
    "status" "WaitStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonClosure" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,

    CONSTRAINT "SalonClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisitFormula_clientId_createdAt_idx" ON "VisitFormula"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "WaitEntry_salonId_status_idx" ON "WaitEntry"("salonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalonClosure_salonId_date_key" ON "SalonClosure"("salonId", "date");

-- AddForeignKey
ALTER TABLE "VisitFormula" ADD CONSTRAINT "VisitFormula_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "SalonClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitEntry" ADD CONSTRAINT "WaitEntry_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonClosure" ADD CONSTRAINT "SalonClosure_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
