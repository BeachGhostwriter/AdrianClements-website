import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import { prisma } from '../config/db'

export const interactionsRoutes = Router()
interactionsRoutes.use(authenticate, scopeToBusinessUnits)

// GET all interactions (with risk names)
interactionsRoutes.get('/', async (_req, res) => {
  const data = await prisma.riskInteraction.findMany({
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
    const item = await prisma.riskInteraction.create({ data: req.body })
    res.status(201).json({ success: true, data: item })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

// PUT update interaction
interactionsRoutes.put('/:id', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const item = await prisma.riskInteraction.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: item })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

// DELETE interaction
interactionsRoutes.delete('/:id', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    await prisma.riskInteraction.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
