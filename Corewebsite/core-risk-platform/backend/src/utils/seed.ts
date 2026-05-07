/**
 * Database seed — creates admin user + demo business unit
 * Run: npm run db:seed  (from project root)
 */
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

  // Admin user  (credentials: admin@core-platform.com / Admin123!)
  const adminHash = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@core-platform.com' },
    update: {},
    create: {
      email:        'admin@core-platform.com',
      passwordHash: adminHash,
      name:         'Platform Admin',
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

  console.log(`✅ Admin:  ${admin.email}  /  Admin123!`)
  console.log(`✅ BU:     ${bu.name} (${bu.code})`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
