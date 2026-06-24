-- CreateTable
CREATE TABLE "PositionTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "skillsWeight" TEXT NOT NULL DEFAULT '{}',
    "experienceWeight" TEXT NOT NULL DEFAULT '{}',
    "cultureWeight" TEXT NOT NULL DEFAULT '{}',
    "industry" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interviewId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "technicalScore" INTEGER,
    "communicationScore" INTEGER,
    "problemSolvingScore" INTEGER,
    "teamworkScore" INTEGER,
    "cultureScore" INTEGER,
    "overallScore" INTEGER,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "concerns" TEXT,
    "recommendation" TEXT,
    "comments" TEXT,
    "aiSummary" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CandidatePool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "poolTags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "lastContactAt" DATETIME,
    "lastContactType" TEXT,
    "contactHistory" TEXT NOT NULL DEFAULT '[]',
    "skillTags" TEXT NOT NULL DEFAULT '[]',
    "expectedSalary" TEXT,
    "location" TEXT,
    "yearsExp" INTEGER,
    "education" TEXT,
    "recommendedFor" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScreeningQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "positionId" TEXT,
    "question" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "answer" TEXT,
    "answerScore" INTEGER,
    "aiEvaluation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InterviewPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interviewId" TEXT NOT NULL,
    "candidateSummary" TEXT,
    "aiProfile" TEXT,
    "suggestedQuestions" TEXT,
    "riskPoints" TEXT,
    "scoringRubric" TEXT,
    "interviewerNotes" TEXT,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'regular',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
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

-- CreateTable
CREATE TABLE "Onboarding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "managerId" TEXT,
    "mentorId" TEXT,
    "startDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tasks" TEXT NOT NULL DEFAULT '[]',
    "itReady" BOOLEAN NOT NULL DEFAULT false,
    "adminReady" BOOLEAN NOT NULL DEFAULT false,
    "trainingReady" BOOLEAN NOT NULL DEFAULT false,
    "teamReady" BOOLEAN NOT NULL DEFAULT false,
    "day7FollowUp" BOOLEAN NOT NULL DEFAULT false,
    "day7FollowUpAt" DATETIME,
    "day30FollowUp" BOOLEAN NOT NULL DEFAULT false,
    "day30FollowUpAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OnboardingTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onboardingId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewFeedback_interviewId_evaluatorId_round_key" ON "InterviewFeedback"("interviewId", "evaluatorId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePool_candidateId_key" ON "CandidatePool"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewPackage_interviewId_key" ON "InterviewPackage"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Onboarding_candidateId_key" ON "Onboarding"("candidateId");
