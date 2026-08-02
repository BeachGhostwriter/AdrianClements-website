import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import { prisma } from '../config/db'
import bcrypt from 'bcryptjs'
export const usersRoutes = Router()
usersRoutes.use(authenticate, scopeToBusinessUnits, requireRole('ADMIN'))
usersRoutes.get('/', async (req: any, res) => {
  const users = await prisma.user.findMany({
    where: {
      businessUnitMemberships: { some: { businessUnitId: { in: req.buFilter ?? ['__none__'] } } },
    },
    select: { id: true, name: true, email: true, role: true, isActive: true,
      businessUnitMemberships: { include: { businessUnit: { select: { id: true, name: true, code: true } } } } },
  })
  res.json({ success: true, data: users })
})
usersRoutes.post('/', async (req: any, res) => {
  try {
    const { email, password, name, role, businessUnitIds = [] } = req.body
    const scopedBuIds = (businessUnitIds as string[]).filter((id) => (req.buFilter || []).includes(id))
    if (scopedBuIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one scoped business unit is required' })
    }

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        name,
        role,
        businessUnitMemberships: {
          create: scopedBuIds.map((businessUnitId) => ({ businessUnitId })),
        },
      },
    })
    res.status(201).json({ success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
usersRoutes.put('/:id', async (req: any, res) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { businessUnitMemberships: { select: { businessUnitId: true } } },
    })
    if (!existing) return res.status(404).json({ success: false, message: 'User not found' })

    const hasScopedMembership = existing.businessUnitMemberships.some((m) => (req.buFilter || []).includes(m.businessUnitId))
    if (!hasScopedMembership) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const { password, ...rest } = req.body
    const data: any = { ...rest }
    if (password) data.passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    res.json({ success: true, data: user })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
