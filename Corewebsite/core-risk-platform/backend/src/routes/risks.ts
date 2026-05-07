import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import * as ctrl from '../controllers/riskController'

export const riskRoutes = Router()
riskRoutes.use(authenticate, scopeToBusinessUnits)

riskRoutes.get('/',                ctrl.listRisks)
riskRoutes.get('/:id',             ctrl.getRisk)
riskRoutes.post('/',               requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), ctrl.createRisk)
riskRoutes.put('/:id',             requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), ctrl.updateRisk)
riskRoutes.delete('/:id',          requireRole('ADMIN', 'DIVISION_HEAD'), ctrl.deleteRisk)
riskRoutes.post('/:id/recalculate', ctrl.recalculateRisk)
riskRoutes.get('/:id/trajectories', ctrl.getRiskTrajectories)

// ── Risk Controls ──────────────────────────────────────────────
import { prisma } from '../config/db'

riskRoutes.get('/:id/controls', async (req: any, res) => {
  const controls = await prisma.riskControl.findMany({ where: { riskId: req.params.id } })
  res.json({ success: true, data: controls })
})

riskRoutes.post('/:id/controls', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const control = await prisma.riskControl.create({ data: { ...req.body, riskId: req.params.id } })
    res.status(201).json({ success: true, data: control })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

riskRoutes.put('/:id/controls/:controlId', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const control = await prisma.riskControl.update({ where: { id: req.params.controlId }, data: req.body })
    res.json({ success: true, data: control })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

riskRoutes.delete('/:id/controls/:controlId', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    await prisma.riskControl.delete({ where: { id: req.params.controlId } })
    res.json({ success: true })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
