import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
dotenv.config()

import { authRoutes } from './routes/auth'
import { dashboardRoutes } from './routes/dashboard'
import { riskRoutes } from './routes/risks'
import { crisesRoutes } from './routes/crises'
import { opportunitiesRoutes } from './routes/opportunities'
import { businessUnitsRoutes } from './routes/business-units'
import { usersRoutes } from './routes/users'
import { calibrationRoutes } from './routes/calibration'
import { aggregationRoutes } from './routes/aggregation'
import { objectivesRoutes } from './routes/objectives'
import { interactionsRoutes } from './routes/interactions'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { logger } from './utils/logger'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

app.use('/api/auth',         authRoutes)
app.use('/api/dashboard',    dashboardRoutes)
app.use('/api/risks',        riskRoutes)
app.use('/api/crises',       crisesRoutes)
app.use('/api/opportunities', opportunitiesRoutes)
app.use('/api/business-units', businessUnitsRoutes)
app.use('/api/users',        usersRoutes)
app.use('/api/calibration',  calibrationRoutes)
app.use('/api/aggregation',  aggregationRoutes)
app.use('/api/objectives',    objectivesRoutes)
app.use('/api/interactions', interactionsRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }))
app.use(errorHandler)

app.listen(PORT, () => logger.info(`CORE v7 API running on port ${PORT}`))
export default app
