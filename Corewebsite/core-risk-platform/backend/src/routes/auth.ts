import { Router } from 'express'
import { login, logout, me, refreshToken } from '../controllers/authController'
import { authenticate } from '../middleware/auth'

export const authRoutes = Router()
authRoutes.post('/login', login)
authRoutes.post('/logout', authenticate, logout)
authRoutes.get('/me', authenticate, me)
authRoutes.post('/refresh', refreshToken)
