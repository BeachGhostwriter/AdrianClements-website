import { Response } from 'express'
import { prisma } from '../config/db'
import { AuthRequest } from '../middleware/auth'
import { strategicPosture } from 'forge-engine'
import type { DashboardMetrics } from 'shared-types'

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const buFilter = (req as any).buFilter
    const where = buFilter ? { businessUnitId: { in: buFilter } } : {}

    const [activeRisks, criticalRisks, activeCrises, opportunities, latestResilience] = await Promise.all([
      prisma.risk.count({ where: { ...where, status: { in: ['ACTIVE','MONITORING'] } } }),
      prisma.risk.count({ where: { ...where, priority: 'CRITICAL' } }),
      prisma.crisis.count({ where: { ...where, status: { in: ['ACTIVE','CONTAINMENT','STABILISATION'] } } }),
      prisma.opportunity.findMany({ where, select: { upsideEur: true, expectedValue: true } }),
      prisma.resilienceSnapshot.findFirst({
        where: buFilter ? { businessUnitId: { in: buFilter } } : {},
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const riskMetrics = await prisma.risk.aggregate({
      where: { ...where, status: { in: ['ACTIVE','MONITORING'] } },
      _sum: { expectedLoss: true },
      _avg: { cohFactor: true, phaseIndex: true },
    })

    const ri = latestResilience?.resilienceIndex ?? 0.5
    const smi = latestResilience?.smi ?? 0.5
    const posture = strategicPosture(ri, smi)

    const metrics: DashboardMetrics = {
      resilienceIndex: ri,
      smi,
      strategicPosture: posture,
      activeRadarRisks: activeRisks,
      criticalAlerts: criticalRisks,
      activeForgeCrises: activeCrises,
      totalExpectedLossEur: riskMetrics._sum?.expectedLoss ?? 0,
      totalOppValueEur: opportunities.reduce((s, o) => s + (o.upsideEur ?? 0), 0),
      coherenceFactor: riskMetrics._avg?.cohFactor ?? 1.0,
      systemPhaseIndex: riskMetrics._avg?.phaseIndex ?? 0,
    }
    res.json({ success: true, data: metrics })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}
