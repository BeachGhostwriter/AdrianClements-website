import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { AuthUser, UserRole } from 'shared-types'

export interface AuthRequest extends Request {
  user?: AuthUser
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' })
    }
    next()
  }
}

// Row-level security: filter data to user's business units (unless ADMIN)
export function scopeToBusinessUnits(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'ADMIN') return next()
  // Attach BU filter to request for use in controllers
  const buIds = req.user?.businessUnitIds ?? []
  ;(req as any).buFilter = buIds.length > 0 ? buIds : ['__none__']
  next()
}
