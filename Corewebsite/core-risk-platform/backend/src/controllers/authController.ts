import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db'
import type { AuthRequest } from '../middleware/auth'

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({
      where: { email },
      include: { businessUnitMemberships: { select: { businessUnitId: true } } },
    })
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessUnitIds: user.businessUnitMemberships.map(m => m.businessUnitId),
    }
    const secret = process.env.JWT_SECRET as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = jwt.sign(payload, secret, { expiresIn: '7d' } as any)
    res.json({ success: true, data: { token, user: payload } })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' })
  }
}

export async function me(req: AuthRequest, res: Response) {
  res.json({ success: true, data: req.user })
}

export async function logout(_req: Request, res: Response) {
  res.json({ success: true, message: 'Logged out' })
}

export async function refreshToken(req: Request, res: Response) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}
