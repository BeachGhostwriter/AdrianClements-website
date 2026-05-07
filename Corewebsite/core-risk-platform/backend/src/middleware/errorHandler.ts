import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err.message, { stack: err.stack })
  const status = err.status ?? err.statusCode ?? 500
  res.status(status).json({
    success: false,
    message: err.message ?? 'Internal server error',
  })
}
