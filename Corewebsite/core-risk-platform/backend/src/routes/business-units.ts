import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits, clientCodeFromBusinessUnitCode, normaliseClientCode } from '../middleware/auth'
import { prisma } from '../config/db'
export const businessUnitsRoutes = Router()
businessUnitsRoutes.use(authenticate, scopeToBusinessUnits)
businessUnitsRoutes.get('/', async (req: any, res) => {
  const filter = { id: { in: req.buFilter ?? ['__none__'] } }
  const bus = await prisma.businessUnit.findMany({ where: filter, orderBy: { name: 'asc' } })
  res.json({ success: true, data: bus })
})
businessUnitsRoutes.post('/', requireRole('ADMIN'), async (req: any, res) => {
  try {
    const tenantCode = normaliseClientCode(req.user?.clientCode || '')
    const rawCode = String(req.body.code || '').trim().toUpperCase()
    if (!rawCode) return res.status(400).json({ success: false, message: 'Business unit code is required' })

    const prefixedCode = rawCode.includes('-') ? rawCode : `${tenantCode}-${rawCode}`
    if (clientCodeFromBusinessUnitCode(prefixedCode) !== tenantCode) {
      return res.status(400).json({ success: false, message: 'Business unit code must use your client code prefix' })
    }

    const bu = await prisma.businessUnit.create({ data: { ...req.body, code: prefixedCode } })
    res.status(201).json({ success: true, data: bu })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
businessUnitsRoutes.put('/:id', requireRole('ADMIN'), async (req: any, res) => {
  try {
    if (!(req.buFilter || []).includes(req.params.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const bu = await prisma.businessUnit.update({ where: { id: req.params.id }, data: req.body })
    res.json({ success: true, data: bu })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
