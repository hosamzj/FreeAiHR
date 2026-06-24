-- CreateTable
CREATE TABLE "ContractReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "acknowledgedAt" DATETIME,
    "content" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContractReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "reminderId" TEXT,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "details" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContractReminderRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "recipientTypes" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "templateSubject" TEXT,
    "templateBody" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OnboardingNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onboardingId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "acknowledgedAt" DATETIME,
    "content" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OnboardingDailySummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "summaryDate" DATETIME NOT NULL,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "pendingCount" INTEGER NOT NULL DEFAULT 0,
    "anomalyCount" INTEGER NOT NULL DEFAULT 0,
    "completedList" TEXT NOT NULL DEFAULT '[]',
    "anomalyList" TEXT NOT NULL DEFAULT '[]',
    "pendingList" TEXT NOT NULL DEFAULT '[]',
    "notifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OnboardingNotificationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "triggerCondition" TEXT NOT NULL,
    "recipientTypes" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "templateSubject" TEXT,
    "templateBody" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
