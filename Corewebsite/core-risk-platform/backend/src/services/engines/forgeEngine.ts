/**
 * FORGE© Engine — Bounded Response TTS (R-TTS)
 * Based on White Paper: FORGE© Framework (Part 3)
 *
 * R-TTS = [L×I×log₂(1+V) × (1+A×min(exp(αt),20))] / √(1−min(v/vm,0.95)²) × [1+β×σ((ψ−ψc)/δ)]
 *
 * Key differences from CORE (RADAR):
 *   - Velocity: log₂(1+V) — logarithmic compression
 *   - Amplification: min(exp(αt), 20) — capped at 20×
 *   - Lorentz: min(v/v_max, 0.95) — max factor ≈ 3.2
 *   - Criticality: sigmoid instead of power-law
 */

import { normaliseImpact, calcPalmerNoise, calcMCBounds } from './coreEngine';

export interface RTTSInputs {
  likelihood: number;
  impactEur: number;
  velocity: number;         // raw V
  amplificationA: number;
  accelerationAlpha: number;
  timeQuarters: number;
  vRatio: number;           // raw v/v_max (before soft-cap)
  psi: number;              // ψ — current system stress
  psiCritical: number;      // ψ_c
  delta: number;            // δ — sigmoid transition width
  beta: number;             // β
}

// ── Bounded velocity: log₂(1+V) ──────────────────────────────
export const boundedVelocity = (V: number): number =>
  Math.log2(1 + Math.max(0, V));

// ── Bounded amplification: min(exp(αt), 20) ──────────────────
export const boundedAmplification = (
  A: number, alpha: number, t: number, cap: number = 20
): number => 1 + A * Math.min(Math.exp(alpha * t), cap);

// ── Soft-capped Lorentz: min(v/v_max, 0.95) ──────────────────
// Max factor = 1/√(1−0.95²) = 1/√(0.0975) ≈ 3.20
export const softCappedLorentz = (vRatio: number, cap: number = 0.95): number => {
  const cappedRatio = Math.min(Math.max(0, vRatio), cap);
  return 1 / Math.sqrt(1 - cappedRatio ** 2);
};

// ── Sigmoid criticality: σ((ψ−ψc)/δ) ────────────────────────
// σ(x) = 1/(1+exp(-x))
export const sigmoidCriticality = (
  psi: number, psiCritical: number, delta: number, beta: number
): number => {
  const x = (psi - psiCritical) / delta;
  const sigmoid = 1 / (1 + Math.exp(-x));
  return 1 + beta * sigmoid;
};

// ── Full R-TTS calculation ────────────────────────────────────
export const calcRTTS = (inputs: RTTSInputs) => {
  const impactScore   = normaliseImpact(inputs.impactEur);
  const expectedLoss  = inputs.likelihood * inputs.impactEur;
  const velBounded    = boundedVelocity(inputs.velocity);
  const ampTerm       = boundedAmplification(inputs.amplificationA, inputs.accelerationAlpha, inputs.timeQuarters);
  const numerator     = inputs.likelihood * impactScore * velBounded * ampTerm;
  const lorentz       = softCappedLorentz(inputs.vRatio);
  const afterInertia  = numerator * lorentz;
  const critMult      = sigmoidCriticality(inputs.psi, inputs.psiCritical, inputs.delta, inputs.beta);
  const rTts          = afterInertia * critMult;

  return { impactScore, expectedLoss, velBounded, ampTerm, numerator, lorentz, afterInertia, critMult, rTts };
};

// ─────────────────────────────────────────────────────────────
// RESILIENCE INDEX
// RI = 0.35×CE + 0.30×TC + 0.25×RC + 0.10×SR
// ─────────────────────────────────────────────────────────────

export interface ControlLayer { strength: number; quality: number; }

/**
 * CE = 1 − ∏(1 − sᵢ × qᵢ)
 */
export const calcControlEffectiveness = (controls: ControlLayer[]): number => {
  if (controls.length === 0) return 0;
  const product = controls.reduce((prod, c) => prod * (1 - c.strength * c.quality), 1);
  return 1 - product;
};

/**
 * RC = (Budget_Available / Budget_Required) × (1 / Decision_Lag_days) × Historical_Success_Rate
 */
export const calcResponseCapacity = (
  budgetRatio: number,
  decisionLagDays: number,
  historicalSuccessRate: number
): number => budgetRatio * (1 / Math.max(1, decisionLagDays)) * historicalSuccessRate;

/**
 * TC = (Expertise / 5) × (FTE_Deployed / FTE_Required)
 */
export const calcTeamCapability = (
  expertise: number,   // 1-5
  fteDeployed: number,
  fteRequired: number
): number => (expertise / 5) * (Math.min(fteDeployed, fteRequired) / Math.max(1, fteRequired));

/**
 * SR = (1 − 1/R_factor) × MIN(1, RTO / ART)
 */
export const calcSystemRedundancy = (
  rFactor: number,    // 1 = single point of failure
  rto: number,        // Recovery Time Objective
  art: number         // Actual Recovery Time
): number => (1 - 1 / Math.max(1, rFactor)) * Math.min(1, rto / Math.max(0.001, art));

/**
 * Combined RI = 0.35×CE + 0.30×TC + 0.25×RC + 0.10×SR
 */
export const calcResilienceIndex = (
  ce: number, tc: number, rc: number, sr: number,
  weights = { ce: 0.35, tc: 0.30, rc: 0.25, sr: 0.10 }
): number => weights.ce * ce + weights.tc * tc + weights.rc * rc + weights.sr * sr;

export const interpretRI = (ri: number): string => {
  if (ri >= 0.75) return 'STRONG';
  if (ri >= 0.55) return 'ADEQUATE';
  if (ri >= 0.35) return 'MODERATE';
  return 'WEAK';
};

// ─────────────────────────────────────────────────────────────
// URGENCY INDEX
// U(t) = R-TTS(t) × (1 + V(t)) × (1 − T_remain/T_total)
// ─────────────────────────────────────────────────────────────
export const calcUrgencyIndex = (
  rTts: number,
  velocity: number,
  tRemain: number,
  tTotal: number
): number => rTts * (1 + velocity) * (1 - tRemain / Math.max(1, tTotal));

export const classifyUrgency = (urgency: number): string => {
  if (urgency >= 200) return 'EMERGENCY';
  if (urgency >= 50)  return 'CRISIS';
  if (urgency >= 10)  return 'ACCELERATED';
  return 'STANDARD';
};

// ─────────────────────────────────────────────────────────────
// BACKCASTING MILESTONES (Section 5.1)
// ─────────────────────────────────────────────────────────────
export const calcBackcastMilestones = (ttsBaseline: number, ttsPeak: number) => ({
  containment:  ttsPeak    * 0.70,   // Stop spread
  stabilisation: ttsPeak   * 0.30,   // Halt deterioration
  recovery:     ttsBaseline * 2.00,  // Return to function
  resilience:   ttsBaseline * 1.20,  // Exceed previous baseline
});

/**
 * Required Reduction Rate = (TTS_current − TTS_target) / Periods_Remaining
 */
export const calcRequiredReductionRate = (
  ttsCurrent: number,
  ttsTarget: number,
  periodsRemaining: number
): number => (ttsCurrent - ttsTarget) / Math.max(1, periodsRemaining);

// ─────────────────────────────────────────────────────────────
// FORGE Opportunity: Palmer Noise
// σ_opportunity = 0.1 + 0.3 × (1 − Capture_Status)
// ─────────────────────────────────────────────────────────────
export const calcOpportunityPalmerNoise = (captureStatus: number): number =>
  0.1 + 0.3 * (1 - Math.max(0, Math.min(1, captureStatus)));

// ─────────────────────────────────────────────────────────────
// Full FORGE chain for a single crisis
// ─────────────────────────────────────────────────────────────
export const runForgeChain = (params: {
  rTtsInputs: RTTSInputs;
  controls: ControlLayer[];
  budgetRatio: number;
  decisionLagDays: number;
  historicalSuccessRate: number;
  expertiseScore: number;
  fteDeployed: number;
  fteRequired: number;
  rFactor: number;
  rto: number;
  art: number;
  containmentIndex: number;   // CI ∈ [0,1]
  tRemain: number;
  tTotal: number;
  ttsBaseline: number;
  ttsPeak?: number;
}) => {
  const rTtsResult = calcRTTS(params.rTtsInputs);

  const ce = calcControlEffectiveness(params.controls);
  const rc = calcResponseCapacity(params.budgetRatio, params.decisionLagDays, params.historicalSuccessRate);
  const tc = calcTeamCapability(params.expertiseScore, params.fteDeployed, params.fteRequired);
  const sr = calcSystemRedundancy(params.rFactor, params.rto, params.art);
  const ri = calcResilienceIndex(ce, tc, rc, sr);

  const urgency = calcUrgencyIndex(rTtsResult.rTts, params.rTtsInputs.velocity, params.tRemain, params.tTotal);
  const urgencyClass = classifyUrgency(urgency);

  const palmerNoise = 0.1 + 0.3 * (1 - params.containmentIndex);
  const mcBounds    = calcMCBounds(rTtsResult.rTts, palmerNoise);

  const ttsPeak = params.ttsPeak ?? rTtsResult.rTts;
  const milestones = calcBackcastMilestones(params.ttsBaseline, ttsPeak);

  return {
    ...rTtsResult,
    ce, rc, tc, sr, ri,
    riLabel: interpretRI(ri),
    urgency, urgencyClass,
    palmerNoise,
    mcP10: mcBounds.p10, mcP50: mcBounds.p50, mcP90: mcBounds.p90,
    milestones,
  };
};
