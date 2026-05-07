// ── Shared types mirroring Prisma schema ──────────────────────

export type UserRole = 'ADMIN' | 'DIVISION_HEAD' | 'RISK_OWNER' | 'VIEWER';
export type RiskCategory = 'OPS' | 'REG' | 'TECH' | 'FIN' | 'STR' | 'REP' | 'ENV' | 'HR' | 'EXT';
export type RiskStatus = 'EMERGING' | 'CONFIRMED' | 'CONTROLLED' | 'CLOSED' | 'MONITORING';
export type RiskDirection = 'INCREASING' | 'STABLE' | 'DECREASING';

export interface User {
  id: string; email: string; firstName: string; lastName: string;
  role: UserRole; organisationId?: string; organisation?: Organisation;
}

export interface Organisation {
  id: string; name: string; code: string;
  group?: string; region?: string; segment?: string;
}

// ── Dashboard ─────────────────────────────────────────────────
export interface DashboardKPIs {
  resilienceIndex: number;      // RI
  smi: number;                  // Strategic Mobility Index
  strategicPosture: string;     // "BLACK PHOENIX" etc.
  activeRadarRisks: number;
  criticalAlerts: number;
  activeForgecrises: number;
  totalExpLossEur: number;
  totalOppValueEur: number;
  coherenceFactor: number;
}

// ── RADAR ─────────────────────────────────────────────────────
export interface RadarEntry {
  id: string; riskId: string; riskTitle: string; category: RiskCategory;
  probability: number; impactEur: number; impactScore: number; expectedLoss: number;
  velocity: number; vRatio: number; lorentzFactor: number;
  ewTts: number; phaseIndex: number; freedomIndex: number;
  entropyS: number; entropyRatio: number; urgencyIndex: number;
  palmerNoise: number; mcP10: number; mcP50: number; mcP90: number;
  priority: string; signalStrength?: number; detectionConf?: number; notes?: string;
}

// ── FORGE ─────────────────────────────────────────────────────
export type ForgeStatus = 'ACTIVE' | 'CONTAINED' | 'RECOVERING' | 'RESOLVED';

export interface ForgeEntry {
  id: string; crisisId: string; crisisTitle: string; category: RiskCategory;
  probability: number; impactEur: number; severity: number;
  ri: number; smi: number; decisionQuality: number;
  responseEff: number; containmentIndex: number;
  rTtsMonths: number; residualEur: number; residualScore: number;
  recoveryMonths: number; urgencyIndex: number; urgencyClass: string;
  palmerNoise: number; mcRLow: number; mcRMid: number; mcRHigh: number;
  mitigROI?: number;
  backcast25?: number; backcast50?: number; backcast75?: number; backcast95?: number;
  status: ForgeStatus; notes?: string;
}

// ── Opportunity ───────────────────────────────────────────────
export interface OpportunityEntry {
  id: string; oppId: string; title: string; category: RiskCategory;
  probability: number; upsideEur: number; upsideScore: number;
  expectedValue: number; windowMonths: number; urgency: number;
  synergyS: number; difficultyDamp: number;
  smiAlign?: number; captureIdx?: number;
  investEur?: number; roi?: number;
  priority?: string; readinessLabel?: string; notes?: string;
}

// ── API responses ─────────────────────────────────────────────
export interface ApiResponse<T> { success: boolean; data: T; error?: { message: string; code: string }; }
export interface PaginatedResponse<T> extends ApiResponse<T[]> { total: number; page: number; limit: number; }
