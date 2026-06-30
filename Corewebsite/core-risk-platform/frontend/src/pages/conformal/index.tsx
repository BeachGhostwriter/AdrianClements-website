import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { Compass } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  OPS: '#ef4444', REG: '#f97316', TECH: '#3b82f6', FIN: '#8b5cf6',
  STR: '#10b981', REP: '#ec4899', ENV: '#14b8a6', HR: '#f59e0b',
  LEGAL: '#6366f1', OTHER: '#6b7280',
}

function ConformalTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d?.name ?? '—'}</p>
      <p className="text-gray-600">t_conf: <span className="font-mono">{d?.tConf?.toFixed(3)}</span></p>
      <p className="text-gray-600">x_conf: <span className="font-mono">{d?.xConf?.toFixed(3)}</span></p>
      <p className="text-gray-600">Quarter: {d?.quarter}</p>
      {d?.boundary && <p className={`font-medium ${d.boundary === 'VALID' ? 'text-green-700' : 'text-red-700'}`}>{d.boundary}</p>}
    </div>
  )
}

export default function ConformalPage() {
  const [selectedBuId, setSelectedBuId] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks'],
    queryFn: () => api.get('/risks').then(r => r.data.data),
  })

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  // Filter risks
  const filteredRisks = (risks as any[]).filter(r => {
    if (selectedBuId !== 'all' && r.businessUnitId !== selectedBuId) return false
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false
    return true
  })

  // Build scatter series from risk trajectory data
  // Group trajectories by category colour
  const seriesByCategory: Record<string, any[]> = {}

  filteredRisks.forEach((r: any) => {
    if (!r.trajectories?.length) {
      // If no trajectory data, plot the risk itself at its current state
      // Using ewTts as t_conf proxy, impactScore as x_conf proxy — normalised to [-1, 1]
      const tConf = r.ewTts != null ? Math.tanh(r.ewTts * 0.1) : 0
      const xConf = r.impactScore != null ? Math.tanh(r.impactScore * 0.3) : 0
      const cat = r.category ?? 'OTHER'
      if (!seriesByCategory[cat]) seriesByCategory[cat] = []
      seriesByCategory[cat].push({ tConf, xConf, name: r.name, quarter: 'Current', boundary: 'VALID', riskId: r.riskId })
    } else {
      r.trajectories.forEach((t: any) => {
        const cat = r.category ?? 'OTHER'
        if (!seriesByCategory[cat]) seriesByCategory[cat] = []
        seriesByCategory[cat].push({
          tConf: t.tConf,
          xConf: t.xConf,
          name: r.name,
          quarter: t.quarter,
          boundary: t.boundary ?? 'VALID',
          riskId: r.riskId,
        })
      })
    }
  })

  const categories = Object.keys(seriesByCategory)
  const totalPoints = categories.reduce((s, k) => s + seriesByCategory[k].length, 0)

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Controls */}
        <div className="card card-body flex flex-wrap items-end gap-4">
          <Compass className="w-4 h-4 text-brand-600 flex-shrink-0 mb-1" />
          <div className="flex-1 min-w-36">
            <label className="label">Business Unit</label>
            <select title="Business Unit" className="input mt-1" value={selectedBuId} onChange={e => setSelectedBuId(e.target.value)}>
              <option value="all">All Business Units</option>
              {(businessUnits as any[]).map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
          <div className="min-w-32">
            <label className="label">Category</label>
            <select title="Category" className="input mt-1" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="ALL">All Categories</option>
              {['OPS','REG','TECH','FIN','STR','REP','ENV','HR','LEGAL','OTHER'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="text-right text-xs text-gray-400 mb-1">
            <p>{filteredRisks.length} risks · {totalPoints} trajectory points</p>
          </div>
        </div>

        {/* Conformal diagram */}
        <div className="card">
          <div className="card-header flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-600" />
                CCORD Conformal Diagram
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                t_conf = tanh(t_raw × κ_τ) · x_conf = tanh(score) × (S − t) — CORE Section 6.2
              </p>
            </div>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-300 inline-block" /> Unit boundary [−1, 1]</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-dashed border-t border-dashed border-brand-400 inline-block" /> Origin</span>
            </div>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="h-96 flex items-center justify-center text-sm text-gray-400">Loading trajectory data…</div>
            ) : totalPoints === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center">
                <Compass className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No trajectory data available</p>
                <p className="text-xs text-gray-400 mt-1">Risks with computed RADAR outputs will appear here</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={480}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number" dataKey="tConf" domain={[-1.05, 1.05]} name="t_conf"
                    label={{ value: 't_conf (time)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={v => v.toFixed(1)} tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <YAxis
                    type="number" dataKey="xConf" domain={[-1.05, 1.05]} name="x_conf"
                    label={{ value: 'x_conf (score)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={v => v.toFixed(1)} tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  {/* Unit square boundary lines */}
                  <ReferenceLine x={1}   stroke="#d1d5db" strokeDasharray="4 2" />
                  <ReferenceLine x={-1}  stroke="#d1d5db" strokeDasharray="4 2" />
                  <ReferenceLine y={1}   stroke="#d1d5db" strokeDasharray="4 2" />
                  <ReferenceLine y={-1}  stroke="#d1d5db" strokeDasharray="4 2" />
                  <ReferenceLine x={0}   stroke="#e5e7eb" />
                  <ReferenceLine y={0}   stroke="#e5e7eb" />
                  <Tooltip content={<ConformalTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  {categories.map(cat => (
                    <Scatter
                      key={cat}
                      name={cat}
                      data={seriesByCategory[cat]}
                      fill={CATEGORY_COLORS[cat] ?? '#6b7280'}
                      opacity={0.75}
                      r={4}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Legend / interpretation guide */}
        <div className="card card-body grid grid-cols-2 gap-6 text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-800 mb-2">Quadrant Interpretation</p>
            <div className="space-y-1.5">
              <p><span className="font-mono text-red-700">+t, +x</span> — High time pressure + high impact: Immediate action required</p>
              <p><span className="font-mono text-orange-700">−t, +x</span> — Low urgency but high impact: Monitor closely</p>
              <p><span className="font-mono text-blue-700">+t, −x</span> — High urgency but low impact: Manage efficiently</p>
              <p><span className="font-mono text-gray-500">−t, −x</span> — Low urgency + low impact: Watch list</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-2">Boundary Conditions</p>
            <div className="space-y-1.5">
              <p>Points outside the unit square [−1, 1]² are boundary violations — indicates extreme parameter values.</p>
              <p>Clusters near the origin indicate balanced risk posture.</p>
              <p>Dispersion in x_conf direction signals diverging risk trajectories across BUs.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
