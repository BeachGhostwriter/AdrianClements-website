/**
 * RiskCalculationService
 * Orchestrates CORE → RADAR → FORGE engine calculations
 * and persists results back to the database
 */

import { calculateEWTTS } from 'radar-engine'
import { calculateForge } from 'forge-engine'
import { DEFAULT_CALIBRATION } from 'core-engine'
import { prisma } from '../../config/db'
import type { CoreInputs, CalibrationParams } from 'shared-types'

export class RiskCalculationService {
  /**
   * Compute full RADAR chain for a risk
   * Returns computed fields to persist on the Risk model
   */
  async computeRadar(risk: {
    businessUnitId: string
    probability: number
    impactEur: number
    velocity: number
    amplification: number
    accelerationRate: number
    propagationRatio: number
    timeQuarters?: number
  }): Promise<Record<string, number | string | null>> {
    const calib = await this.getCalibration(risk.businessUnitId)
    const inputs: CoreInputs = {
      probability: risk.probability,
      impactEur: risk.impactEur,
      velocity: risk.velocity,
      amplification: risk.amplification,
      accelerationRate: risk.accelerationRate,
      propagationRatio: risk.propagationRatio,
      timeQuarters: risk.timeQuarters ?? 0,
    }

    // Get system criticality from active risks in this BU
    const systemCriticality = await this.getSystemCriticality(risk.businessUnitId)

    // Get correlation matrix
    const rhoMatrix = await this.getCorrelationMatrix(risk.businessUnitId)

    const result = calculateEWTTS(inputs, calib, rhoMatrix, systemCriticality)

    // Priority classification based on urgency
    let priority = 'MONITOR'
    if (result.urgencyIndex >= 200) priority = 'CRITICAL'
    else if (result.urgencyIndex >= 50) priority = 'HIGH'
    else if (result.urgencyIndex >= 10) priority = 'MEDIUM'
    else if (result.urgencyIndex >= 1) priority = 'LOW'

    return {
      impactScore: result.impactScore,
      expectedLoss: result.expectedLoss,
      lorentzFactor: result.lorentzFactor,
      ewTts: result.ewTts,
      ewTtsLorentz: result.ewTtsLorentz,
      phaseIndex: result.phaseIndex,
      freedomIndex: result.freedomIndex,
      entropyS: result.entropyS,
      entropyRatio: result.entropyRatio,
      urgencyIndex: result.urgencyIndex,
      palmerNoise: result.palmerNoise,
      mcP10: result.mcP10,
      mcP50: result.mcP50,
      mcP90: result.mcP90,
      cohFactor: result.coherenceFactor,
      priority,
    }
  }

  /**
   * Compute FORGE R-TTS for a crisis
   */
  async computeForge(crisis: {
    businessUnitId: string
    probability: number
    impactEur: number
    velocity: number
    amplification: number
    accelerationRate: number
    propagationRatio: number
    severity: number
    responseEffectiveness: number
    resourceFactor: number
    containmentIndex: number
    tRemain?: number
    tTotal?: number
  }): Promise<Record<string, number | string | null>> {
    const calib = await this.getCalibration(crisis.businessUnitId)
    const systemCriticality = await this.getSystemCriticality(crisis.businessUnitId)

    const result = calculateForge(
      {
        ...crisis,
        tRemain: crisis.tRemain ?? 6,
        tTotal: crisis.tTotal ?? 12,
      },
      calib,
      systemCriticality,
    )

    return {
      rTts: result.rTts,
      residualEur: result.residualEur,
      residualScore: result.residualScore,
      urgencyIndex: result.urgencyIndex,
      urgencyClass: result.urgencyClass,
      recoveryMonths: result.recoveryMonths,
      recoveryDays: result.recoveryDays,
      palmerNoise: result.palmerNoise,
      mcRLow: result.mcRLow,
      mcRMid: result.mcRMid,
      mcRHigh: result.mcRHigh,
      mitigROI: result.mitigROI,
      backcast25: result.backcast25,
      backcast50: result.backcast50,
      backcast75: result.backcast75,
      backcast95: result.backcast95,
    }
  }

  private async getCalibration(businessUnitId: string): Promise<CalibrationParams> {
    const calib = await prisma.calibration.findUnique({ where: { businessUnitId } })
    if (!calib) return DEFAULT_CALIBRATION
    return {
      vMax: calib.vMax,
      psiC: calib.psiC,
      beta: calib.beta,
      gamma: calib.gamma,
      alpha: calib.alpha,
      delta: calib.delta,
      ttsHorizon: calib.ttsHorizon,
      kappaCoh: calib.kappaCoh,
      alphaWeight: calib.alphaWeight,
      asymmetryFactor: calib.asymmetryFactor,
    }
  }

  private async getSystemCriticality(businessUnitId: string): Promise<number> {
    const risks = await prisma.risk.findMany({
      where: { businessUnitId, status: { in: ['ACTIVE', 'MONITORING'] } },
      select: { urgencyIndex: true },
    })
    if (risks.length === 0) return 0
    const scores = risks.map(r => r.urgencyIndex ?? 0)
    return scores.reduce((s, v) => s + v, 0) / scores.length
  }

  private async getCorrelationMatrix(businessUnitId: string): Promise<number[][]> {
    const correlations = await prisma.riskCorrelation.findMany({
      where: { riskA: { businessUnitId } },
      include: { riskA: true, riskB: true },
    })
    if (correlations.length === 0) return [[1]]
    // Build 5×5 matrix (simplified — use top 5 risks)
    const size = Math.min(5, Math.sqrt(correlations.length * 2 + 0.25) + 0.5)
    const matrix: number[][] = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => i === j ? 1 : 0)
    )
    correlations.slice(0, size * size).forEach((c, idx) => {
      const i = Math.floor(idx / size)
      const j = idx % size
      if (i < size && j < size && i !== j) {
        matrix[i][j] = c.rho
        matrix[j][i] = c.rho
      }
    })
    return matrix
  }
}
