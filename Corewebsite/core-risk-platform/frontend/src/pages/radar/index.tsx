import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { AlertTriangle, Filter, Download, Plus, X, Save } from 'lucide-react'

const CATEGORIES = ['OPS','REG','TECH','FIN','STR','REP','ENV','HR','LEGAL','OTHER']
const STATUSES   = ['ACTIVE','MONITORING','MITIGATED','CLOSED']
const PRIORITIES = ['CRITICAL','HIGH','MEDIUM','LOW','MONITOR']

const PRIORITY_BADGE: Record<string,string> = {
  CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium',
  LOW: 'badge-low', MONITOR: 'badge-monitor',
}
const urgencyColor = (u: number) => {
  if (u >= 200) return 'text-red-700 font-bold'
  if (u >= 50)  return 'text-orange-600 font-semibold'
  if (u >= 10)  return 'text-yellow-600'
  return 'text-gray-600'
}

const EMPTY_RISK = {
  name: '', description: '', category: 'OPS', status: 'ACTIVE',
  probability: 0.3, impactEur: 10, velocity: 1.0,
  amplification: 1.0, accelerationRate: 0.15, propagationRatio: 0.5,
  businessUnitId: '', notes: '',
}

function RiskModal({ initial, onClose, businessUnits }: {
  initial?: any; onClose: () => void; businessUnits: any[]
}) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ?? { ...EMPTY_RISK, businessUnitId: businessUnits[0]?.id ?? '' })
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/risks/${initial.id}`, data).then(r => r.data)
      : api.post('/risks', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      ...form,
      probability: parseFloat(form.probability),
      impactEur: parseFloat(form.impactEur),
      velocity: parseFloat(form.velocity),
      amplification: parseFloat(form.amplification),
      accelerationRate: parseFloat(form.accelerationRate),
      propagationRatio: parseFloat(form.propagationRatio),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Risk' : 'Add New Risk'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          {/* Business Unit */}
          <div>
            <label className="label">Business Unit <span className="text-red-500">*</span></label>
            <select className="input" value={form.businessUnitId} onChange={e => set('businessUnitId', e.target.value)} required>
              <option value="">Select BU…</option>
              {businessUnits.map((bu: any) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="label">Risk Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Regulatory compliance failure" />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the risk…" />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category <span className="text-red-500">*</span></label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">RADAR Parameters</p>

          {/* Probability + Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Probability L(t) <span className="text-gray-400">[0–1]</span></label>
              <input className="input" type="number" min="0" max="1" step="0.01"
                value={form.probability} onChange={e => set('probability', e.target.value)} required />
            </div>
            <div>
              <label className="label">Impact I(t) <span className="text-gray-400">[€M]</span></label>
              <input className="input" type="number" min="0" step="0.1"
                value={form.impactEur} onChange={e => set('impactEur', e.target.value)} required />
            </div>
          </div>

          {/* Velocity + Propagation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Velocity V = 1/TTI</label>
              <input className="input" type="number" min="0" step="0.01"
                value={form.velocity} onChange={e => set('velocity', e.target.value)} required />
            </div>
            <div>
              <label className="label">Propagation Ratio v/v_max <span className="text-gray-400">[0–0.99]</span></label>
              <input className="input" type="number" min="0" max="0.99" step="0.01"
                value={form.propagationRatio} onChange={e => set('propagationRatio', e.target.value)} required />
            </div>
          </div>

          {/* Amplification + Acceleration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amplification A <span className="text-gray-400">[0–3]</span></label>
              <input className="input" type="number" min="0" max="3" step="0.1"
                value={form.amplification} onChange={e => set('amplification', e.target.value)} />
            </div>
            <div>
              <label className="label">Acceleration Rate α</label>
              <input className="input" type="number" min="0" step="0.01"
                value={form.accelerationRate} onChange={e => set('accelerationRate', e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update Risk' : 'Add Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RadarPage() {
  const [filter, setFilter] = useState({ status: '', category: '', priority: '' })
  const [modal, setModal] = useState<null | 'add' | any>(null)

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks', filter],
    queryFn: () => api.get('/risks', { params: filter }).then(r => r.data.data),
  })
  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Filters + Add */}
        <div className="card card-body flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {(['status','category','priority'] as const).map(key => (
            <select key={key} value={filter[key]}
              onChange={e => setFilter(f => ({ ...f, [key]: e.target.value }))}
              className="input w-auto text-xs py-1.5">
              <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}: All</option>
              {key === 'status'   && STATUSES.map(v => <option key={v}>{v}</option>)}
              {key === 'category' && CATEGORIES.map(v => <option key={v}>{v}</option>)}
              {key === 'priority' && PRIORITIES.map(v => <option key={v}>{v}</option>)}
            </select>
          ))}
          <button onClick={() => setFilter({ status:'', category:'', priority:'' })}
            className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
          <div className="ml-auto">
            <button onClick={() => setModal('add')} className="btn-primary py-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Risk
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              RADAR Risk Register
              <span className="text-gray-400 font-normal">({risks.length} risks)</span>
            </h2>
            <button className="btn-secondary py-1 text-xs"><Download className="w-3 h-3" /> Export</button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading risks…</div>
            ) : risks.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No risks found</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Risk" to register the first risk</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['ID','Risk Name','Cat','Prob','Impact €M','EW-TTS','Phase Idx','Freedom','Urgency','Priority','Owner',''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {risks.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-gray-500">{r.riskId}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 max-w-48 truncate">{r.name}</td>
                      <td className="px-3 py-2.5"><span className="badge bg-gray-100 text-gray-700">{r.category}</span></td>
                      <td className="px-3 py-2.5">{(r.probability * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2.5">€{r.impactEur?.toFixed(1)}M</td>
                      <td className="px-3 py-2.5 font-mono">{r.ewTts?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono">{r.phaseIndex?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono">{r.freedomIndex?.toFixed(2) ?? '—'}</td>
                      <td className={`px-3 py-2.5 font-mono ${urgencyColor(r.urgencyIndex ?? 0)}`}>
                        {r.urgencyIndex?.toFixed(1) ?? '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.priority ? <span className={PRIORITY_BADGE[r.priority] ?? 'badge-monitor'}>{r.priority}</span> : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{r.owner?.name ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => setModal(r)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <RiskModal
          initial={modal === 'add' ? undefined : modal}
          onClose={() => setModal(null)}
          businessUnits={businessUnits}
        />
      )}
    </AppLayout>
  )
}
