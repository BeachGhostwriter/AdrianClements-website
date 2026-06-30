/**
 * CORE Engine — TTS & OTS base calculations
 * Implements: White Paper CORE v4.0, Section 3 & 4
 *
 * TTS(t) = {[L(t) × I(t) × V(t) × (1 + A × exp(α·t))] / √(1−(v/v_max)²)} × [1+β×(ψ/ψ_c)^γ]
 * OTS(t) = {[P(t) × B(t) × U(t) × (1 + S × exp(σ·t))] / √(1+(d/d_min)²)} × [1+k×(R/R_opt)^λ]
 */

import type { CoreInputs, CalibrationParams, TTSResult } from 'shared-types'

export const DEFAULT_CALIBRATION: CalibrationParams = {
  vMax: 1.0,
  psiC: 5.0,
  beta: 2.0,
  gamma: 3.0,
  alpha: 0.15,
  delta: 1.0,
  ttsHorizon: 16.67,
  kappaCoh: 0.2,
  alphaWeight: 0.5,
  asymmetryFactor: 1.4,
}

/**
 * Impact normalisation: I_score = MIN(10, MAX(1, 2 × LN(€M + 1)))
 * Source: RADAR/FORGE col F — Formula_Reference sheet
 */
export function normaliseImpact(impactEur: number): number {
  return Math.min(10, Math.max(1, 2 * Math.log(impactEur + 1)))
}

/**
 * System criticality ψ(t) = Σ wᵢ × Rᵢ(t)
 * Simplified: uses mean of all active risk scores when full portfolio available
 */
export function calculateSystemCriticality(riskScores: number[], weights?: number[]): number {
  if (riskScores.length === 0) return 0
  const w = weights ?? riskScores.map(() => 1 / riskScores.length)
  return riskScores.reduce((sum, r, i) => sum + w[i] * r, 0)
}

/**
 * Full TTS calculation — 4 steps per CORE white paper Section 3
 *
 * Step 1 — Base: L(t) × I(t) × V(t)
 * Step 2 — Amplification: × (1 + A × exp(α·t))
 * Step 3 — Information Inertia: / √(1 − (v/v_max)²)
 * Step 4 — Criticality: × [1 + β × (ψ/ψ_c)^γ]
 */
export function calculateTTS(
  inputs: CoreInputs,
  calib: CalibrationParams = DEFAULT_CALIBRATION,
  systemCriticality: number = 0,
  timeQuarters: number = 0,
): TTSResult {
  const { probability, impactEur, velocity, amplification, accelerationRate, propagationRatio } = inputs
  const { vMax, psiC, beta, gamma } = calib
  const t = timeQuarters

  // Impact score (log-normalised)
  const impactScore = normaliseImpact(impactEur)
  const expectedLoss = probability * impactEur

  // Step 1: Base risk score
  const baseScore = probability * impactEur * velocity

  // Step 2: Amplification term — 1 + A × exp(α·t)
  const ampTerm = 1 + amplification * Math.exp(accelerationRate * t)
  const amplified = baseScore * ampTerm

  // Step 3: Information Inertia — 1/√(1 − (v/v_max)²)
  // Cap at 0.99 to prevent singularity in base CORE
  const vRatio = Math.min(propagationRatio, 0.99)
  const lorentzFactor = 1 / Math.sqrt(1 - vRatio * vRatio)
  const afterLorentz = amplified * lorentzFactor

  // Step 4: Criticality multiplier — 1 + β × (ψ/ψ_c)^γ
  const psiRatio = psiC > 0 ? systemCriticality / psiC : 0
  const criticalityMultiplier = 1 + beta * Math.pow(psiRatio, gamma)
  const tts = afterLorentz * criticalityMultiplier

  return {
    baseScore,
    amplified,
    lorentzFactor,
    afterLorentz,
    criticalityMultiplier,
    tts,
    impactScore,
    expectedLoss,
  }
}

/**
 * Opportunity Trajectory Score — CORE Section 4
 * OTS(t) = {[P(t) × B(t) × U(t) × (1 + S × exp(σ·t))] / √(1+(d/d_min)²)} × [1+k×(R/R_opt)^λ]
 *
 * Key inversion: uses √(1 + ratio²) — DAMPING not singularity
 */
export function calculateOTS(params: {
  probability: number       // P(t) — capture probability
  benefitEur: number        // B(t) in €M
  timeToWindowYears: number // TTW → U = 1/TTW
  synergyFactor: number     // S ∈ [1,3]
  momentumRate: number      // σ (opportunity growth rate)
  difficultyRatio: number   // d/d_min
  readinessRatio: number    // R/R_opt
  timeQuarters?: number     // t
  k?: number                // readiness constant default 1.0
  lambda?: number           // readiness exponent default 2.0
}): number {
  const { probability, benefitEur, timeToWindowYears, synergyFactor, momentumRate,
    difficultyRatio, readinessRatio, timeQuarters = 0, k = 1.0, lambda = 2.0 } = params

  const urgency = timeToWindowYears > 0 ? 1 / timeToWindowYears : 0

  // Base
  const base = probability * benefitEur * urgency

  // Amplification
  const ampTerm = 1 + synergyFactor * Math.exp(momentumRate * timeQuarters)
  const amplified = base * ampTerm

  // Difficulty damping — ADDITION under sqrt (key inversion from TTS)
  const difficultyFactor = 1 / Math.sqrt(1 + difficultyRatio * difficultyRatio)
  const afterDamping = amplified * difficultyFactor

  // Readiness multiplier — POSITIVE: readiness amplifies score
  const readinessMultiplier = 1 + k * Math.pow(readinessRatio, lambda)

  return afterDamping * readinessMultiplier
}

/**
 * Opportunity threshold — CORE Section 4.2
 * Threshold = RA × (1 + AsymmetryFactor)
 */
export function opportunityThreshold(riskAppetite: number, asymmetryFactor: number = 1.4): number {
  return riskAppetite * (1 + asymmetryFactor)
}

/**
 * CCORD conformal mapping — CORE Section 6.2
 * U = tanh(u/τ), V = tanh(v/ρ)
 * Applied as: t_conf = tanh(t_raw × κ_t), x_conf = tanh(score) × (S - t)
 */
export function conformalMap(score: number, tRaw: number, kappaTau: number = 8.0): {
  tConf: number
  xConf: number
  boundary: 'VALID' | 'OUTSIDE'
} {
  const tConf = Math.tanh(tRaw * kappaTau)
  const S = 1.0 // Diamond boundary = 1
  const xConf = Math.tanh(score) * (S - Math.abs(tConf))
  const boundary = (Math.abs(xConf) + Math.abs(tConf)) <= S ? 'VALID' : 'OUTSIDE'
  return { tConf, xConf, boundary }
}

export { DEFAULT_CALIBRATION as defaultCalibration }
