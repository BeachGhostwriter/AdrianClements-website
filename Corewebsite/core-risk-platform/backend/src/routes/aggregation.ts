import { Router } from 'express'
import { authenticate, scopeToBusinessUnits } from '../middleware/auth'
import { prisma } from '../config/db'
export const aggregationRoutes = Router()
aggregationRoutes.use(authenticate, scopeToBusinessUnits)
aggregationRoutes.get('/', async (req: any, res) => {
  const buFilter = req.buFilter
  const data = await prisma.riskAggregation.findMany({
    where: buFilter ? { businessUnitId: { in: buFilter } } : {},
    include: { items: { include: { risk: { select: { riskId: true, name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data })
})
