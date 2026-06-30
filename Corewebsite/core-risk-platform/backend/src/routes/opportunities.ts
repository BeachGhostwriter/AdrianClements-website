import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits } from '../middleware/auth'
import { listOpportunities, createOpportunity, updateOpportunity, deleteOpportunity } from '../controllers/opportunityController'

export const opportunitiesRoutes = Router()
opportunitiesRoutes.use(authenticate, scopeToBusinessUnits)
opportunitiesRoutes.get('/',    listOpportunities)
opportunitiesRoutes.post('/',   requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), createOpportunity)
opportunitiesRoutes.put('/:id', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), updateOpportunity)
opportunitiesRoutes.delete('/:id', requireRole('ADMIN', 'DIVISION_HEAD'), deleteOpportunity)
