import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

const HORIZON_LABELS: Record<string, string> = {
  SHORT:  '< 1 year',
  MEDIUM: '1–3 years',
  LONG:   '3–5 years',
  HORIZON: '5+ years',
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH:     'bg-orange-100 text-orange-800',
  MEDIUM:   'bg-yellow-100 text-yellow-700',
  LOW:      'bg-green-100 text-green-800',
}

export default function LongTermRisksPage() {
  const [selectedBuId, setSelectedBuId] = useState('all')

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks-long-term'],
    queryFn: () => api.get('/risks', { params: { longTerm: 'true' } }).then(r => r.data.data),
  })

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  // If no longTerm flag is set in data, fall back to showing risks with long horizon
  const allRisks = (risks as any[]).length === 0
    ? []
    : (risks as any[])

  const filtered = allRisks.filter(r =>
    selectedBuId === 'all' || r.businessUnitId === selectedBuId
  ).sort((a, b) => (b.ttsMonths ?? 0) - (a.ttsMonths ?? 0))

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Filter */}
        <div className="card card-body flex items-center gap-4">
          <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="label">Filter by Business Unit</label>
            <select title="Business Unit" className="input mt-1" value={selectedBuId} onChange={e => setSelectedBuId(e.target.value)}>
              <option value="all">All Business Units</option>
              {(businessUnits as any[]).map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Risks with horizon &gt; 3 years</p>
            <p>Sorted by TTS-months</p>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Long-term Risk Horizon
              <span className="text-gray-400 font-normal">({filtered.length} risks)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No long-term risks flagged</p>
                <p className="text-xs text-gray-400 mt-1">Mark risks as long-term in the RADAR register to see them here</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Risk ID','Risk Name','Business Unit','Category','Prob','Impact €M','TTS Months','EW-TTS','Severity','Horizon','Status'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-gray-500">{r.riskId}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 max-w-44 truncate">{r.name}</td>
                      <td className="px-3 py-2.5 text-gray-600">{r.businessUnit?.name ?? '—'}</td>
                      <td className="px-3 py-2.5"><span className="badge bg-gray-100 text-gray-700">{r.category}</span></td>
                      <td className="px-3 py-2.5">{r.probability != null ? `${(r.probability * 100).toFixed(0)}%` : '—'}</td>
                      <td className="px-3 py-2.5 font-semibold text-orange-700">€{r.impactEur?.toFixed(1) ?? '—'}M</td>
                      <td className="px-3 py-2.5 font-mono">{r.ttsMonths?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold">{r.ewTts?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        {r.severity && <span className={`badge ${SEVERITY_COLORS[r.severity] ?? 'bg-gray-100 text-gray-700'}`}>{r.severity}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">
                        {r.horizon ? (HORIZON_LABELS[r.horizon] ?? r.horizon) : '—'}
                      </td>
                      <td className="px-3 py-2.5"><span className="badge bg-gray-100 text-gray-600">{r.status ?? 'ACTIVE'}</span></td>
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
