import { Response } from 'express'
import { prisma } from '../config/db'
import { AuthRequest } from '../middleware/auth'
import { userCanAccessBusinessUnit } from '../middleware/auth'

export async function listOpportunities(req: AuthRequest, res: Response) {
  try {
    const buFilter = (req as any).buFilter
    const opps = await prisma.opportunity.findMany({
      where: buFilter ? { businessUnitId: { in: buFilter } } : {},
      include: { businessUnit: { select: { name: true } } },
      orderBy: { otsAmplified: 'desc' },
    })
    res.json({ success: true, data: opps })
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }) }
}

export async function createOpportunity(req: AuthRequest, res: Response) {
  try {
    const data = req.body
    if (!userCanAccessBusinessUnit(req, data.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden for selected business unit' })
    }

    // Auto-generate oppId if not provided
    if (!data.oppId) {
      const count = await prisma.opportunity.count({ where: { businessUnitId: data.businessUnitId } })
      data.oppId = `O-${String(count + 1).padStart(3, '0')}`
    }
    // Compute derived fields
    data.upsideScore = Math.min(10, Math.max(1, 2 * Math.log((data.upsideEur ?? 0) + 1)))
    data.expectedValue = (data.probability ?? 0) * (data.upsideEur ?? 0)
    const opp = await prisma.opportunity.create({ data })
    res.status(201).json({ success: true, data: opp })
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }) }
}

export async function updateOpportunity(req: AuthRequest, res: Response) {
  try {
    const existing = await prisma.opportunity.findUnique({ where: { id: req.params.id }, select: { businessUnitId: true } })
    if (!existing) return res.status(404).json({ success: false, message: 'Opportunity not found' })
    if (!userCanAccessBusinessUnit(req, existing.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const data = req.body
    data.upsideScore = Math.min(10, Math.max(1, 2 * Math.log((data.upsideEur ?? 0) + 1)))
    data.expectedValue = (data.probability ?? 0) * (data.upsideEur ?? 0)
    const opp = await prisma.opportunity.update({ where: { id: req.params.id }, data })
    res.json({ success: true, data: opp })
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }) }
}

export async function deleteOpportunity(req: AuthRequest, res: Response) {
  try {
    const existing = await prisma.opportunity.findUnique({ where: { id: req.params.id }, select: { businessUnitId: true } })
    if (!existing) return res.status(404).json({ success: false, message: 'Opportunity not found' })
    if (!userCanAccessBusinessUnit(req, existing.businessUnitId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    await prisma.opportunity.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Opportunity deleted' })
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }) }
}
