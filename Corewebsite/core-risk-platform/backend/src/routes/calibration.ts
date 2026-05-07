import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import { prisma } from '../config/db'
export const calibrationRoutes = Router()
calibrationRoutes.use(authenticate, scopeToBusinessUnits)
calibrationRoutes.get('/:businessUnitId', async (req, res) => {
  const c = await prisma.calibration.findUnique({ where: { businessUnitId: req.params.businessUnitId } })
  res.json({ success: true, data: c })
})
calibrationRoutes.put('/:businessUnitId', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    const c = await prisma.calibration.upsert({
      where: { businessUnitId: req.params.businessUnitId },
      create: { businessUnitId: req.params.businessUnitId, ...req.body },
      update: req.body,
    })
    res.json({ success: true, data: c })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
