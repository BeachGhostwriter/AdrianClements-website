/**
 * RADAR© Engine — Early Warning TTS
 * Based on White Paper: RADAR© Framework (Part 2)
 *
 * EW-TTS(t) = ⟨TTS_ensemble(t)⟩ × Coherence_Factor × Phase_Proximity
 * Coherence_Factor = 1 + κ_coh × √(Σᵢ≠ⱼ|ρᵢⱼ|²)
 * Phase_Proximity  = exp(−(d/d_critical)²)
 * Phase_Index      = |d²⟨TTS⟩/dt²| + σ_ensemble/⟨TTS⟩
 * Freedom_Index    = F_structural^α × F_temporal^(1-α)
 */

import { calcTTS, calcPalmerNoise, calcMCBounds, TTSInputs } from './coreEngine';

// ── Palmer Noise standard deviations (Table 1 in white paper) ──
const PALMER_SIGMA = {
  likelihood:   0.15,
  impact:       0.20,
  velocity:     0.25,
  acceleration: 0.30,
} as const;

const MONTE_CARLO_N = 500;

/**
 * Monte Carlo ensemble: perturb inputs, compute TTS for each sim
 * Returns mean and standard deviation of the ensemble
 */
export const runMonteCarloEnsemble = (
  baseInputs: TTSInputs,
  n: number = MONTE_CARLO_N
): { mean: number; std: number; samples: number[] } => {
  const randn = () => {
    // Box-Muller transform for standard normal
    const u1 = Math.random(), u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const samples: number[] = [];

  for (let i = 0; i < n; i++) {
    const perturbedInputs: TTSInputs = {
      ...baseInputs,
      likelihood:        Math.max(0, Math.min(1,  baseInputs.likelihood  + randn() * PALMER_SIGMA.likelihood)),
      impactEur:         Math.max(0,               baseInputs.impactEur   + randn() * PALMER_SIGMA.impact * baseInputs.impactEur),
      velocity:          Math.max(0,               baseInputs.velocity    + randn() * PALMER_SIGMA.velocity * baseInputs.velocity),
      amplificationA:    Math.max(0, Math.min(3,   baseInputs.amplificationA + randn() * PALMER_SIGMA.acceleration)),
    };
    samples.push(calcTTS(perturbedInputs).tts);
  }

  const mean = samples.reduce((a, b) => a + b, 0) / n;
  const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(variance), samples };
};

/**
 * Coherence Factor = 1 + κ_coh × √(Σᵢ≠ⱼ|ρᵢⱼ|²)
 * ρᵢⱼ = correlation between risk i and risk j (from density matrix)
 */
export const calcCoherenceFactor = (
  correlationMatrix: number[][],  // off-diagonal elements ρᵢⱼ
  kappa: number = 0.2             // κ_coh ∈ [0.1, 0.3]
): number => {
  let sumSquares = 0;
  for (let i = 0; i < correlationMatrix.length; i++) {
    for (let j = 0; j < correlationMatrix[i].length; j++) {
      if (i !== j) sumSquares += Math.abs(correlationMatrix[i][j]) ** 2;
    }
  }
  return 1 + kappa * Math.sqrt(sumSquares);
};

/**
 * Phase Proximity = exp(−(d/d_critical)²)
 * d = |ψ − ψ_c| distance from critical threshold
 */
export const calcPhaseProximity = (
  psiCurrent: number,
  psiCritical: number,
  dCritical: number = 1.0
): number => {
  const d = Math.abs(psiCurrent - psiCritical);
  return Math.exp(-(d / dCritical) ** 2);
};

/**
 * EW-TTS = ⟨TTS_ensemble⟩ × Coherence_Factor × Phase_Proximity
 */
export const calcEWTTS = (
  ensembleMean: number,
  coherenceFactor: number,
  phaseProximity: number
): number => ensembleMean * coherenceFactor * phaseProximity;

/**
 * Phase Index = |d²⟨TTS⟩/dt²| + σ_ensemble/⟨TTS⟩
 * Requires at least 3 consecutive TTS readings
 */
export const calcPhaseIndex = (
  ttsPrev: number,   // TTS(t-Δt)
  ttsCurr: number,   // TTS(t)
  ttsNext: number,   // TTS(t+Δt)
  dt: number,        // time interval (quarters)
  ensembleStd: number,
  ensembleMean: number
): number => {
  const secondDerivative = Math.abs((ttsNext - 2 * ttsCurr + ttsPrev) / (dt ** 2));
  const cv               = ensembleMean > 0 ? ensembleStd / ensembleMean : 0;
  return secondDerivative + cv;
};

/**
 * Freedom Index = F_structural^α × F_temporal^(1-α)
 *
 * F_temporal   = 1 − (TTS/TTS_horizon) × (v/v_max)²
 * F_structural = 1 / (1 + (criticality/10) × causal_links)
 */
export const calcFreedomIndex = (params: {
  tts: number;
  ttsHorizon: number;
  vRatio: number;
  criticality: number;   // ψ/ψ_c
  causalLinks: number;
  alpha?: number;        // industry/maturity weighting, default 0.5
}): { fTemporal: number; fStructural: number; freedom: number } => {
  const alpha = params.alpha ?? 0.5;
  const fTemporal   = Math.max(0, 1 - (params.tts / params.ttsHorizon) * params.vRatio ** 2);
  const fStructural = 1 / (1 + (params.criticality / 10) * params.causalLinks);
  const freedom     = Math.pow(fStructural, alpha) * Math.pow(fTemporal, 1 - alpha);
  return { fTemporal, fStructural, freedom };
};

/**
 * Von Neumann Entropy: S(ρ) = −Σᵢ λᵢ log₂(λᵢ)
 * λᵢ are eigenvalues of the density matrix (= state probabilities for diagonal)
 */
export const calcVonNeumannEntropy = (stateProbabilities: number[]): number => {
  const total = stateProbabilities.reduce((a, b) => a + b, 0);
  const normalised = stateProbabilities.map(p => p / total);
  return -normalised
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
};

/**
 * Urgency Index (RADAR variant)
 * UI = PI × γ × (2 − S_ratio)
 * where S_ratio = S / S_max
 */
export const calcRadarUrgencyIndex = (
  phaseIndex: number,
  lorentzGamma: number,
  entropyRatio: number
): number => phaseIndex * lorentzGamma * (2 - entropyRatio);

/**
 * Full RADAR calculation chain for a single risk
 */
export const runRadarChain = (params: {
  baseInputs: TTSInputs;
  correlationMatrix: number[][];
  psiCurrent: number;
  psiCritical: number;
  ttsHorizon: number;
  causalLinks: number;
  ttsPrev?: number;   // for Phase Index (need 3 periods)
  ttsNext?: number;
  dt?: number;
}) => {
  // Phase 1: base TTS
  const ttsResult = calcTTS(params.baseInputs);

  // Phase 2: MC ensemble
  const ensemble  = runMonteCarloEnsemble(params.baseInputs);

  // Coherence
  const coherence = calcCoherenceFactor(params.correlationMatrix);

  // Phase proximity
  const phaseProx = calcPhaseProximity(params.psiCurrent, params.psiCritical);

  // EW-TTS
  const ewTts     = calcEWTTS(ensemble.mean, coherence, phaseProx);

  // Freedom
  const { fTemporal, fStructural, freedom } = calcFreedomIndex({
    tts: ewTts,
    ttsHorizon: params.ttsHorizon,
    vRatio: params.baseInputs.vRatio,
    criticality: params.psiCurrent / params.psiCritical,
    causalLinks: params.causalLinks,
  });

  // Palmer Noise
  const palmerNoise = calcPalmerNoise(freedom);

  // MC bounds
  const mcBounds = calcMCBounds(ewTts, palmerNoise);

  // Phase Index (requires 3 data points)
  let phaseIndex = 0;
  if (params.ttsPrev !== undefined && params.ttsNext !== undefined) {
    phaseIndex = calcPhaseIndex(
      params.ttsPrev, ttsResult.tts, params.ttsNext,
      params.dt ?? 1,
      ensemble.std, ensemble.mean
    );
  }

  // Von Neumann Entropy (approximate from MC spread)
  const sMax = Math.log2(4); // 4-state system
  const entropyS = Math.min(sMax, ensemble.std / (ensemble.mean || 1));
  const entropyRatio = entropyS / sMax;

  // RADAR Urgency Index
  const urgencyIndex = calcRadarUrgencyIndex(phaseIndex, ttsResult.lorentzFactor, entropyRatio);

  // Priority classification
  let priority = 'LOW';
  if (ewTts > 50) priority = 'CRITICAL';
  else if (ewTts > 15) priority = 'HIGH';
  else if (ewTts > 5) priority = 'MEDIUM';

  return {
    // Phase 1 outputs
    ...ttsResult,
    // Phase 2 outputs
    ensembleMean: ensemble.mean,
    ensembleStd: ensemble.std,
    coherenceFactor: coherence,
    phaseProximity: phaseProx,
    ewTts,
    lorentzEwTts: ewTts / ttsResult.lorentzFactor,
    // Decision guidance
    fTemporal, fStructural, freedomIndex: freedom,
    palmerNoise,
    mcP10: mcBounds.p10, mcP50: mcBounds.p50, mcP90: mcBounds.p90,
    phaseIndex,
    entropyS, entropyRatio,
    urgencyIndex,
    priority,
  };
};
