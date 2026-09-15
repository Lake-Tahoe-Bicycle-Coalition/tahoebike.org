-- CreateEnum
CREATE TYPE "Program" AS ENUM ('BIKE_KITCHEN', 'BIKE_VALET', 'OTHER');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('CONTACT', 'VALET_REQUEST', 'RACK_APPLICATION');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "program" "Program" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "locationName" TEXT,
    "address" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "registrationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isAdvisor" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formType" "FormType" NOT NULL,
    "payload" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_program_endsAt_idx" ON "Event"("program", "endsAt");

-- CreateIndex
CREATE INDEX "BoardMember_isActive_isAdvisor_sortOrder_idx" ON "BoardMember"("isActive", "isAdvisor", "sortOrder");

-- CreateIndex
CREATE INDEX "HomepageCard_isActive_sortOrder_idx" ON "HomepageCard"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Announcement_startsAt_endsAt_idx" ON "Announcement"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "FormSubmission_formType_status_submittedAt_idx" ON "FormSubmission"("formType", "status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
