/**
 * Database seed — creates admin user + demo business unit
 * Run: npm run db:seed  (from project root)
 */
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/db'
import dotenv from 'dotenv'
dotenv.config()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@core-platform.local'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Platform Administrator'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

async function main() {
  console.log('🌱 Seeding CORE v7 database...')

  // Demo business unit
  const bu = await prisma.businessUnit.upsert({
    where:  { code: 'DEMO' },
    update: {},
    create: {
      name:   'Demo Organisation',
      code:   'DEMO',
      group:  'Hydreatio',
      region: 'Europe',
    },
  })

  if (!ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD must be set in environment before running seed')
  }

  // Admin user from secure environment variables
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const admin = await prisma.user.upsert({
    where:  { email: ADMIN_EMAIL },
    update: {},
    create: {
      email:        ADMIN_EMAIL,
      passwordHash: adminHash,
      name:         ADMIN_NAME,
      role:         UserRole.ADMIN,
    },
  })

  // Assign admin to the demo BU
  await prisma.businessUnitMember.upsert({
    where:  { userId_businessUnitId: { userId: admin.id, businessUnitId: bu.id } },
    update: {},
    create: { userId: admin.id, businessUnitId: bu.id, isCEO: false, isRiskCoordinator: true },
  })

  // Default parameters for the BU
  await prisma.parameters.upsert({
    where:  { businessUnitId: bu.id },
    update: {},
    create: {
      businessUnitId:  bu.id,
      reportingPeriod: '2026Q2',
    },
  })

  // Default calibration for the BU
  await prisma.calibration.upsert({
    where:  { businessUnitId: bu.id },
    update: {},
    create: {
      businessUnitId: bu.id,
      reportingPeriod: '2026Q2',
      timeHorizon:     'next 3 - 5 years',
    },
  })

  console.log(`✅ Admin:  ${admin.email}`)
  console.log(`✅ BU:     ${bu.name} (${bu.code})`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
