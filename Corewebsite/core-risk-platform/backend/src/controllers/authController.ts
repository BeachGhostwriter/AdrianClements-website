import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/db'
import { config } from '../config/env'
import type { AuthRequest } from '../middleware/auth'
import { clientCodeFromBusinessUnitCode, normaliseClientCode } from '../middleware/auth'

export async function login(req: Request, res: Response) {
  try {
    const { email, password, clientCode } = req.body
    const tenantCode = normaliseClientCode(clientCode)
    if (!tenantCode) return res.status(400).json({ success: false, message: 'Client code is required' })

    const user = await prisma.user.findUnique({
      where: { email },
      include: { businessUnitMemberships: { select: { businessUnitId: true, businessUnit: { select: { code: true } } } } },
    })
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const scopedMemberships = user.businessUnitMemberships.filter((m: any) => {
      const code = clientCodeFromBusinessUnitCode(m.businessUnit.code)
      return code === tenantCode
    })
    if (scopedMemberships.length === 0) {
      return res.status(403).json({ success: false, message: 'No access for selected client code' })
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientCode: tenantCode,
      businessUnitIds: scopedMemberships.map((m: any) => m.businessUnitId),
    }
    const secret = config.JWT_SECRET
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
