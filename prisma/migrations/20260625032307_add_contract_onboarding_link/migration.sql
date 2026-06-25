-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "onboardingId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Onboarding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "employeeId" TEXT,
    "contractId" TEXT,
    "managerId" TEXT,
    "mentorId" TEXT,
    "startDate" DATETIME NOT NULL,
    "onboardingDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tasks" TEXT NOT NULL DEFAULT '[]',
    "itReady" BOOLEAN NOT NULL DEFAULT false,
    "adminReady" BOOLEAN NOT NULL DEFAULT false,
    "trainingReady" BOOLEAN NOT NULL DEFAULT false,
    "teamReady" BOOLEAN NOT NULL DEFAULT false,
    "itAccountReady" BOOLEAN NOT NULL DEFAULT false,
    "equipmentReady" BOOLEAN NOT NULL DEFAULT false,
    "trainingScheduled" BOOLEAN NOT NULL DEFAULT false,
    "introductionDone" BOOLEAN NOT NULL DEFAULT false,
    "day7FollowUp" BOOLEAN NOT NULL DEFAULT false,
    "day7FollowUpAt" DATETIME,
    "day30FollowUp" BOOLEAN NOT NULL DEFAULT false,
    "day30FollowUpAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Onboarding" ("adminReady", "candidateId", "createdAt", "day30FollowUp", "day30FollowUpAt", "day7FollowUp", "day7FollowUpAt", "department", "employeeName", "id", "itReady", "managerId", "mentorId", "notes", "position", "startDate", "status", "tasks", "teamReady", "trainingReady", "updatedAt") SELECT "adminReady", "candidateId", "createdAt", "day30FollowUp", "day30FollowUpAt", "day7FollowUp", "day7FollowUpAt", "department", "employeeName", "id", "itReady", "managerId", "mentorId", "notes", "position", "startDate", "status", "tasks", "teamReady", "trainingReady", "updatedAt" FROM "Onboarding";
DROP TABLE "Onboarding";
ALTER TABLE "new_Onboarding" RENAME TO "Onboarding";
CREATE UNIQUE INDEX "Onboarding_candidateId_key" ON "Onboarding"("candidateId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
