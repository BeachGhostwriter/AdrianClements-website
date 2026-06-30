/**
 * FORGE Engine — Deterministic Response TTS with Bounded Functions
 * Implements: White Paper FORGE v4.0
 *
 * R-TTS = [L(t) × I(t) × log₂(1+V) × (1+A×min(exp(αt),20))]
 *         / √(1−min(v/v_m,0.95)²) × [1+β×σ((ψ−ψ_c)/δ)]
 */

import { normaliseImpact, DEFAULT_CALIBRATION } from 'core-engine'
import type { CoreInputs, CalibrationParams, ForgeResult, ResilienceInputs, ResilienceResult, SMIInputs, SMIResult, UrgencyClass, StrategicPosture } from 'shared-types'

// ── Bounded functions (FORGE Section 3) ─────────────────────

/**
 * 3.1 Bounded Velocity: log₂(1+V)
 * Reduces oversensitivity. V=10 → 3.46 (vs 10 raw)
 */
export function boundedVelocity(v: number): number {
  return Math.log2(1 + Math.max(0, v))
}

/**
 * 3.2 Bounded Amplification: min(exp(αt), 20)
 * Caps exponential growth at 20× to prevent numerical overflow
 */
export function boundedAmplification(accelerationRate: number, timeQuarters: number): number {
  return Math.min(Math.exp(accelerationRate * timeQuarters), 20)
}

/**
 * 3.3 Soft-Capped Lorentz: min(v/v_max, 0.95) → max factor ≈ 3.20
 * 1/√(1 − 0.95²) = 1/√(0.0975) ≈ 3.20
 */
export function softCapLorentz(propagationRatio: number): number {
  const vRatioCapped = Math.min(propagationRatio, 0.95)
  return 1 / Math.sqrt(1 - vRatioCapped * vRatioCapped)
}

/**
 * 3.4 Sigmoid Criticality: σ((ψ−ψ_c)/δ)
 * Smooth S-curve transition (vs sharp power-law in RADAR)
 * σ(x) = 1/(1+exp(−x))
 */
export function sigmoidCriticality(
  systemCriticality: number,
  psiC: number = 5.0,
  delta: number = 1.0,
): number {
  const x = (systemCriticality - psiC) / delta
  return 1 / (1 + Math.exp(-x))
}

/**
 * Full R-TTS calculation — FORGE bounded variant
 */
export function calculateRTTS(
  inputs: CoreInputs,
  calib: CalibrationParams = DEFAULT_CALIBRATION,
  systemCriticality: number = 0,
  timeQuarters: number = 0,
): { rTts: number; boundedV: number; boundedAmp: number; lorentzFactor: number; sigmoid: number; impactScore: number; expectedLoss: number } {
  const { probability, impactEur, velocity, amplification, accelerationRate, propagationRatio } = inputs
  const { psiC, beta, delta } = calib

  const impactScore = normaliseImpact(impactEur)
  const expectedLoss = probability * impactEur

  const bv = boundedVelocity(velocity)
  const ba = boundedAmplification(accelerationRate, timeQuarters)
  const lf = softCapLorentz(propagationRatio)
  const sc = sigmoidCriticality(systemCriticality, psiC, delta)

  // R-TTS = [L × I × log₂(1+V) × (1+A×min(exp(αt),20))] / Lorentz × [1+β×sigmoid]
  const numerator = probability * impactEur * bv * (1 + amplification * ba)
  const rTts = (numerator * lf) * (1 + beta * sc)

  return { rTts, boundedV: bv, boundedAmp: ba, lorentzFactor: lf, sigmoid: sc, impactScore, expectedLoss }
}

// ── Urgency Index (FORGE Section 4.1) ───────────────────────

/**
 * U(t) = R-TTS(t) × (1 + V(t)) × (1 − T_remain/T_total)
 */
export function urgencyIndex(rTts: number, velocity: number, tRemain: number, tTotal: number): number {
  const timePressure = tTotal > 0 ? Math.max(0, 1 - tRemain / tTotal) : 1
  return rTts * (1 + velocity) * timePressure
}

export function urgencyClass(urgency: number): UrgencyClass {
  if (urgency >= 200) return 'Emergency'
  if (urgency >= 50) return 'Crisis'
  if (urgency >= 10) return 'Accelerated'
  return 'Standard'
}

// ── Resilience Index (FORGE Section 4.2) ────────────────────

/**
 * 4.2.1 Control Effectiveness: CE = 1 − ∏(1 − sᵢ × qᵢ)
 */
export function controlEffectiveness(controls: Array<{ strength: number; quality: number }>): number {
  if (controls.length === 0) return 0
  const product = controls.reduce((prod, c) => prod * (1 - c.strength * c.quality), 1)
  return 1 - product
}

/**
 * 4.2.2 Response Capacity: RC = (Budget_Available/Budget_Required) × (1/Decision_Lag_days) × Success_Rate
 */
export function responseCapacity(
  budgetAvailable: number,
  budgetRequired: number,
  decisionLagDays: number,
  historicalSuccessRate: number,
): number {
  const budgetRatio = budgetRequired > 0 ? Math.min(1, budgetAvailable / budgetRequired) : 0
  const lagFactor = decisionLagDays > 0 ? 1 / decisionLagDays : 0
  return budgetRatio * lagFactor * historicalSuccessRate
}

/**
 * 4.2.3 Team Capability: TC = (Expertise/5) × (FTE_Deployed/FTE_Required)
 */
export function teamCapability(expertise: number, fteDeploys: number, fteRequired: number): number {
  const expertiseFactor = Math.min(1, expertise / 5)
  const staffingFactor = fteRequired > 0 ? Math.min(1, fteDeploys / fteRequired) : 0
  return expertiseFactor * staffingFactor
}

/**
 * 4.2.4 System Redundancy: SR = (1 − 1/R_factor) × MIN(1, RTO/ART)
 * Single point of failure (R=1) → SR = 0
 */
export function systemRedundancy(rFactor: number, rto: number, art: number): number {
  const redundancyBase = rFactor > 0 ? 1 - 1 / rFactor : 0
  const recoveryFactor = art > 0 ? Math.min(1, rto / art) : 0
  return redundancyBase * recoveryFactor
}

/**
 * 4.2.5 Combined Resilience Index: RI = 0.35×CE + 0.30×TC + 0.25×RC + 0.10×SR
 */
export function resilienceIndex(
  inputs: ResilienceInputs,
  calib: CalibrationParams = DEFAULT_CALIBRATION,
): ResilienceResult {
  const { ceWeight, tcWeight, rcWeight, srWeight } = calib as any
  const weights = {
    ce: ceWeight ?? 0.35,
    tc: tcWeight ?? 0.30,
    rc: rcWeight ?? 0.25,
    sr: srWeight ?? 0.10,
  }

  const ce = controlEffectiveness(inputs.controls)
  const rc = responseCapacity(
    inputs.budget.available, inputs.budget.required,
    inputs.budget.decisionLagDays, inputs.budget.historicalSuccessRate,
  )
  const tc = teamCapability(inputs.team.expertise, inputs.team.fteDeploys, inputs.team.fteRequired)
  const sr = systemRedundancy(inputs.redundancy.rFactor, inputs.redundancy.rto, inputs.redundancy.art)
  const ri = weights.ce * ce + weights.tc * tc + weights.rc * rc + weights.sr * sr

  return { controlEffectiveness: ce, responseCapacity: rc, teamCapability: tc, systemRedundancy: sr, resilienceIndex: ri }
}

// ── Strategic Momentum Index (Company_SMI) ───────────────────

/**
 * SMI = weighted mean of MP + SC + IC + SF
 * Weights: MP=0.30, SC=0.30, IC=0.25, SF=0.15
 */
export function strategicMomentumIndex(inputs: SMIInputs): SMIResult {
  const smi = 0.30 * inputs.marketPositioning +
              0.30 * inputs.strategicCapital +
              0.25 * inputs.innovationCapability +
              0.15 * inputs.strategicFlexibility

  let posture: StrategicPosture
  const HIGH_RI = 0.6, HIGH_SMI = 0.6 // Thresholds
  if (smi >= HIGH_SMI) {
    posture = 'BLACK_PHOENIX'         // High RI handled externally
  } else {
    posture = 'INCUMBENT_DEFENDER'    // Will be refined with RI
  }
  return { smi: Math.min(1, Math.max(0, smi)), strategicPosture: posture }
}

/**
 * Four-quadrant strategic posture determination
 */
export function strategicPosture(resilienceIdx: number, smi: number): StrategicPosture {
  const highRI = resilienceIdx >= 0.6
  const highSMI = smi >= 0.6
  if (highRI && highSMI) return 'BLACK_PHOENIX'
  if (!highRI && highSMI) return 'DISRUPTIVE_CHALLENGER'
  if (!highRI && !highSMI) return 'DOUBLE_EXPOSURE'
  return 'INCUMBENT_DEFENDER'
}

// ── Backcasting (FORGE Section 5) ──────────────────────────

/**
 * Generate 4 milestone TTS targets from peak
 * Containment: TTS_peak × 0.7
 * Stabilisation: TTS_peak × 0.3
 * Recovery: TTS_baseline × 2
 * Resilience: TTS_baseline × 1.2
 */
export function backcasting(ttsPeak: number, ttsBaseline: number): {
  containment: number
  stabilisation: number
  recovery: number
  resilience: number
  requiredRatePerPeriod: (currentTTS: number, targetTTS: number, periodsRemaining: number) => number
} {
  return {
    containment: ttsPeak * 0.7,
    stabilisation: ttsPeak * 0.3,
    recovery: ttsBaseline * 2,
    resilience: ttsBaseline * 1.2,
    requiredRatePerPeriod: (current, target, periods) =>
      periods > 0 ? (current - target) / periods : 0,
  }
}

/**
 * Palmer Noise for FORGE: η = 0.1 + 0.3 × (1 − Containment_Index)
 */
export function forgePalmerNoise(containmentIndex: number): number {
  return 0.1 + 0.3 * (1 - Math.max(0, Math.min(1, containmentIndex)))
}

/**
 * Full FORGE result calculation
 */
export function calculateForge(
  inputs: CoreInputs & { severity: number; responseEffectiveness: number; resourceFactor: number; containmentIndex: number; tRemain: number; tTotal: number },
  calib: CalibrationParams = DEFAULT_CALIBRATION,
  systemCriticality: number = 0,
  timeQuarters: number = 0,
  ttsPeak: number = 100,
  ttsBaseline: number = 5,
): ForgeResult {
  const { rTts, boundedV, boundedAmp, lorentzFactor, sigmoid } = calculateRTTS(inputs, calib, systemCriticality, timeQuarters)

  const impactScore = normaliseImpact(inputs.impactEur)
  const residualEur = inputs.impactEur * (1 - inputs.responseEffectiveness)
  const residualScore = normaliseImpact(residualEur)
  const rTtsMonths = rTts * (1 - inputs.responseEffectiveness * inputs.resourceFactor)

  const urgency = urgencyIndex(rTts, inputs.velocity, inputs.tRemain, inputs.tTotal)
  const eta = forgePalmerNoise(inputs.containmentIndex)

  const recoveryMonths = residualScore > 0 ? residualScore / 10 * 12 : 1
  const recoveryDays = recoveryMonths * 30.44

  // MC bounds using Palmer noise
  const mcRMid = residualEur
  const mcRLow = residualEur * (1 - 1.645 * eta)
  const mcRHigh = residualEur * (1 + 1.645 * eta)

  const mitigROI = residualEur > 0 ? (inputs.impactEur - residualEur) / residualEur : 0

  const bc = backcasting(ttsPeak, ttsBaseline)

  return {
    boundedVelocity: boundedV,
    boundedAmplification: boundedAmp,
    softCapLorentz: Math.min(inputs.propagationRatio, 0.95),
    lorentzFactor,
    sigmoidCriticality: sigmoid,
    rTts,
    residualEur,
    residualScore,
    urgencyIndex: urgency,
    urgencyClass: urgencyClass(urgency),
    recoveryMonths,
    recoveryDays,
    palmerNoise: eta,
    mcRLow,
    mcRMid,
    mcRHigh,
    mitigROI,
    backcast25: bc.containment,
    backcast50: bc.stabilisation,
    backcast75: bc.recovery,
    backcast95: bc.resilience,
  }
}
