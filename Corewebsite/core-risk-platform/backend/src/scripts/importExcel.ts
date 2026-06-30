/**
 * Excel Import — seeds database from CORE_v7_Integrated.xlsx
 * Usage: npm run import
 */
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'
import { prisma } from '../config/db'
import dotenv from 'dotenv'
dotenv.config()

const EXCEL_PATH = process.env.EXCEL_IMPORT_PATH
  ?? path.join(__dirname, '../../data/CORE_v7_Integrated.xlsx')

function readSheet(wb: XLSX.WorkBook, name: string): any[][] {
  const ws = wb.Sheets[name]
  if (!ws) { console.warn(`Sheet "${name}" not found`); return [] }
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][]
}

const safeF = (v: any, fb = 0): number => { const n = parseFloat(v); return isNaN(n) ? fb : n }
const safeS = (v: any): string | null => { const s = String(v ?? '').trim(); return s || null }
const CAT_LIST = ['OPS','REG','TECH','FIN','STR','REP','ENV','HR','LEGAL','OTHER']
const safeCAT = (v: any) => { const c = String(v??'').trim().toUpperCase(); return CAT_LIST.includes(c) ? c : 'OTHER' }

async function importBusinessUnits(wb: XLSX.WorkBook) {
  const rows = readSheet(wb, 'BPMEntities2023').slice(4)
  let n = 0
  for (const r of rows) {
    const code = safeS(r[6]); const name = safeS(r[7] ?? r[6])
    if (!code || !name) continue
    await prisma.businessUnit.upsert({
      where: { code },
      create: { code, name, group: safeS(r[1]), region: safeS(r[2]), segment: safeS(r[3]),
        subsegment: safeS(r[4]), countryCode: safeS(r[8]), consolidationStatus: safeS(r[9]) },
      update: { name },
    })
    n++
  }
  // Parameters sheet BU names
  for (const r of readSheet(wb, 'Parameters').slice(1)) {
    const buName = safeS(r[0]); if (!buName) continue
    const code = `BU-${buName.replace(/\s+/g,'-').toUpperCase()}`
    await prisma.businessUnit.upsert({ where: { code }, create: { code, name: buName }, update: {} })
    n++
  }
  console.log(`  ✓ ${n} business units`)
}

async function importRADAR(wb: XLSX.WorkBook, buId: string) {
  let n = 0
  for (const r of readSheet(wb, 'RADAR').slice(5)) {
    const riskId = safeS(r[0]); const name = safeS(r[1])
    if (!riskId || !name || riskId === 'ID') continue
    await prisma.risk.upsert({
      where: { id: `R-${riskId}-${buId}` },
      create: {
        id: `R-${riskId}-${buId}`, businessUnitId: buId, riskId, name,
        category: safeCAT(r[2]) as any,
        probability: safeF(r[3], 0.3), impactEur: safeF(r[4], 10),
        impactScore: safeF(r[5]), expectedLoss: safeF(r[6]),
        velocity: safeF(r[7], 1), propagationRatio: safeF(r[8], 0.5),
        lorentzFactor: safeF(r[9], 1), ttsMonths: safeF(r[10]),
        phaseProximity: safeF(r[11]), cohFactor: safeF(r[12]),
        ewTts: safeF(r[13]), ewTtsLorentz: safeF(r[14]),
        phaseIndex: safeF(r[15]), freedomIndex: safeF(r[16], 0.5),
        entropyS: safeF(r[17]), entropyRatio: safeF(r[18]),
        urgencyIndex: safeF(r[19]), palmerNoise: safeF(r[20]),
        mcP10: safeF(r[21]), mcP50: safeF(r[22]), mcP90: safeF(r[23]),
        signalStrength: safeF(r[25]), detectionConf: safeF(r[26]),
        notes: safeS(r[27]), amplification: 1.0, accelerationRate: 0.15,
      },
      update: { name },
    })
    n++
  }
  console.log(`  ✓ ${n} RADAR risks`)
}

async function importFORGE(wb: XLSX.WorkBook, buId: string) {
  let n = 0
  for (const r of readSheet(wb, 'FORGE').slice(5)) {
    const crisisId = safeS(r[0]); const name = safeS(r[1])
    if (!crisisId || !name || crisisId === 'ID') continue
    await prisma.crisis.upsert({
      where: { id: `C-${crisisId}-${buId}` },
      create: {
        id: `C-${crisisId}-${buId}`, businessUnitId: buId, crisisId, name,
        category: safeCAT(r[2]) as any,
        probability: safeF(r[3], 0.5), impactEur: safeF(r[4], 50),
        velocity: safeF(r[6], 1), severity: safeF(r[7], 5),
        amplification: 1.0, accelerationRate: 0.1, propagationRatio: 0.5,
        decisionQuality: safeF(r[10], 5), rTts: safeF(r[5]),
        residualEur: safeF(r[16]), residualScore: safeF(r[17]),
        recoveryMonths: safeF(r[18]), urgencyIndex: safeF(r[20]),
        urgencyClass: safeS(r[21]) ?? 'Standard',
        backcast25: safeF(r[23]), backcast50: safeF(r[24]),
        backcast75: safeF(r[25]), backcast95: safeF(r[26]),
        notes: safeS(r[31]),
      },
      update: { name },
    })
    n++
  }
  console.log(`  ✓ ${n} FORGE crises`)
}

async function importOpportunities(wb: XLSX.WorkBook, buId: string) {
  let n = 0
  for (const r of readSheet(wb, 'Opportunities').slice(5)) {
    const oppId = safeS(r[0]); const name = safeS(r[1])
    if (!oppId || !name || oppId === 'ID') continue
    await prisma.opportunity.upsert({
      where: { id: `O-${oppId}-${buId}` },
      create: {
        id: `O-${oppId}-${buId}`, businessUnitId: buId, oppId, name,
        category: safeS(r[2]),
        probability: safeF(r[3], 0.3), upsideEur: safeF(r[4], 10),
        upsideScore: safeF(r[5]), expectedValue: safeF(r[6]),
        windowMonths: safeF(r[7], 12), stratFit: safeF(r[8], 0.5),
        smiAlign: safeF(r[9], 0.5), captureIdx: safeF(r[10]),
        otsAmplified: safeF(r[11]), investEur: safeF(r[12]),
        roi: safeF(r[13]), priority: safeS(r[14]), readiness: safeF(r[15], 0.5), notes: safeS(r[16]),
      },
      update: { name },
    })
    n++
  }
  console.log(`  ✓ ${n} opportunities`)
}

async function importCalibration(wb: XLSX.WorkBook, buId: string) {
  const rows = readSheet(wb, 'CORE')
  const params: Record<string, number> = {}
  for (const r of rows.slice(4)) {
    const k = safeS(r[0]); const v = safeF(r[1])
    if (k && v) params[k] = v
  }
  await prisma.calibration.upsert({
    where: { businessUnitId: buId },
    create: {
      businessUnitId: buId,
      vMax: params['v_max'] ?? 1.0, psiC: params['psi_c'] ?? 5.0,
      beta: params['beta'] ?? 2.0, gamma: params['gamma'] ?? 3.0,
      alpha: params['alpha'] ?? 0.15, delta: params['delta'] ?? 1.0,
      ttsHorizon: params['TTS_horizon'] ?? 16.67, kappaCoh: params['kappa_coh'] ?? 0.2,
      asymmetryFactor: params['asymmetry_factor'] ?? 1.4,
    },
    update: {},
  })
  console.log('  ✓ Calibration imported')
}

async function main() {
  console.log('🚀 CORE v7 Excel import starting...\n   File:', EXCEL_PATH)
  const wb = XLSX.readFile(EXCEL_PATH)
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'Admin@CORE2026!', 12)
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@core-platform.local' },
    create: { email: process.env.ADMIN_EMAIL ?? 'admin@core-platform.local',
      passwordHash: hash, name: process.env.ADMIN_NAME ?? 'Platform Administrator', role: 'ADMIN' },
    update: {},
  })
  await prisma.businessUnit.upsert({
    where: { code: 'DEFAULT' }, create: { code: 'DEFAULT', name: 'Default Organisation' }, update: {},
  })
  const bu = await prisma.businessUnit.findUnique({ where: { code: 'DEFAULT' } })
  await importBusinessUnits(wb)
  await importCalibration(wb, bu!.id)
  await importRADAR(wb, bu!.id)
  await importFORGE(wb, bu!.id)
  await importOpportunities(wb, bu!.id)
  console.log('\n✅ Import complete!')
}

main().catch(e => { console.error('❌', e); process.exit(1) }).finally(() => prisma.$disconnect())
