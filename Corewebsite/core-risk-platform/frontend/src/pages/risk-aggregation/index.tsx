import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Layers } from 'lucide-react'

export default function RiskAggregationPage() {
  const { data: aggregations = [], isLoading } = useQuery({
    queryKey: ['aggregations'],
    queryFn: () => api.get('/aggregation').then(r => r.data.data),
  })

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => api.get('/risks').then(r => r.data.data),
  })

  // Compute portfolio-level aggregates from risks if no aggregation records
  const totalExpectedLoss = (risks as any[]).reduce((s, r) => s + (r.expectedLoss ?? 0), 0)
  const totalRisks        = (risks as any[]).length
  const criticalCount     = (risks as any[]).filter(r => r.severity === 'CRITICAL').length
  const highCount         = (risks as any[]).filter(r => r.severity === 'HIGH').length
  const avgEwTts          = totalRisks > 0
    ? (risks as any[]).reduce((s, r) => s + (r.ewTts ?? 0), 0) / totalRisks
    : 0
  const avgCoherence      = totalRisks > 0
    ? (risks as any[]).reduce((s, r) => s + (r.cohFactor ?? 1), 0) / totalRisks
    : 1

  // Group risks by business unit
  const byBu: Record<string, any[]> = {}
  ;(risks as any[]).forEach(r => {
    const key = r.businessUnit?.name ?? 'Unknown'
    if (!byBu[key]) byBu[key] = []
    byBu[key].push(r)
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Portfolio summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total Risks',          value: totalRisks,                    fmt: (v: number) => v.toString(),      color: 'text-gray-900' },
            { label: 'Critical',             value: criticalCount,                  fmt: (v: number) => v.toString(),      color: 'text-red-700' },
            { label: 'High',                 value: highCount,                      fmt: (v: number) => v.toString(),      color: 'text-orange-700' },
            { label: 'Exp. Loss (€M)',        value: totalExpectedLoss,              fmt: (v: number) => `€${v.toFixed(1)}M`, color: 'text-red-700' },
            { label: 'Avg EW-TTS',           value: avgEwTts,                       fmt: (v: number) => v.toFixed(2),     color: 'text-gray-900' },
            { label: 'Avg Coherence',        value: avgCoherence,                   fmt: (v: number) => v.toFixed(3),     color: 'text-gray-900' },
          ].map(card => (
            <div key={card.label} className="card card-body text-center">
              <p className={`text-2xl font-bold font-mono ${card.color}`}>{card.fmt(card.value)}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* By Business Unit breakdown */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              Aggregation by Business Unit
              <span className="text-gray-400 font-normal">({Object.keys(byBu).length} units)</span>
            </h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
          ) : Object.keys(byBu).length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No risk data available</p>
              <p className="text-xs text-gray-400 mt-1">Register risks in the RADAR page first</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Business Unit','Risks','Critical','High','Medium','Low','Exp. Loss €M','Avg EW-TTS','Avg Coherence','Avg Prob'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(byBu)
                  .sort((a, b) => b[1].reduce((s, r) => s + (r.expectedLoss ?? 0), 0) - a[1].reduce((s, r) => s + (r.expectedLoss ?? 0), 0))
                  .map(([buName, buRisks]) => {
                    const expLoss  = buRisks.reduce((s, r) => s + (r.expectedLoss ?? 0), 0)
                    const avgTts   = buRisks.reduce((s, r) => s + (r.ewTts ?? 0), 0) / buRisks.length
                    const avgCoh   = buRisks.reduce((s, r) => s + (r.cohFactor ?? 1), 0) / buRisks.length
                    const avgProb  = buRisks.reduce((s, r) => s + (r.probability ?? 0), 0) / buRisks.length
                    const byCrit   = (sev: string) => buRisks.filter(r => r.severity === sev).length
                    return (
                      <tr key={buName} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{buName}</td>
                        <td className="px-3 py-2.5 font-mono">{buRisks.length}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-red-700">{byCrit('CRITICAL')}</td>
                        <td className="px-3 py-2.5 font-mono text-orange-700">{byCrit('HIGH')}</td>
                        <td className="px-3 py-2.5 font-mono text-yellow-700">{byCrit('MEDIUM')}</td>
                        <td className="px-3 py-2.5 font-mono text-green-700">{byCrit('LOW')}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-red-700">€{expLoss.toFixed(1)}M</td>
                        <td className="px-3 py-2.5 font-mono">{avgTts.toFixed(2)}</td>
                        <td className="px-3 py-2.5 font-mono">{avgCoh.toFixed(3)}</td>
                        <td className="px-3 py-2.5">{(avgProb * 100).toFixed(0)}%</td>
                      </tr>
                    )
                  })}
                {/* Portfolio total row */}
                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                  <td className="px-3 py-2.5 text-gray-900">Portfolio Total</td>
                  <td className="px-3 py-2.5 font-mono">{totalRisks}</td>
                  <td className="px-3 py-2.5 font-mono text-red-700">{criticalCount}</td>
                  <td className="px-3 py-2.5 font-mono text-orange-700">{highCount}</td>
                  <td className="px-3 py-2.5 font-mono text-yellow-700">{(risks as any[]).filter(r => r.severity === 'MEDIUM').length}</td>
                  <td className="px-3 py-2.5 font-mono text-green-700">{(risks as any[]).filter(r => r.severity === 'LOW').length}</td>
                  <td className="px-3 py-2.5 font-mono text-red-700">€{totalExpectedLoss.toFixed(1)}M</td>
                  <td className="px-3 py-2.5 font-mono">{avgEwTts.toFixed(2)}</td>
                  <td className="px-3 py-2.5 font-mono">{avgCoherence.toFixed(3)}</td>
                  <td className="px-3 py-2.5">—</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* DB aggregation records if any */}
        {(aggregations as any[]).length > 0 && (
          <div className="card overflow-hidden">
            <div className="card-header">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Stored Aggregation Scenarios
                <span className="text-gray-400 font-normal">({(aggregations as any[]).length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date','Business Unit','TTS Portfolio','Scenario','Items'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(aggregations as any[]).map((agg: any) => (
                    <tr key={agg.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-500">{new Date(agg.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{agg.businessUnit?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold">{agg.ttsPortfolio?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5 text-gray-500">{agg.scenario ?? 'BASE'}</td>
                      <td className="px-3 py-2.5 text-gray-500">{agg.items?.length ?? 0} risks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
