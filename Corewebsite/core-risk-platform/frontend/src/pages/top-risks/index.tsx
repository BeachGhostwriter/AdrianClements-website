import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { Trophy, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border border-red-200',
  HIGH:     'bg-orange-100 text-orange-800 border border-orange-200',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  LOW:      'bg-green-100 text-green-800 border border-green-200',
}

const POSTURE_COLORS: Record<string, string> = {
  BLACK_PHOENIX:       'bg-gray-900 text-white',
  DISRUPTIVE_CHALLENGER: 'bg-purple-100 text-purple-800',
  DOUBLE_EXPOSURE:     'bg-red-100 text-red-800',
  INCUMBENT_DEFENDER:  'bg-blue-100 text-blue-800',
}

function TrendIcon({ val }: { val?: number | null }) {
  if (!val) return <Minus className="w-3.5 h-3.5 text-gray-400" />
  if (val > 0) return <TrendingUp className="w-3.5 h-3.5 text-red-500" />
  return <TrendingDown className="w-3.5 h-3.5 text-green-500" />
}

export default function TopRisksPage() {
  const [selectedBuId, setSelectedBuId] = useState('all')

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks'],
    queryFn: () => api.get('/risks').then(r => r.data.data),
  })

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  const filtered = (risks as any[])
    .filter(r => selectedBuId === 'all' || r.businessUnitId === selectedBuId)
    .sort((a, b) => (b.ttsCurrent ?? 0) - (a.ttsCurrent ?? 0))
    .slice(0, 10)

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="card card-body flex items-center gap-4">
          <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <div className="flex-1">
            <label className="label">Filter by Business Unit</label>
            <select title="Business Unit" className="input mt-1" value={selectedBuId} onChange={e => setSelectedBuId(e.target.value)}>
              <option value="all">All Business Units</option>
              {(businessUnits as any[]).map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Ranked by TTS score</p>
            <p className="text-xs text-gray-400">Top 10 shown</p>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Top 10 Risks by TTS Score
              <span className="text-gray-400 font-normal">({filtered.length} risks)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading risks…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No risks found</p>
                <p className="text-xs text-gray-400 mt-1">Register risks in the RADAR page first</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#','Risk ID','Risk Name','Business Unit','TTS','EW-TTS','Severity','Posture','Prob','Impact €M','Velocity','Trend','Status'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r: any, i: number) => (
                    <tr key={r.id} className={`hover:bg-gray-50 ${i === 0 ? 'bg-red-50/40' : ''}`}>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                          ${i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-400 text-white' : i === 2 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-500">{r.riskId}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 max-w-44 truncate">{r.name}</td>
                      <td className="px-3 py-2.5 text-gray-600">{r.businessUnit?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-red-700">{r.ttsCurrent?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono">{r.ewTts?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        {r.severity && (
                          <span className={`badge ${SEVERITY_COLORS[r.severity] ?? 'bg-gray-100 text-gray-700'}`}>
                            {r.severity}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.strategicPosture && (
                          <span className={`badge ${POSTURE_COLORS[r.strategicPosture] ?? 'bg-gray-100 text-gray-700'} text-xs`}>
                            {r.strategicPosture.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">{r.probability != null ? `${(r.probability * 100).toFixed(0)}%` : '—'}</td>
                      <td className="px-3 py-2.5 font-semibold text-orange-700">€{r.impactEur?.toFixed(1) ?? '—'}M</td>
                      <td className="px-3 py-2.5">{r.velocity?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5"><TrendIcon val={r.trendDelta} /></td>
                      <td className="px-3 py-2.5">
                        <span className="badge bg-gray-100 text-gray-600">{r.status ?? 'OPEN'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
