import { PrismaClient } from '@prisma/client'
import { config } from './env'

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = global.__prisma ?? new PrismaClient({
  datasources: config.DATABASE_URL ? { db: { url: config.DATABASE_URL } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma
