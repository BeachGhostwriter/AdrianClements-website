import { Router } from 'express'
import { authenticate, requireRole, scopeToBusinessUnits, userCanAccessBusinessUnit } from '../middleware/auth'
import * as ctrl from '../controllers/riskController'
import * as XLSX from 'xlsx'

export const riskRoutes = Router()
riskRoutes.use(authenticate, scopeToBusinessUnits)

const parseNum = (v: any, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

riskRoutes.get('/export', async (req: any, res) => {
  try {
    const buFilter = req.buFilter as string[]
    const businessUnitId = String(req.query.businessUnitId || '').trim()
    const where: any = { businessUnitId: { in: buFilter } }
    if (businessUnitId) {
      if (!userCanAccessBusinessUnit(req, businessUnitId)) {
        return res.status(403).json({ success: false, message: 'Forbidden for selected business unit' })
      }
      where.businessUnitId = businessUnitId
    }

    const risks = await prisma.risk.findMany({
      where,
      include: { businessUnit: { select: { code: true, name: true } } },
      orderBy: [{ businessUnitId: 'asc' }, { riskId: 'asc' }],
    })

    const rows = risks.map((r: any) => ({
      businessUnitCode: r.businessUnit?.code,
      businessUnitName: r.businessUnit?.name,
      riskId: r.riskId,
      name: r.name,
      category: r.category,
      status: r.status,
      probability: r.probability,
      impactEur: r.impactEur,
      velocity: r.velocity,
      amplification: r.amplification,
      accelerationRate: r.accelerationRate,
      propagationRatio: r.propagationRatio,
      notes: r.notes || '',
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'RADAR_Risks')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const filename = `radar-risks-${new Date().toISOString().slice(0, 10)}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
})

riskRoutes.post('/import', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const { fileBase64, businessUnitId } = req.body || {}
    if (!fileBase64 || !businessUnitId) {
      return res.status(400).json({ success: false, message: 'fileBase64 and businessUnitId are required' })
    }
    if (!userCanAccessBusinessUnit(req, businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden for selected business unit' })
    }

    const wb = XLSX.read(Buffer.from(fileBase64, 'base64'), { type: 'buffer' })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) return res.status(400).json({ success: false, message: 'Workbook has no sheets' })

    const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[sheetName], { defval: '' })
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'No data rows found' })

    let created = 0
    let updated = 0
    for (const row of rows) {
      const riskId = String(row.riskId || row.RiskID || '').trim()
      const name = String(row.name || row.RiskName || '').trim()
      if (!riskId || !name) continue

      const payload = {
        businessUnitId,
        riskId,
        name,
        category: String(row.category || row.Category || 'OTHER').toUpperCase(),
        status: String(row.status || row.Status || 'ACTIVE').toUpperCase(),
        probability: parseNum(row.probability ?? row.Probability, 0.3),
        impactEur: parseNum(row.impactEur ?? row.ImpactEur, 10),
        velocity: parseNum(row.velocity ?? row.Velocity, 1),
        amplification: parseNum(row.amplification ?? row.Amplification, 1),
        accelerationRate: parseNum(row.accelerationRate ?? row.AccelerationRate, 0.15),
        propagationRatio: parseNum(row.propagationRatio ?? row.PropagationRatio, 0.5),
        notes: String(row.notes || row.Notes || '').trim() || null,
      }

      const existing = await prisma.risk.findFirst({ where: { businessUnitId, riskId }, select: { id: true } })
      if (existing) {
        await prisma.risk.update({ where: { id: existing.id }, data: payload })
        updated++
      } else {
        await prisma.risk.create({ data: payload as any })
        created++
      }
    }

    res.status(201).json({ success: true, data: { created, updated, totalRows: rows.length } })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message })
  }
})

riskRoutes.get('/',                ctrl.listRisks)
riskRoutes.get('/:id',             ctrl.getRisk)
riskRoutes.post('/',               requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), ctrl.createRisk)
riskRoutes.put('/:id',             requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), ctrl.updateRisk)
riskRoutes.delete('/:id',          requireRole('ADMIN', 'DIVISION_HEAD'), ctrl.deleteRisk)
riskRoutes.post('/:id/recalculate', ctrl.recalculateRisk)
riskRoutes.get('/:id/trajectories', ctrl.getRiskTrajectories)

// ── Risk Controls ──────────────────────────────────────────────
import { prisma } from '../config/db'

riskRoutes.get('/:id/controls', async (req: any, res) => {
  const controls = await prisma.riskControl.findMany({ where: { riskId: req.params.id } })
  res.json({ success: true, data: controls })
})

riskRoutes.post('/:id/controls', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const control = await prisma.riskControl.create({ data: { ...req.body, riskId: req.params.id } })
    res.status(201).json({ success: true, data: control })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

riskRoutes.put('/:id/controls/:controlId', requireRole('ADMIN', 'DIVISION_HEAD', 'RISK_OWNER'), async (req: any, res) => {
  try {
    const control = await prisma.riskControl.update({ where: { id: req.params.controlId }, data: req.body })
    res.json({ success: true, data: control })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})

riskRoutes.delete('/:id/controls/:controlId', requireRole('ADMIN', 'DIVISION_HEAD'), async (req: any, res) => {
  try {
    await prisma.riskControl.delete({ where: { id: req.params.controlId } })
    res.json({ success: true })
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }) }
})
