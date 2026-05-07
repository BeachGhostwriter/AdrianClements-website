import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import { prisma } from '../config/db'
import bcrypt from 'bcryptjs'
export const usersRoutes = Router()
usersRoutes.use(authenticate, requireRole('ADMIN'))
usersRoutes.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true,
    businessUnitMemberships: { include: { businessUnit: { select: { name: true } } } } } })
  res.json({ success: true, data: users })
})
usersRoutes.post('/', async (req: any, res) => {
  try {
    const { email, password, name, role } = req.body
    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { email, passwordHash: hash, name, role } })
    res.status(201).json({ success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
usersRoutes.put('/:id', async (req: any, res) => {
  try {
    const { password, ...rest } = req.body
    const data: any = { ...rest }
    if (password) data.passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.update({ where: { id: req.params.id }, data })
    res.json({ success: true, data: user })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
