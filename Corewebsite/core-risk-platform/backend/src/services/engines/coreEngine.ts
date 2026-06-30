/**
 * CORE© Engine — TTS / OTS calculation
 * Based on White Paper: CORE© Framework (Part 1)
 *
 * TTS(t) = {[L(t) × I(t) × V(t) × (1 + A × exp(α·t))] / √(1−(v/v_max)²)} × [1+β×(ψ/ψ_c)^γ]
 * OTS(t) = {[P(t) × B(t) × U(t) × (1 + S × exp(σ·t))] / √(1+(d/d_min)²)} × [1+k×(R/R_opt)^λ]
 */

export interface TTSInputs {
  // Base risk score
  likelihood: number;       // L(t) ∈ [0, 1]
  impactEur: number;        // Raw financial impact in €M
  velocity: number;         // V(t) = 1/TTI (TTI in years)

  // Amplification
  amplificationA: number;   // A ∈ [0, 3] — network cascade coefficient
  accelerationAlpha: number;// α ∈ [0, 1] — exponential growth rate
  timeQuarters: number;     // t — quarters elapsed

  // Information inertia (Lorentz)
  vRatio: number;           // v/v_max ∈ [0, 0.99]

  // Criticality
  psiRatio: number;         // ψ/ψ_c — system stress vs critical threshold
  beta: number;             // β — amplification constant, typically 2.0
  gamma: number;            // γ — criticality exponent, typically 3.0
}

export interface TTSResult {
  impactScore: number;      // MIN(10,MAX(1,2×LN(€M+1)))
  expectedLoss: number;     // L × ImpactEur
  baseScore: number;        // L × I_score × V
  amplificationTerm: number;// 1 + A × exp(α·t)
  amplifiedBase: number;    // baseScore × amplificationTerm
  lorentzFactor: number;    // 1/√(1−(v/v_max)²)
  afterInertia: number;     // amplifiedBase / lorentzFactor (NOTE: formula divides by √ term)
  criticalityMultiplier: number; // 1 + β×(ψ/ψ_c)^γ
  tts: number;              // Final TTS
}

/**
 * Impact normalisation: I_score = MIN(10, MAX(1, 2×LN(€M+1)))
 * Converts raw €M impact to logarithmic 1-10 scale
 */
export const normaliseImpact = (impactEur: number): number =>
  Math.min(10, Math.max(1, 2 * Math.log(impactEur + 1)));

/**
 * Step 1: Base Risk Score = L × I × V
 */
export const calcBaseScore = (L: number, I: number, V: number): number => L * I * V;

/**
 * Step 2: Amplification Term = 1 + A × exp(α·t)
 */
export const calcAmplification = (A: number, alpha: number, t: number): number =>
  1 + A * Math.exp(alpha * t);

/**
 * Step 3: Information Inertia (Lorentz) Factor = 1/√(1−(v/v_max)²)
 * RADAR: unbounded (raw ratio, capped at 0.999 to prevent ÷0)
 */
export const calcLorentzFactor = (vRatio: number): number => {
  const safeRatio = Math.min(vRatio, 0.999);
  return 1 / Math.sqrt(1 - safeRatio ** 2);
};

/**
 * Step 4: Criticality Multiplier = 1 + β × (ψ/ψ_c)^γ
 * RADAR: power-law (sharp phase transition)
 */
export const calcCriticalityPowerLaw = (psiRatio: number, beta: number, gamma: number): number =>
  1 + beta * Math.pow(psiRatio, gamma);

/**
 * Full CORE TTS calculation (RADAR — unbounded)
 */
export const calcTTS = (inputs: TTSInputs): TTSResult => {
  const impactScore     = normaliseImpact(inputs.impactEur);
  const expectedLoss    = inputs.likelihood * inputs.impactEur;
  const baseScore       = calcBaseScore(inputs.likelihood, impactScore, inputs.velocity);
  const amplificationTerm = calcAmplification(inputs.amplificationA, inputs.accelerationAlpha, inputs.timeQuarters);
  const amplifiedBase   = baseScore * amplificationTerm;
  const lorentzFactor   = calcLorentzFactor(inputs.vRatio);
  // NOTE: formula divides — TTS amplified numerator then divided by √ term
  // The white paper writes: {numerator / √(1-(v/vmax)²)} which = numerator × Lorentz
  const afterInertia    = amplifiedBase * lorentzFactor;
  const criticalityMultiplier = calcCriticalityPowerLaw(inputs.psiRatio, inputs.beta, inputs.gamma);
  const tts             = afterInertia * criticalityMultiplier;

  return {
    impactScore, expectedLoss, baseScore,
    amplificationTerm, amplifiedBase,
    lorentzFactor, afterInertia,
    criticalityMultiplier, tts,
  };
};

// ─────────────────────────────────────────────────────────────
// OTS — Opportunity Trajectory Score
// ─────────────────────────────────────────────────────────────

export interface OTSInputs {
  probability: number;      // P(t) — success likelihood
  benefitEur: number;       // B(t) in €M
  timeToWindow: number;     // TTW in years → urgency U = 1/TTW
  synergyS: number;         // S ∈ [1.0, 3.0]
  growthSigma: number;      // σ — opportunity growth rate
  timeQuarters: number;     // t
  dRatio: number;           // d/d_min — difficulty ratio
  readinessR: number;       // R current readiness
  readinessK: number;       // k default 1.0
  readinessLambda: number;  // λ default 2.0
}

export const calcOTS = (inputs: OTSInputs) => {
  const benefitScore = normaliseImpact(inputs.benefitEur);
  const urgency      = 1 / Math.max(inputs.timeToWindow, 0.001);
  const synTerm      = 1 + inputs.synergyS * Math.exp(inputs.growthSigma * inputs.timeQuarters);
  const numerator    = inputs.probability * benefitScore * urgency * synTerm;
  // Difficulty DAMPS (addition under √, not subtraction)
  const difficultyFactor = 1 / Math.sqrt(1 + inputs.dRatio ** 2);
  const afterDifficulty  = numerator * difficultyFactor;
  const readinessMult    = 1 + inputs.readinessK * Math.pow(inputs.readinessR, inputs.readinessLambda);
  const ots              = afterDifficulty * readinessMult;

  return { benefitScore, urgency, synTerm, numerator, difficultyFactor, afterDifficulty, readinessMult, ots };
};

// ─────────────────────────────────────────────────────────────
// Palmer Noise: σ = 0.1 + 0.3 × (1 − F)
// ─────────────────────────────────────────────────────────────
export const calcPalmerNoise = (freedomIndex: number): number =>
  0.1 + 0.3 * (1 - Math.max(0, Math.min(1, freedomIndex)));

// ─────────────────────────────────────────────────────────────
// MC bounds: value ± 1.645 × η (90% CI)
// ─────────────────────────────────────────────────────────────
export const calcMCBounds = (centralValue: number, palmerNoise: number) => ({
  p10: centralValue * (1 - 1.645 * palmerNoise),
  p50: centralValue,
  p90: centralValue * (1 + 1.645 * palmerNoise),
});
