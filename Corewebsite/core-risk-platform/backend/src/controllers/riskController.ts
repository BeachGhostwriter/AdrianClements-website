import { Response } from 'express'
import { prisma } from '../config/db'
import { AuthRequest } from '../middleware/auth'
import { RiskCalculationService } from '../services/engines/riskCalculationService'

const calcService = new RiskCalculationService()

export async function listRisks(req: AuthRequest, res: Response) {
  try {
    const buFilter = (req as any).buFilter
    const { status, category, priority, businessUnitId, top10, longTerm } = req.query

    const where: any = {}
    if (buFilter) where.businessUnitId = { in: buFilter }
    if (businessUnitId) where.businessUnitId = businessUnitId
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority
    if (top10 === 'true') where.isTop10 = true
    if (longTerm === 'true') where.isLongTerm = true

    const risks = await prisma.risk.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        businessUnit: { select: { id: true, name: true, code: true } },
        controls: true,
      },
      orderBy: [{ priority: 'asc' }, { urgencyIndex: 'desc' }],
    })
    res.json({ success: true, data: risks })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getRisk(req: AuthRequest, res: Response) {
  try {
    const risk = await prisma.risk.findUnique({
      where: { id: req.params.id },
      include: {
        owner: true,
        businessUnit: true,
        controls: true,
        objectives: { include: { objective: true } },
        interactions: { include: { targetRisk: { select: { id: true, riskId: true, name: true } } } },
        correlations: true,
        trajectories: { orderBy: { quarter: 'asc' } },
      },
    })
    if (!risk) return res.status(404).json({ success: false, message: 'Risk not found' })
    res.json({ success: true, data: risk })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function createRisk(req: AuthRequest, res: Response) {
  try {
    const data = req.body
    const computed = await calcService.computeRadar(data)
    const risk = await prisma.risk.create({
      data: { ...data, ...computed },
    })
    res.status(201).json({ success: true, data: risk })
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message })
  }
}

export async function updateRisk(req: AuthRequest, res: Response) {
  try {
    const data = req.body
    const computed = await calcService.computeRadar(data)
    const risk = await prisma.risk.update({
      where: { id: req.params.id },
      data: { ...data, ...computed },
    })
    res.json({ success: true, data: risk })
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message })
  }
}

export async function deleteRisk(req: AuthRequest, res: Response) {
  try {
    await prisma.risk.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Risk deleted' })
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message })
  }
}

export async function recalculateRisk(req: AuthRequest, res: Response) {
  try {
    const risk = await prisma.risk.findUnique({ where: { id: req.params.id } })
    if (!risk) return res.status(404).json({ success: false, message: 'Not found' })
    const computed = await calcService.computeRadar(risk as any)
    const updated = await prisma.risk.update({ where: { id: req.params.id }, data: computed })
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getRiskTrajectories(req: AuthRequest, res: Response) {
  try {
    const trajectories = await prisma.riskTrajectory.findMany({
      where: { riskId: req.params.id },
      orderBy: { quarter: 'asc' },
    })
    res.json({ success: true, data: trajectories })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
}
