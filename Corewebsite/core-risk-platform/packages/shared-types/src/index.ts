// Shared TypeScript types for CORE v7 platform

export type UserRole = 'ADMIN' | 'DIVISION_HEAD' | 'RISK_OWNER' | 'VIEWER'

export type RiskCategory = 'OPS' | 'REG' | 'TECH' | 'FIN' | 'STR' | 'REP' | 'ENV' | 'HR' | 'LEGAL' | 'OTHER'
export type RiskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MONITOR'
export type RiskStatus = 'ACTIVE' | 'MONITORING' | 'MITIGATED' | 'CLOSED' | 'TRANSFERRED_TO_FORGE'
export type CrisisStatus = 'ACTIVE' | 'CONTAINMENT' | 'STABILISATION' | 'RECOVERY' | 'RESILIENCE' | 'CLOSED'
export type UrgencyClass = 'Standard' | 'Accelerated' | 'Crisis' | 'Emergency'
export type StrategicPosture = 'BLACK_PHOENIX' | 'DISRUPTIVE_CHALLENGER' | 'DOUBLE_EXPOSURE' | 'INCUMBENT_DEFENDER'

// ── CORE Engine inputs ──────────────────────────

export interface CoreInputs {
  probability: number         // L(t) ∈ [0,1]
  impactEur: number           // I(t) in €M
  velocity: number            // V = 1/TTI
  amplification: number       // A ∈ [0,3]
  accelerationRate: number    // α
  propagationRatio: number    // v/v_max ∈ [0,0.99]
  timeQuarters?: number       // t (quarters elapsed)
}

export interface CalibrationParams {
  vMax: number                // Maximum propagation velocity
  psiC: number                // Critical threshold ψ_c
  beta: number                // β amplification constant
  gamma: number               // γ criticality exponent
  alpha: number               // α acceleration rate
  delta: number               // δ FORGE sigmoid width
  ttsHorizon: number          // TTS appetite horizon
  kappaCoh: number            // κ_coh coherence coupling
  alphaWeight: number         // Industry/maturity weight α
  asymmetryFactor: number     // Opportunity threshold multiplier
}

// ── CORE TTS Result ─────────────────────────────

export interface TTSResult {
  baseScore: number           // L × I × V
  amplified: number           // × (1 + A×exp(αt))
  lorentzFactor: number       // γ = 1/√(1-(v/v_max)²)
  afterLorentz: number        // amplified / √(1-(v/v_max)²)
  criticalityMultiplier: number // 1+β×(ψ/ψ_c)^γ
  tts: number                 // Final TTS
  impactScore: number         // MIN(10, MAX(1, 2×LN(€M+1)))
  expectedLoss: number        // P × I_€M
}

// ── RADAR EW-TTS Result ─────────────────────────

export interface RadarResult extends TTSResult {
  ensembleMean: number        // ⟨TTS_ensemble⟩
  ensembleStd: number         // σ_ensemble
  coherenceFactor: number     // 1 + κ_coh × √(Σ|ρᵢⱼ|²)
  phaseProximity: number      // exp(-(d/d_critical)²)
  ewTts: number               // EW-TTS = ensemble × coherence × phase
  ewTtsLorentz: number        // Lorentz-adjusted EW-TTS
  phaseIndex: number          // |d²⟨TTS⟩/dt²| + σ/μ
  freedomIndex: number        // F(t) ∈ [0,1]
  freedomTemporal: number
  freedomStructural: number
  entropyS: number            // Von Neumann S(ρ)
  entropyRatio: number        // S/S_max
  urgencyIndex: number
  palmerNoise: number         // η
  mcP10: number
  mcP50: number
  mcP90: number
}

// ── FORGE R-TTS Result ──────────────────────────

export interface ForgeResult {
  boundedVelocity: number     // log₂(1+V)
  boundedAmplification: number // min(exp(αt), 20)
  softCapLorentz: number      // min(v/v_max, 0.95)
  lorentzFactor: number       // 1/√(1-min(v/v_max,0.95)²)
  sigmoidCriticality: number  // σ((ψ-ψ_c)/δ)
  rTts: number                // R-TTS final
  residualEur: number         // I × (1 - RE)
  residualScore: number
  urgencyIndex: number
  urgencyClass: UrgencyClass
  recoveryMonths: number
  recoveryDays: number
  palmerNoise: number
  mcRLow: number
  mcRMid: number
  mcRHigh: number
  mitigROI: number
  backcast25: number
  backcast50: number
  backcast75: number
  backcast95: number
}

// ── Resilience ──────────────────────────────────

export interface ResilienceInputs {
  controls: Array<{ strength: number; quality: number }>
  budget: { available: number; required: number; decisionLagDays: number; historicalSuccessRate: number }
  team: { expertise: number; fteDeploys: number; fteRequired: number }
  redundancy: { rFactor: number; rto: number; art: number }
}

export interface ResilienceResult {
  controlEffectiveness: number  // CE = 1 − ∏(1 − sᵢ × qᵢ)
  responseCapacity: number      // RC
  teamCapability: number        // TC
  systemRedundancy: number      // SR
  resilienceIndex: number       // RI = weighted sum
}

export interface SMIInputs {
  marketPositioning: number     // MP ∈ [0,1]
  strategicCapital: number      // SC ∈ [0,1]
  innovationCapability: number  // IC ∈ [0,1]
  strategicFlexibility: number  // SF ∈ [0,1]
}

export interface SMIResult {
  smi: number
  strategicPosture: StrategicPosture
}

// ── CCORD Conformal mapping ─────────────────────

export interface ConformalPoint {
  quarter: string
  tConf: number               // t_conf = tanh(t_raw × κ_t)
  xConf: number               // x_conf = tanh(score) × (S - t)
  type: 'RISK' | 'OPPORTUNITY'
  boundary: 'VALID' | 'OUTSIDE'
  tRaw: number
}

// ── API types ────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  businessUnitIds: string[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface DashboardMetrics {
  resilienceIndex: number
  smi: number
  strategicPosture: StrategicPosture
  activeRadarRisks: number
  criticalAlerts: number
  activeForgeCrises: number
  totalExpectedLossEur: number
  totalOppValueEur: number
  coherenceFactor: number
  systemPhaseIndex: number
}
