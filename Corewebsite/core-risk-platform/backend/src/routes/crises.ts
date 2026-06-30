import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import { listCrises, createCrisis, updateCrisis, deleteCrisis } from '../controllers/crisisController'

export const crisesRoutes = Router()
crisesRoutes.use(authenticate, scopeToBusinessUnits)
crisesRoutes.get('/',    listCrises)
crisesRoutes.post('/',   requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), createCrisis)
crisesRoutes.put('/:id', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), updateCrisis)
crisesRoutes.delete('/:id', requireRole('ADMIN', 'DIVISION_HEAD'), deleteCrisis)
