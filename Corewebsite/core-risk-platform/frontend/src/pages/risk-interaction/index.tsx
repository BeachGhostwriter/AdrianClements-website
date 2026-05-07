import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { Network, Plus, X, Save, Trash2 } from 'lucide-react'

const DIRECTIONS = ['unidirectional', 'bidirectional', 'causal']

const DIR_COLORS: Record<string, string> = {
  unidirectional: 'bg-blue-100 text-blue-800',
  bidirectional:  'bg-purple-100 text-purple-800',
  causal:         'bg-orange-100 text-orange-800',
}

const EMPTY_INTERACTION = { sourceRiskId: '', targetRiskId: '', strength: 0.5, direction: 'unidirectional' }

function InteractionModal({ initial, onClose, risks }: {
  initial?: any; onClose: () => void; risks: any[]
}) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial
    ? { sourceRiskId: initial.sourceRiskId, targetRiskId: initial.targetRiskId, strength: initial.strength, direction: initial.direction }
    : { ...EMPTY_INTERACTION })
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/interactions/${initial.id}`, data).then(r => r.data)
      : api.post('/interactions', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interactions'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/interactions/${initial.id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interactions'] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (form.sourceRiskId === form.targetRiskId) {
      setError('Source and target risk must be different'); return
    }
    mutation.mutate({ ...form, strength: parseFloat(form.strength) })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Interaction' : 'Add Interaction'}</h2>
          <button type="button" onClick={onClose} title="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="label">Source Risk <span className="text-red-500">*</span></label>
            <select title="Source Risk" className="input" value={form.sourceRiskId} onChange={e => set('sourceRiskId', e.target.value)} required>
              <option value="">Select source risk…</option>
              {risks.map(r => <option key={r.id} value={r.id}>{r.riskId} — {r.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Target Risk <span className="text-red-500">*</span></label>
            <select title="Target Risk" className="input" value={form.targetRiskId} onChange={e => set('targetRiskId', e.target.value)} required>
              <option value="">Select target risk…</option>
              {risks.map(r => <option key={r.id} value={r.id}>{r.riskId} — {r.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Direction</label>
              <select title="Direction" className="input" value={form.direction} onChange={e => set('direction', e.target.value)}>
                {DIRECTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Strength <span className="text-gray-400 font-normal">[0–1]</span></label>
              <input title="Strength" className="input font-mono" type="number" min={0} max={1} step={0.01}
                value={form.strength} onChange={e => set('strength', e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            {isEdit && (
              <button type="button" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
            <div className={`flex gap-3 ${!isEdit ? 'ml-auto' : ''}`}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary">
                <Save className="w-4 h-4" />
                {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function StrengthBar({ val }: { val: number }) {
  const pct = Math.round(val * 100)
  const color = pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-orange-400' : 'bg-yellow-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs">{val.toFixed(2)}</span>
    </div>
  )
}

export default function RiskInteractionPage() {
  const [modal, setModal] = useState<null | 'add' | any>(null)

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => api.get('/interactions').then(r => r.data.data),
  })

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => api.get('/risks').then(r => r.data.data),
  })

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Network className="w-4 h-4 text-brand-600" />
              Risk Interactions
              <span className="text-gray-400 font-normal">Propagation links ρ_ij</span>
              <span className="text-gray-400 font-normal">({(interactions as any[]).length} links)</span>
            </h2>
            <button type="button" onClick={() => setModal('add')} className="btn-primary py-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Interaction
            </button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : (interactions as any[]).length === 0 ? (
              <div className="p-12 text-center">
                <Network className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No interactions defined</p>
                <p className="text-xs text-gray-400 mt-1">Define how risks amplify or trigger each other</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Source Risk','Target Risk','Source BU','Target BU','Direction','Strength',''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(interactions as any[]).map((ix: any) => (
                    <tr key={ix.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-gray-500 mr-1">{ix.sourceRisk?.riskId}</span>
                        <span className="font-medium text-gray-900">{ix.sourceRisk?.name}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-gray-500 mr-1">{ix.targetRisk?.riskId}</span>
                        <span className="font-medium text-gray-900">{ix.targetRisk?.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{ix.sourceRisk?.businessUnit?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-gray-500">{ix.targetRisk?.businessUnit?.name ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`badge ${DIR_COLORS[ix.direction] ?? 'bg-gray-100 text-gray-700'}`}>{ix.direction}</span>
                      </td>
                      <td className="px-3 py-2.5"><StrengthBar val={ix.strength ?? 0} /></td>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => setModal(ix)} className="text-xs text-brand-600 hover:text-brand-800 font-medium">Edit</button>
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
        <InteractionModal
          initial={modal === 'add' ? undefined : modal}
          onClose={() => setModal(null)}
          risks={risks as any[]}
        />
      )}
    </AppLayout>
  )
}
