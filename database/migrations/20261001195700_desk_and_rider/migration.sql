-- CreateEnum
CREATE TYPE "ResourceKind" AS ENUM ('CHAIR', 'ROOM');

-- CreateEnum
CREATE TYPE "PayMethod" AS ENUM ('CASH', 'CARD', 'CERTIFICATE', 'ABONEMENT', 'BONUS', 'TRANSFER');

-- CreateEnum
CREATE TYPE "LedgerKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "RiderQuestionType" AS ENUM ('TEXT', 'LONG', 'PHONE', 'EMAIL', 'NUMBER', 'DATE', 'CHOICE', 'MULTI', 'LIST', 'YESNO');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "prepaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "seats" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "resourceId" TEXT;

-- AlterTable
ALTER TABLE "SalonClient" ADD COLUMN "consentData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "consentAds" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "bonusBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "referralCode" TEXT;

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ResourceKind" NOT NULL DEFAULT 'CHAIR',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPhoto" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "price" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMove" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyAccount" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "MoneyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" "LedgerKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "clientId" TEXT,
    "total" INTEGER NOT NULL,
    "tip" INTEGER NOT NULL DEFAULT 0,
    "method" "PayMethod" NOT NULL,
    "receipt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleLine" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "productId" TEXT,

    CONSTRAINT "SaleLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollScheme" (
    "id" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "percent" INTEGER NOT NULL DEFAULT 40,
    "fixed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PayrollScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "buyerName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbonementPlan" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visits" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 90,

    CONSTRAINT "AbonementPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abonement" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "visitsLeft" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Abonement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMessage" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonDesk" (
    "salonId" TEXT NOT NULL,
    "yandexUrl" TEXT,
    "googleUrl" TEXT,
    "sip" TEXT,
    "bonusPercent" INTEGER NOT NULL DEFAULT 5,
    "referralBonus" INTEGER NOT NULL DEFAULT 300,
    "channels" TEXT[],

    CONSTRAINT "SalonDesk_pkey" PRIMARY KEY ("salonId")
);

-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "design" TEXT NOT NULL DEFAULT 'paper',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "customBg" TEXT,
    "customInk" TEXT,
    "customAccent" TEXT,
    "customRadius" INTEGER NOT NULL DEFAULT 28,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderQuestion" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "help" TEXT,
    "type" "RiderQuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[],
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RiderQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderAnswer" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "payload" JSONB NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalonClient_referralCode_key" ON "SalonClient"("referralCode");

-- CreateIndex
CREATE INDEX "Booking_resourceId_idx" ON "Booking"("resourceId");

-- CreateIndex
CREATE INDEX "Resource_salonId_idx" ON "Resource"("salonId");

-- CreateIndex
CREATE INDEX "ClientPhoto_clientId_idx" ON "ClientPhoto"("clientId");

-- CreateIndex
CREATE INDEX "Product_salonId_idx" ON "Product"("salonId");

-- CreateIndex
CREATE INDEX "StockMove_productId_idx" ON "StockMove"("productId");

-- CreateIndex
CREATE INDEX "MoneyAccount_salonId_idx" ON "MoneyAccount"("salonId");

-- CreateIndex
CREATE INDEX "LedgerEntry_salonId_createdAt_idx" ON "LedgerEntry"("salonId", "createdAt");

-- CreateIndex
CREATE INDEX "Sale_salonId_createdAt_idx" ON "Sale"("salonId", "createdAt");

-- CreateIndex
CREATE INDEX "SaleLine_saleId_idx" ON "SaleLine"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollScheme_masterId_key" ON "PayrollScheme"("masterId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_code_key" ON "Certificate"("code");

-- CreateIndex
CREATE INDEX "Certificate_salonId_idx" ON "Certificate"("salonId");

-- CreateIndex
CREATE INDEX "AbonementPlan_salonId_idx" ON "AbonementPlan"("salonId");

-- CreateIndex
CREATE INDEX "Abonement_clientId_idx" ON "Abonement"("clientId");

-- CreateIndex
CREATE INDEX "StaffMessage_salonId_createdAt_idx" ON "StaffMessage"("salonId", "createdAt");

-- CreateIndex
CREATE INDEX "CallLog_salonId_createdAt_idx" ON "CallLog"("salonId", "createdAt");

-- CreateIndex
CREATE INDEX "Outbox_salonId_createdAt_idx" ON "Outbox"("salonId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_slug_key" ON "Rider"("slug");

-- CreateIndex
CREATE INDEX "Rider_salonId_idx" ON "Rider"("salonId");

-- CreateIndex
CREATE INDEX "RiderQuestion_riderId_sort_idx" ON "RiderQuestion"("riderId", "sort");

-- CreateIndex
CREATE INDEX "RiderAnswer_riderId_createdAt_idx" ON "RiderAnswer"("riderId", "createdAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPhoto" ADD CONSTRAINT "ClientPhoto_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "SalonClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMove" ADD CONSTRAINT "StockMove_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyAccount" ADD CONSTRAINT "MoneyAccount_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MoneyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "SalonClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleLine" ADD CONSTRAINT "SaleLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollScheme" ADD CONSTRAINT "PayrollScheme_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonementPlan" ADD CONSTRAINT "AbonementPlan_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abonement" ADD CONSTRAINT "Abonement_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AbonementPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abonement" ADD CONSTRAINT "Abonement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "SalonClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMessage" ADD CONSTRAINT "StaffMessage_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMessage" ADD CONSTRAINT "StaffMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonDesk" ADD CONSTRAINT "SalonDesk_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderQuestion" ADD CONSTRAINT "RiderQuestion_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderAnswer" ADD CONSTRAINT "RiderAnswer_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
