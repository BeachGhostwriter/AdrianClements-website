-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER', 'VIEWER');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('OPS', 'REG', 'TECH', 'FIN', 'STR', 'REP', 'ENV', 'HR', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MONITOR');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('ACTIVE', 'MONITORING', 'MITIGATED', 'CLOSED', 'TRANSFERRED_TO_FORGE');

-- CreateEnum
CREATE TYPE "CrisisStatus" AS ENUM ('ACTIVE', 'CONTAINMENT', 'STABILISATION', 'RECOVERY', 'RESILIENCE', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "group" TEXT,
    "region" TEXT,
    "segment" TEXT,
    "subsegment" TEXT,
    "countryCode" TEXT,
    "consolidationStatus" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessUnitMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "isCEO" BOOLEAN NOT NULL DEFAULT false,
    "isRiskCoordinator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessUnitMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calibration" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "reportingPeriod" TEXT,
    "timeHorizon" TEXT,
    "vMax" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "psiC" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "beta" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "gamma" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "alpha" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "delta" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "ttsHorizon" DOUBLE PRECISION NOT NULL DEFAULT 16.67,
    "kappaCoh" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "alphaWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "asymmetryFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.4,
    "orgSize" TEXT,
    "sector" TEXT,
    "riskMaturity" TEXT,
    "ceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "tcWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "rcWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "srWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parameters" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "ceoName" TEXT,
    "riskCoordinator" TEXT,
    "reportingPeriod" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" INTEGER,
    "targetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "ownerId" TEXT,
    "riskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "RiskCategory" NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "impactEur" DOUBLE PRECISION NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL,
    "amplification" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "accelerationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "propagationRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "impactScore" DOUBLE PRECISION,
    "expectedLoss" DOUBLE PRECISION,
    "lorentzFactor" DOUBLE PRECISION,
    "ttsMonths" DOUBLE PRECISION,
    "phaseProximity" DOUBLE PRECISION,
    "cohFactor" DOUBLE PRECISION,
    "ewTts" DOUBLE PRECISION,
    "ewTtsLorentz" DOUBLE PRECISION,
    "phaseIndex" DOUBLE PRECISION,
    "freedomIndex" DOUBLE PRECISION,
    "entropyS" DOUBLE PRECISION,
    "entropyRatio" DOUBLE PRECISION,
    "urgencyIndex" DOUBLE PRECISION,
    "palmerNoise" DOUBLE PRECISION,
    "mcP10" DOUBLE PRECISION,
    "mcP50" DOUBLE PRECISION,
    "mcP90" DOUBLE PRECISION,
    "priority" "RiskPriority",
    "signalStrength" DOUBLE PRECISION,
    "detectionConf" DOUBLE PRECISION,
    "status" "RiskStatus" NOT NULL DEFAULT 'ACTIVE',
    "isTop10" BOOLEAN NOT NULL DEFAULT false,
    "isLongTerm" BOOLEAN NOT NULL DEFAULT false,
    "horizon" TEXT,
    "notes" TEXT,
    "reportingPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskObjective" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "impact" TEXT,

    CONSTRAINT "RiskObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskInteraction" (
    "id" TEXT NOT NULL,
    "sourceRiskId" TEXT NOT NULL,
    "targetRiskId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "direction" TEXT NOT NULL DEFAULT 'unidirectional',

    CONSTRAINT "RiskInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskCorrelation" (
    "id" TEXT NOT NULL,
    "riskAId" TEXT NOT NULL,
    "riskBId" TEXT NOT NULL,
    "rho" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RiskCorrelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskControl" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "strength" DOUBLE PRECISION NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL,
    "controlType" TEXT,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ownership" TEXT,
    "limits" BOOLEAN NOT NULL DEFAULT false,
    "assessment" BOOLEAN NOT NULL DEFAULT false,
    "assurance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskTrajectory" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "tConf" DOUBLE PRECISION NOT NULL,
    "xConf" DOUBLE PRECISION NOT NULL,
    "impactEur" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RISK',
    "boundary" TEXT,
    "tRaw" DOUBLE PRECISION,
    "prob" DOUBLE PRECISION,
    "impactScore" DOUBLE PRECISION,
    "phaseProx" DOUBLE PRECISION,
    "ewTts" DOUBLE PRECISION,
    "phaseIdx" DOUBLE PRECISION,

    CONSTRAINT "RiskTrajectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crisis" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "ownerId" TEXT,
    "crisisId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "RiskCategory" NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "impactEur" DOUBLE PRECISION NOT NULL,
    "velocity" DOUBLE PRECISION NOT NULL,
    "amplification" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "accelerationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "propagationRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "severity" DOUBLE PRECISION NOT NULL,
    "decisionQuality" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "rTts" DOUBLE PRECISION,
    "residualEur" DOUBLE PRECISION,
    "residualScore" DOUBLE PRECISION,
    "responseEffectiveness" DOUBLE PRECISION,
    "resourceFactor" DOUBLE PRECISION,
    "containmentIndex" DOUBLE PRECISION,
    "rTtsMonths" DOUBLE PRECISION,
    "recoveryMonths" DOUBLE PRECISION,
    "recoveryDays" DOUBLE PRECISION,
    "urgencyIndex" DOUBLE PRECISION,
    "urgencyClass" TEXT,
    "palmerNoise" DOUBLE PRECISION,
    "mcRLow" DOUBLE PRECISION,
    "mcRMid" DOUBLE PRECISION,
    "mcRHigh" DOUBLE PRECISION,
    "mitigROI" DOUBLE PRECISION,
    "backcast25" DOUBLE PRECISION,
    "backcast50" DOUBLE PRECISION,
    "backcast75" DOUBLE PRECISION,
    "backcast95" DOUBLE PRECISION,
    "status" "CrisisStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "reportingPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crisis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisTrajectory" (
    "id" TEXT NOT NULL,
    "crisisId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "tConf" DOUBLE PRECISION NOT NULL,
    "xConf" DOUBLE PRECISION NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "impactEur" DOUBLE PRECISION NOT NULL,
    "impactScore" DOUBLE PRECISION,
    "responseEff" DOUBLE PRECISION,
    "residualEur" DOUBLE PRECISION,
    "residualScore" DOUBLE PRECISION,
    "boundary" TEXT,
    "tRaw" DOUBLE PRECISION,

    CONSTRAINT "CrisisTrajectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "oppId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "probability" DOUBLE PRECISION NOT NULL,
    "upsideEur" DOUBLE PRECISION NOT NULL,
    "windowMonths" DOUBLE PRECISION NOT NULL,
    "stratFit" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "smiAlign" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "investEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "readiness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "captureStatus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upsideScore" DOUBLE PRECISION,
    "expectedValue" DOUBLE PRECISION,
    "captureIdx" DOUBLE PRECISION,
    "otsAmplified" DOUBLE PRECISION,
    "roi" DOUBLE PRECISION,
    "priority" TEXT,
    "notes" TEXT,
    "reportingPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityTrajectory" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "tConf" DOUBLE PRECISION NOT NULL,
    "xConf" DOUBLE PRECISION NOT NULL,
    "prob" DOUBLE PRECISION,
    "upsideEur" DOUBLE PRECISION,
    "upScore" DOUBLE PRECISION,
    "windowMonths" DOUBLE PRECISION,
    "urgency" DOUBLE PRECISION,
    "captureIdx" DOUBLE PRECISION,
    "boundary" TEXT,
    "tRaw" DOUBLE PRECISION,

    CONSTRAINT "OpportunityTrajectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResilienceSnapshot" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "controlEffectiveness" DOUBLE PRECISION NOT NULL,
    "responseCapacity" DOUBLE PRECISION NOT NULL,
    "teamCapability" DOUBLE PRECISION NOT NULL,
    "systemRedundancy" DOUBLE PRECISION NOT NULL,
    "resilienceIndex" DOUBLE PRECISION NOT NULL,
    "marketPositioning" DOUBLE PRECISION,
    "strategicCapital" DOUBLE PRECISION,
    "innovationCapability" DOUBLE PRECISION,
    "strategicFlexibility" DOUBLE PRECISION,
    "smi" DOUBLE PRECISION,
    "strategicPosture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResilienceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAggregation" (
    "id" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "totalExpectedLoss" DOUBLE PRECISION,
    "cashFlowAtRisk" DOUBLE PRECISION,
    "coherenceDensity" DOUBLE PRECISION,
    "phaseIndexSystem" DOUBLE PRECISION,
    "p10" DOUBLE PRECISION,
    "p50" DOUBLE PRECISION,
    "p90" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAggregationItem" (
    "id" TEXT NOT NULL,
    "aggregationId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "prMin" DOUBLE PRECISION,
    "prMostLikely" DOUBLE PRECISION,
    "prMax" DOUBLE PRECISION,
    "imMin" DOUBLE PRECISION,
    "imMostLikely" DOUBLE PRECISION,
    "imMax" DOUBLE PRECISION,
    "pxi" DOUBLE PRECISION,
    "cfar" DOUBLE PRECISION,

    CONSTRAINT "RiskAggregationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnit_code_key" ON "BusinessUnit"("code");

-- CreateIndex
CREATE INDEX "BusinessUnit_group_idx" ON "BusinessUnit"("group");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnitMember_userId_businessUnitId_key" ON "BusinessUnitMember"("userId", "businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Calibration_businessUnitId_key" ON "Calibration"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Parameters_businessUnitId_key" ON "Parameters"("businessUnitId");

-- CreateIndex
CREATE INDEX "Risk_businessUnitId_idx" ON "Risk"("businessUnitId");

-- CreateIndex
CREATE INDEX "Risk_ownerId_idx" ON "Risk"("ownerId");

-- CreateIndex
CREATE INDEX "Risk_category_idx" ON "Risk"("category");

-- CreateIndex
CREATE INDEX "Risk_status_idx" ON "Risk"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RiskObjective_riskId_objectiveId_key" ON "RiskObjective"("riskId", "objectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskInteraction_sourceRiskId_targetRiskId_key" ON "RiskInteraction"("sourceRiskId", "targetRiskId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskCorrelation_riskAId_riskBId_key" ON "RiskCorrelation"("riskAId", "riskBId");

-- CreateIndex
CREATE INDEX "RiskTrajectory_riskId_quarter_idx" ON "RiskTrajectory"("riskId", "quarter");

-- CreateIndex
CREATE INDEX "Crisis_businessUnitId_idx" ON "Crisis"("businessUnitId");

-- CreateIndex
CREATE INDEX "Crisis_status_idx" ON "Crisis"("status");

-- CreateIndex
CREATE INDEX "CrisisTrajectory_crisisId_quarter_idx" ON "CrisisTrajectory"("crisisId", "quarter");

-- CreateIndex
CREATE INDEX "Opportunity_businessUnitId_idx" ON "Opportunity"("businessUnitId");

-- CreateIndex
CREATE INDEX "OpportunityTrajectory_opportunityId_quarter_idx" ON "OpportunityTrajectory"("opportunityId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "ResilienceSnapshot_businessUnitId_reportingPeriod_key" ON "ResilienceSnapshot"("businessUnitId", "reportingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAggregation_businessUnitId_reportingPeriod_key" ON "RiskAggregation"("businessUnitId", "reportingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAggregationItem_aggregationId_riskId_key" ON "RiskAggregationItem"("aggregationId", "riskId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "BusinessUnitMember" ADD CONSTRAINT "BusinessUnitMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessUnitMember" ADD CONSTRAINT "BusinessUnitMember_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calibration" ADD CONSTRAINT "Calibration_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parameters" ADD CONSTRAINT "Parameters_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskObjective" ADD CONSTRAINT "RiskObjective_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskObjective" ADD CONSTRAINT "RiskObjective_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskInteraction" ADD CONSTRAINT "RiskInteraction_sourceRiskId_fkey" FOREIGN KEY ("sourceRiskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskInteraction" ADD CONSTRAINT "RiskInteraction_targetRiskId_fkey" FOREIGN KEY ("targetRiskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskCorrelation" ADD CONSTRAINT "RiskCorrelation_riskAId_fkey" FOREIGN KEY ("riskAId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskCorrelation" ADD CONSTRAINT "RiskCorrelation_riskBId_fkey" FOREIGN KEY ("riskBId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskTrajectory" ADD CONSTRAINT "RiskTrajectory_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crisis" ADD CONSTRAINT "Crisis_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crisis" ADD CONSTRAINT "Crisis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisTrajectory" ADD CONSTRAINT "CrisisTrajectory_crisisId_fkey" FOREIGN KEY ("crisisId") REFERENCES "Crisis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityTrajectory" ADD CONSTRAINT "OpportunityTrajectory_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResilienceSnapshot" ADD CONSTRAINT "ResilienceSnapshot_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "BusinessUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAggregationItem" ADD CONSTRAINT "RiskAggregationItem_aggregationId_fkey" FOREIGN KEY ("aggregationId") REFERENCES "RiskAggregation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAggregationItem" ADD CONSTRAINT "RiskAggregationItem_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
