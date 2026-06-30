/**
 * RADAR Engine — Early Warning TTS with Monte Carlo, Coherence, Phase Proximity
 * Implements: White Paper RADAR v4.0
 *
 * Phase 1 (CORE base): L × I → V → Amplification → Lorentz → Criticality
 * Phase 2 (RADAR extension): Monte Carlo → Coherence → Phase Proximity
 * EW-TTS(t) = ⟨TTS_ensemble(t)⟩ × Coherence_Factor × Phase_Proximity
 */

import { calculateTTS, normaliseImpact, DEFAULT_CALIBRATION } from 'core-engine'
import type { CoreInputs, CalibrationParams, RadarResult } from 'shared-types'

const MONTE_CARLO_N = 500

// Palmer Noise parameters (Table 1, RADAR paper)
export const PALMER_SIGMA = {
  L: 0.15,   // σ_L — likelihood noise
  I: 0.20,   // σ_I — impact noise
  V: 0.25,   // σ_V — velocity noise
  A: 0.30,   // σ_A — amplification noise
}

/**
 * Palmer Noise coefficient: η = 0.1 + 0.3 × (1 − F)
 * As freedom decreases → noise increases → wider MC envelope
 */
export function palmerNoise(freedomIndex: number): number {
  return 0.1 + 0.3 * (1 - Math.max(0, Math.min(1, freedomIndex)))
}

/**
 * Box-Muller transform — generates N(0,1) sample
 */
function randn(): number {
  const u = 1 - Math.random()
  const v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/**
 * Monte Carlo ensemble — N=500 simulations with Palmer noise perturbation
 * Each ε drawn from N(0, σ), bounded to physical limits
 */
export function monteCarloEnsemble(
  inputs: CoreInputs,
  calib: CalibrationParams,
  systemCriticality: number,
  freedomIndex: number,
  n: number = MONTE_CARLO_N,
): { mean: number; std: number; p10: number; p50: number; p90: number } {
  const eta = palmerNoise(freedomIndex)
  const results: number[] = []

  for (let i = 0; i < n; i++) {
    const perturbed: CoreInputs = {
      probability: Math.max(0, Math.min(1, inputs.probability + randn() * eta * PALMER_SIGMA.L)),
      impactEur: Math.max(0, inputs.impactEur + randn() * eta * PALMER_SIGMA.I * inputs.impactEur),
      velocity: Math.max(0, inputs.velocity + randn() * eta * PALMER_SIGMA.V * inputs.velocity),
      amplification: Math.max(0, Math.min(3, inputs.amplification + randn() * eta * PALMER_SIGMA.A)),
      accelerationRate: inputs.accelerationRate,
      propagationRatio: Math.max(0, Math.min(0.99, inputs.propagationRatio + randn() * 0.05)),
    }
    const result = calculateTTS(perturbed, calib, systemCriticality, inputs.timeQuarters ?? 0)
    results.push(result.tts)
  }

  results.sort((a, b) => a - b)
  const mean = results.reduce((s, v) => s + v, 0) / n
  const variance = results.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)

  return {
    mean,
    std,
    p10: results[Math.floor(n * 0.1)],
    p50: results[Math.floor(n * 0.5)],
    p90: results[Math.floor(n * 0.9)],
  }
}

/**
 * Coherence Factor — detects synchronised risk cascades
 * CF = 1 + κ_coh × √(Σᵢ≠ⱼ |ρᵢⱼ|²)
 *
 * rhoMatrix: square matrix of risk correlations ρᵢⱼ ∈ [-1,1]
 * Diagonal should be 1 (self-correlation), off-diagonal are cross-correlations
 */
export function coherenceFactor(
  rhoMatrix: number[][],
  kappaCoh: number = 0.2,
): number {
  let sumSquares = 0
  for (let i = 0; i < rhoMatrix.length; i++) {
    for (let j = 0; j < rhoMatrix[i].length; j++) {
      if (i !== j) sumSquares += rhoMatrix[i][j] ** 2
    }
  }
  return 1 + kappaCoh * Math.sqrt(sumSquares)
}

/**
 * Phase Proximity — Gaussian decay from critical threshold
 * PP = exp(−(d/d_critical)²)
 * d = |ψ − ψ_c|
 *
 * Near 1.0 → organisation is close to tipping point
 * Near 0.0 → far from critical threshold
 */
export function phaseProximity(
  systemCriticality: number,
  psiC: number = 5.0,
  dCritical: number = 2.0,
): number {
  const d = Math.abs(systemCriticality - psiC)
  return Math.exp(-((d / dCritical) ** 2))
}

/**
 * Phase Index — tipping-point proximity alarm
 * PI = |d²⟨TTS⟩/dt²| + σ_ensemble/⟨TTS⟩
 *
 * ttsHistory: array of [t-2, t-1, t] TTS values
 * High PI = accelerating AND diverging ensemble → phase transition imminent
 */
export function phaseIndex(
  ttsHistory: [number, number, number],
  ensembleMean: number,
  ensembleStd: number,
  dt: number = 1,
): number {
  const [ttsPrev2, ttsPrev1, ttsCurr] = ttsHistory
  const secondDerivative = Math.abs((ttsCurr - 2 * ttsPrev1 + ttsPrev2) / (dt * dt))
  const coefficientOfVariation = ensembleMean > 0 ? ensembleStd / ensembleMean : 0
  return secondDerivative + coefficientOfVariation
}

/**
 * Freedom Index — remaining decision space
 * F_temporal = 1 − (TTS/TTS_horizon) × (v/v_max)²
 * F_structural = 1 / (1 + (Criticality/10) × Causal_Links)
 * F(I) = F_structural^α × F_temporal^(1−α)
 */
export function freedomIndex(
  tts: number,
  ttsHorizon: number,
  propagationRatio: number,
  systemCriticality: number,
  causalLinks: number,
  alpha: number = 0.5,
): { freedomIndex: number; temporal: number; structural: number } {
  const temporal = Math.max(0, 1 - (tts / ttsHorizon) * propagationRatio ** 2)
  const structural = 1 / (1 + (systemCriticality / 10) * causalLinks)
  const combined = Math.pow(structural, alpha) * Math.pow(temporal, 1 - alpha)
  return { freedomIndex: Math.max(0, Math.min(1, combined)), temporal, structural }
}

/**
 * Von Neumann Entropy — S(ρ) = −Tr(ρ log₂ ρ) = −Σᵢ λᵢ log₂(λᵢ)
 * stateProbabilities: array of eigenvalues/probabilities (must sum to ~1)
 * Returns entropy in bits; max = log₂(N) for N states
 */
export function vonNeumannEntropy(stateProbabilities: number[]): number {
  return -stateProbabilities
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0)
}

/**
 * Full RADAR calculation chain
 */
export function calculateEWTTS(
  inputs: CoreInputs,
  calib: CalibrationParams = DEFAULT_CALIBRATION,
  rhoMatrix: number[][] = [[1]],
  systemCriticality: number = 0,
  causalLinks: number = 0,
  ttsHistory?: [number, number, number],
  stateProbabilities: number[] = [0.25, 0.25, 0.25, 0.25],
): RadarResult {
  // Phase 1: CORE base TTS
  const coreResult = calculateTTS(inputs, calib, systemCriticality, inputs.timeQuarters ?? 0)

  // Phase 2a: Freedom Index (needed for Palmer Noise)
  const freedom = freedomIndex(
    coreResult.tts,
    calib.ttsHorizon,
    inputs.propagationRatio,
    systemCriticality,
    causalLinks,
    calib.alphaWeight,
  )

  // Phase 2b: Monte Carlo ensemble with Palmer Noise
  const mc = monteCarloEnsemble(inputs, calib, systemCriticality, freedom.freedomIndex)

  // Phase 2c: Coherence Factor
  const cf = coherenceFactor(rhoMatrix, calib.kappaCoh)

  // Phase 2d: Phase Proximity
  const pp = phaseProximity(systemCriticality, calib.psiC)

  // EW-TTS = ⟨TTS_ensemble⟩ × Coherence_Factor × Phase_Proximity
  const ewTts = mc.mean * cf * pp
  const ewTtsLorentz = ewTts / coreResult.lorentzFactor

  // Phase Index (requires history; falls back to CV-only if unavailable)
  const pi = ttsHistory
    ? phaseIndex(ttsHistory, mc.mean, mc.std)
    : mc.mean > 0 ? mc.std / mc.mean : 0

  // Von Neumann Entropy
  const maxEntropy = Math.log2(stateProbabilities.length)
  const entropy = vonNeumannEntropy(stateProbabilities)
  const entropyRatio = maxEntropy > 0 ? entropy / maxEntropy : 0

  // Urgency Index (RADAR version — same as FORGE but uses EW-TTS)
  const timeRemain = 1 - Math.min(1, coreResult.tts / calib.ttsHorizon)
  const urgency = ewTts * (1 + inputs.velocity) * (1 - timeRemain)

  const eta = palmerNoise(freedom.freedomIndex)

  return {
    ...coreResult,
    ensembleMean: mc.mean,
    ensembleStd: mc.std,
    coherenceFactor: cf,
    phaseProximity: pp,
    ewTts,
    ewTtsLorentz,
    phaseIndex: pi,
    freedomIndex: freedom.freedomIndex,
    freedomTemporal: freedom.temporal,
    freedomStructural: freedom.structural,
    entropyS: entropy,
    entropyRatio,
    urgencyIndex: urgency,
    palmerNoise: eta,
    mcP10: mc.p10,
    mcP50: mc.p50,
    mcP90: mc.p90,
  }
}

// RADAR → FORGE handoff criteria (RADAR paper Section 8)
export function shouldHandoffToForge(metrics: {
  ewTts: number
  prevEwTts: number
  ensembleStd: number
  ensembleMean: number
  freedomIndex: number
  velocityVariance: number
}): { handoff: boolean; triggeredCriteria: string[] } {
  const criteria: string[] = []
  if (metrics.ewTts > 15 && metrics.prevEwTts > 15) criteria.push('EW-TTS > 15 for 2+ periods')
  if (metrics.ensembleMean > 0 && metrics.ensembleStd / metrics.ensembleMean < 0.2)
    criteria.push('Ensemble convergence σ/μ < 0.2')
  if (metrics.freedomIndex < 0.5) criteria.push('Freedom Index F < 0.5')
  if (metrics.velocityVariance < 0.1) criteria.push('Velocity variance < 10% over 3 periods')
  return { handoff: criteria.length >= 2, triggeredCriteria: criteria }
}
