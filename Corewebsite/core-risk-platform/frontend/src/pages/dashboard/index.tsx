import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import type { DashboardMetrics } from 'shared-types'
import { Shield, TrendingUp, AlertTriangle, Zap, Activity, Target, RefreshCw } from 'lucide-react'

function MetricCard({ label, value, sub, color = 'gray', icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: any
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700', orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700', gray: 'bg-gray-50 text-gray-700',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, refetch } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data.data),
  })

  const postureColors: Record<string, string> = {
    BLACK_PHOENIX: 'bg-purple-100 text-purple-800',
    DISRUPTIVE_CHALLENGER: 'bg-blue-100 text-blue-800',
    DOUBLE_EXPOSURE: 'bg-red-100 text-red-800',
    INCUMBENT_DEFENDER: 'bg-yellow-100 text-yellow-800',
  }
  const postureLabel: Record<string, string> = {
    BLACK_PHOENIX: '⬛ Black Phoenix',
    DISRUPTIVE_CHALLENGER: '🔵 Disruptive Challenger',
    DOUBLE_EXPOSURE: '🔴 Double Exposure',
    INCUMBENT_DEFENDER: '🟡 Incumbent Defender',
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Tier 1 — Key metrics */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tier 1 — Executive Summary
            </h2>
            <button onClick={() => refetch()} className="btn-secondary py-1 text-xs">
              <RefreshCw className="w-3 h-3" /> Recalculate
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Resilience Index (RI)" value={data?.resilienceIndex?.toFixed(3) ?? '—'}
                sub="Organisational defensive capacity" icon={Shield} color="green" />
              <MetricCard label="Strategic Mobility (SMI)" value={data?.smi?.toFixed(3) ?? '—'}
                sub="Kinetic readiness" icon={TrendingUp} color="blue" />
              <MetricCard label="Active RADAR Risks" value={data?.activeRadarRisks ?? 0}
                sub={`${data?.criticalAlerts ?? 0} critical`} icon={AlertTriangle}
                color={data?.criticalAlerts ? 'red' : 'gray'} />
              <MetricCard label="Active FORGE Crises" value={data?.activeForgeCrises ?? 0}
                sub="Under active management" icon={Zap} color="orange" />
              <MetricCard label="Expected Loss (€M)" value={`€${(data?.totalExpectedLossEur ?? 0).toFixed(1)}M`}
                sub="Total risk exposure" icon={Target} color="red" />
              <MetricCard label="Opportunity Value (€M)" value={`€${(data?.totalOppValueEur ?? 0).toFixed(1)}M`}
                sub="Potential upside" icon={TrendingUp} color="green" />
              <MetricCard label="Coherence Factor" value={data?.coherenceFactor?.toFixed(3) ?? '—'}
                sub="Risk correlation density" icon={Activity} color="purple" />
              <MetricCard label="System Phase Index" value={data?.systemPhaseIndex?.toFixed(2) ?? '—'}
                sub="Tipping point proximity" icon={Activity}
                color={(data?.systemPhaseIndex ?? 0) > 2 ? 'red' : 'gray'} />
            </div>
          )}
        </div>

        {/* Strategic Posture */}
        {data?.strategicPosture && (
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Strategic Posture
            </p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              postureColors[data.strategicPosture] ?? 'bg-gray-100 text-gray-800'
            }`}>
              {postureLabel[data.strategicPosture] ?? data.strategicPosture}
            </span>
            <p className="text-xs text-gray-500 mt-2">
              {data.strategicPosture === 'BLACK_PHOENIX' && 'Optimal: high resilience + high strategic mobility'}
              {data.strategicPosture === 'DISRUPTIVE_CHALLENGER' && 'High mobility, low resilience — exposed during disruption'}
              {data.strategicPosture === 'DOUBLE_EXPOSURE' && 'Critical: low resilience and low strategic mobility'}
              {data.strategicPosture === 'INCUMBENT_DEFENDER' && 'Resilient but missing strategic opportunity windows'}
            </p>
          </div>
        )}

        {/* Quick links to engines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/radar', label: 'RADAR Register', desc: 'Emerging risk early warning', color: 'border-blue-400 bg-blue-50' },
            { href: '/forge', label: 'FORGE Response', desc: 'Crystallised risk management', color: 'border-orange-400 bg-orange-50' },
            { href: '/opportunities', label: 'Opportunities', desc: 'Risk-opportunity duality', color: 'border-green-400 bg-green-50' },
          ].map(item => (
            <a key={item.href} href={item.href}
              className={`card border-l-4 p-4 hover:shadow-md transition-shadow cursor-pointer ${item.color}`}>
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
