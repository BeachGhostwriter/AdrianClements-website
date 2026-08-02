import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits, userCanAccessBusinessUnit } from '../middleware/auth'
import { prisma } from '../config/db'

export const objectivesRoutes = Router()
objectivesRoutes.use(authenticate, scopeToBusinessUnits)

objectivesRoutes.get('/', async (req: any, res) => {
  const buFilter = req.buFilter
  const { businessUnitId } = req.query
  const where: any = {}
  if (buFilter) where.businessUnitId = { in: buFilter }
  if (businessUnitId) where.businessUnitId = businessUnitId
  const objectives = await prisma.objective.findMany({
    where,
    include: { businessUnit: { select: { id: true, name: true } } },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })
  res.json({ success: true, data: objectives })
})

objectivesRoutes.post('/', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    if (!userCanAccessBusinessUnit(req, req.body.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden for selected business unit' })
    }
    const obj = await prisma.objective.create({ data: req.body })
    res.status(201).json({ success: true, data: obj })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

objectivesRoutes.put('/:id', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    const existing = await prisma.objective.findUnique({ where: { id: req.params.id }, select: { businessUnitId: true } })
    if (!existing) return res.status(404).json({ success: false, message: 'Objective not found' })
    if (!userCanAccessBusinessUnit(req, existing.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    const obj = await prisma.objective.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: obj })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

objectivesRoutes.delete('/:id', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    const existing = await prisma.objective.findUnique({ where: { id: req.params.id }, select: { businessUnitId: true } })
    if (!existing) return res.status(404).json({ success: false, message: 'Objective not found' })
    if (!userCanAccessBusinessUnit(req, existing.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    await prisma.objective.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
