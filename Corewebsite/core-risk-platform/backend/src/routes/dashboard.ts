import { Router } from 'express'
import { authenticate, scopeToBusinessUnits } from '../middleware/auth'
import { getDashboard } from '../controllers/dashboardController'

export const dashboardRoutes = Router()
dashboardRoutes.use(authenticate, scopeToBusinessUnits)
dashboardRoutes.get('/', getDashboard)
