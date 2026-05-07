import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import { prisma } from '../config/db'
export const businessUnitsRoutes = Router()
businessUnitsRoutes.use(authenticate)
businessUnitsRoutes.get('/', async (req: any, res) => {
  const filter = req.user?.role === 'ADMIN' ? {} : { id: { in: req.user?.businessUnitIds ?? [] } }
  const bus = await prisma.businessUnit.findMany({ where: filter, orderBy: { name: 'asc' } })
  res.json({ success: true, data: bus })
})
businessUnitsRoutes.post('/', requireRole('ADMIN'), async (req: any, res) => {
  try {
    const bu = await prisma.businessUnit.create({ data: req.body })
    res.status(201).json({ success: true, data: bu })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
businessUnitsRoutes.put('/:id', requireRole('ADMIN'), async (req: any, res) => {
  try {
    const bu = await prisma.businessUnit.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: bu })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
