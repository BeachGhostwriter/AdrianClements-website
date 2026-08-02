import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import { prisma } from '../config/db'

export const interactionsRoutes = Router()
interactionsRoutes.use(authenticate, scopeToBusinessUnits)

interactionsRoutes.get('/', async (req: any, res) => {
  const buFilter = req.buFilter
  const data = await prisma.riskInteraction.findMany({
    where: {
      sourceRisk: buFilter ? { businessUnitId: { in: buFilter } } : undefined,
      targetRisk: buFilter ? { businessUnitId: { in: buFilter } } : undefined,
    },
    include: {
      sourceRisk: { select: { id: true, riskId: true, name: true, businessUnit: { select: { name: true } } } },
      targetRisk: { select: { id: true, riskId: true, name: true, businessUnit: { select: { name: true } } } },
    },
    orderBy: { strength: 'desc' },
  })
  res.json({ success: true, data })
})

// POST create interaction
interactionsRoutes.post('/', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const sourceRisk = await prisma.risk.findUnique({ where: { id: req.body.sourceRiskId }, select: { businessUnitId: true } })
    const targetRisk = await prisma.risk.findUnique({ where: { id: req.body.targetRiskId }, select: { businessUnitId: true } })
    if (!sourceRisk || !targetRisk) {
      return res.status(404).json({ success: false, message: 'Risk reference not found' })
    }
    if (!(req.buFilter || []).includes(sourceRisk.businessUnitId) || !(req.buFilter || []).includes(targetRisk.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const item = await prisma.riskInteraction.create({ data: req.body })
    res.status(201).json({ success: true, data: item })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

// PUT update interaction
interactionsRoutes.put('/:id', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const existing = await prisma.riskInteraction.findUnique({
      where: { id: req.params.id },
      include: { sourceRisk: { select: { businessUnitId: true } }, targetRisk: { select: { businessUnitId: true } } },
    })
    if (!existing) return res.status(404).json({ success: false, message: 'Interaction not found' })
    if (!(req.buFilter || []).includes(existing.sourceRisk.businessUnitId) || !(req.buFilter || []).includes(existing.targetRisk.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const item = await prisma.riskInteraction.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: item })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

// DELETE interaction
interactionsRoutes.delete('/:id', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    const existing = await prisma.riskInteraction.findUnique({
      where: { id: req.params.id },
      include: { sourceRisk: { select: { businessUnitId: true } }, targetRisk: { select: { businessUnitId: true } } },
    })
    if (!existing) return res.status(404).json({ success: false, message: 'Interaction not found' })
    if (!(req.buFilter || []).includes(existing.sourceRisk.businessUnitId) || !(req.buFilter || []).includes(existing.targetRisk.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    await prisma.riskInteraction.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
