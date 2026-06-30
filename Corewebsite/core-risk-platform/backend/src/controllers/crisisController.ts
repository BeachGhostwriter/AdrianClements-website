import { Response } from 'express'
import { prisma } from '../config/db'
import { AuthRequest } from '../middleware/auth'
import { RiskCalculationService } from '../services/engines/riskCalculationService'

const calcService = new RiskCalculationService()

export async function listCrises(req: AuthRequest, res: Response) {
  try {
    const buFilter = (req as any).buFilter
    const crises = await prisma.crisis.findMany({
      where: buFilter ? { businessUnitId: { in: buFilter } } : {},
      include: { owner: { select: { id: true, name: true } }, businessUnit: { select: { name: true } } },
      orderBy: { urgencyIndex: 'desc' },
    })
    res.json({ success: true, data: crises })
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }) }
}

export async function createCrisis(req: AuthRequest, res: Response) {
  try {
    const data = req.body
    if (!data.crisisId) {
      const count = await prisma.crisis.count({ where: { businessUnitId: data.businessUnitId } })
      data.crisisId = `C-${String(count + 1).padStart(3, '0')}`
    }
    const computed = await calcService.computeForge({
      ...data,
      responseEffectiveness: data.responseEffectiveness ?? 0.5,
      resourceFactor: data.resourceFactor ?? 0.5,
      containmentIndex: data.containmentIndex ?? 0.5,
      tRemain: data.tRemain ?? 6,
      tTotal: data.tTotal ?? 12,
    })
    const crisis = await prisma.crisis.create({ data: { ...data, ...computed } })
    res.status(201).json({ success: true, data: crisis })
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }) }
}

export async function updateCrisis(req: AuthRequest, res: Response) {
  try {
    const data = req.body
    const computed = await calcService.computeForge({
      ...data,
      responseEffectiveness: data.responseEffectiveness ?? 0.5,
      resourceFactor: data.resourceFactor ?? 0.5,
      containmentIndex: data.containmentIndex ?? 0.5,
      tRemain: data.tRemain ?? 6,
      tTotal: data.tTotal ?? 12,
    })
    const crisis = await prisma.crisis.update({ where: { id: req.params.id }, data: { ...data, ...computed } })
    res.json({ success: true, data: crisis })
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }) }
}

export async function deleteCrisis(req: AuthRequest, res: Response) {
  try {
    await prisma.crisis.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Crisis deleted' })
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }) }
}
