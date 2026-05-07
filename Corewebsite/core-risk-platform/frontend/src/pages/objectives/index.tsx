import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { Target, Plus, X, Save } from 'lucide-react'

const CATEGORIES = ['STRATEGIC','FINANCIAL','OPERATIONAL','COMPLIANCE','REPUTATIONAL','SUSTAINABILITY','OTHER']
const STATUSES   = ['active','at_risk','achieved','deferred','cancelled']

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  at_risk:   'bg-red-100 text-red-800',
  achieved:  'bg-blue-100 text-blue-800',
  deferred:  'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const EMPTY_OBJ = {
  title: '', description: '', category: 'STRATEGIC',
  priority: 1, targetDate: '', status: 'active', businessUnitId: '',
}

function ObjectiveModal({ initial, onClose, businessUnits }: {
  initial?: any; onClose: () => void; businessUnits: any[]
}) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial
    ? { ...initial, targetDate: initial.targetDate ? initial.targetDate.split('T')[0] : '' }
    : { ...EMPTY_OBJ, businessUnitId: businessUnits[0]?.id ?? '' })
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/objectives/${initial.id}`, data).then(r => r.data)
      : api.post('/objectives', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['objectives'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    mutation.mutate({
      ...form,
      priority: parseInt(form.priority),
      targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Objective' : 'Add Objective'}</h2>
          <button type="button" onClick={onClose} title="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="label">Business Unit <span className="text-red-500">*</span></label>
            <select title="Business Unit" className="input" value={form.businessUnitId} onChange={e => set('businessUnitId', e.target.value)} required>
              <option value="">Select BU…</option>
              {businessUnits.map((bu: any) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Objective Title <span className="text-red-500">*</span></label>
            <input title="Title" className="input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Achieve 15% revenue growth by FY2027" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea title="Description" className="input" rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Detailed description…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select title="Category" className="input" value={form.category ?? ''} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select title="Status" className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <input title="Priority" className="input" type="number" min={1} max={99} value={form.priority ?? 1} onChange={e => set('priority', e.target.value)} />
            </div>
            <div>
              <label className="label">Target Date</label>
              <input title="Target Date" className="input" type="date" value={form.targetDate ?? ''} onChange={e => set('targetDate', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Objective'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ObjectivesPage() {
  const [modal, setModal] = useState<null | 'add' | any>(null)
  const [selectedBuId, setSelectedBuId] = useState('all')

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ['objectives'],
    queryFn: () => api.get('/objectives').then(r => r.data.data),
  })

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  const filtered = (objectives as any[]).filter(o =>
    selectedBuId === 'all' || o.businessUnitId === selectedBuId
  )

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Filter */}
        <div className="card card-body flex items-center gap-4">
          <Target className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="label">Filter by Business Unit</label>
            <select title="Business Unit" className="input mt-1" value={selectedBuId} onChange={e => setSelectedBuId(e.target.value)}>
              <option value="all">All Business Units</option>
              {(businessUnits as any[]).map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => setModal('add')} className="btn-primary py-1.5 text-xs mt-4">
            <Plus className="w-3.5 h-3.5" /> Add Objective
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-600" />
              Strategic Objectives
              <span className="text-gray-400 font-normal">({filtered.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Target className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No objectives defined</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Objective" to define strategic objectives</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#','Objective','Business Unit','Category','Target Date','Status',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{o.priority ?? '—'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{o.title}</p>
                        {o.description && <p className="text-xs text-gray-400 mt-0.5 max-w-sm truncate">{o.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{o.businessUnit?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-brand-50 text-brand-700">{o.category ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {o.targetDate ? new Date(o.targetDate).toLocaleDateString('en-GB', { year:'numeric', month:'short' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {o.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setModal(o)} className="text-xs text-brand-600 hover:text-brand-800 font-medium">Edit</button>
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
        <ObjectiveModal
          initial={modal === 'add' ? undefined : modal}
          onClose={() => setModal(null)}
          businessUnits={businessUnits as any[]}
        />
      )}
    </AppLayout>
  )
}
