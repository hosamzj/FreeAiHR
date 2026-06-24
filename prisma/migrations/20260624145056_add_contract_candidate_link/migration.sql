-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'regular',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_sign',
    "candidateId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'recruitment',
    "renewInitiatedBy" TEXT,
    "renewInitiatedAt" DATETIME,
    "renewApprovedBy" TEXT,
    "renewApprovedAt" DATETIME,
    "renewExecutedBy" TEXT,
    "renewExecutedAt" DATETIME,
    "renewNotes" TEXT,
    "reminderSent90" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent60" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent30" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent7" BOOLEAN NOT NULL DEFAULT false,
    "previousContractId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Contract" ("contractType", "createdAt", "department", "employeeId", "employeeName", "endDate", "id", "position", "previousContractId", "reminderSent30", "reminderSent60", "reminderSent7", "reminderSent90", "renewApprovedAt", "renewApprovedBy", "renewExecutedAt", "renewExecutedBy", "renewInitiatedAt", "renewInitiatedBy", "renewNotes", "startDate", "status", "updatedAt") SELECT "contractType", "createdAt", "department", "employeeId", "employeeName", "endDate", "id", "position", "previousContractId", "reminderSent30", "reminderSent60", "reminderSent7", "reminderSent90", "renewApprovedAt", "renewApprovedBy", "renewExecutedAt", "renewExecutedBy", "renewInitiatedAt", "renewInitiatedBy", "renewNotes", "startDate", "status", "updatedAt" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
