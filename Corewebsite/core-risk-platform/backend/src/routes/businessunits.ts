import { Router } from 'express'
import { authenticate, scopeToBusinessUnits } from '../middleware/auth'
export const businessUnitsRoutes = Router()
businessUnitsRoutes.use(authenticate, scopeToBusinessUnits)
// TODO: add businessUnits endpoints
