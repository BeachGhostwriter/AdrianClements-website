import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { ShieldCheck, Plus, X, Save, ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react'

const CONTROL_TYPES = ['PREVENTIVE','DETECTIVE','CORRECTIVE','DIRECTIVE','COMPENSATING']

const EMPTY_CONTROL = {
  title: '', description: '', controlType: 'PREVENTIVE',
  strength: 0.5, quality: 0.5, owner: '',
  limits: false, assessment: false, assurance: false, status: 'active',
}

function ControlModal({ riskId, initial, onClose }: { riskId: string; initial?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ?? { ...EMPTY_CONTROL })
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/risks/${riskId}/controls/${initial.id}`, data).then(r => r.data)
      : api.post(`/risks/${riskId}/controls`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks-with-controls'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/risks/${riskId}/controls/${initial.id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks-with-controls'] }); onClose() },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    mutation.mutate({
      ...form,
      strength: parseFloat(form.strength),
      quality: parseFloat(form.quality),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Control' : 'Add Control'}</h2>
          <button type="button" onClick={onClose} title="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="label">Control Title <span className="text-red-500">*</span></label>
            <input title="Title" className="input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Quarterly access review" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea title="Description" className="input" rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Control Type</label>
              <select title="Type" className="input" value={form.controlType} onChange={e => set('controlType', e.target.value)}>
                {CONTROL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Owner</label>
              <input title="Owner" className="input" value={form.owner ?? ''} onChange={e => set('owner', e.target.value)} placeholder="Name or role" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Strength s <span className="text-gray-400 font-normal">[0–1]</span></label>
              <input title="Strength" className="input font-mono" type="number" min={0} max={1} step={0.01}
                value={form.strength} onChange={e => set('strength', e.target.value)} required />
            </div>
            <div>
              <label className="label">Quality q <span className="text-gray-400 font-normal">[0–1]</span></label>
              <input title="Quality" className="input font-mono" type="number" min={0} max={1} step={0.01}
                value={form.quality} onChange={e => set('quality', e.target.value)} required />
            </div>
          </div>
          <div className="flex items-center gap-6 pt-1">
            {[['limits','Limits'],['assessment','Assessment'],['assurance','Assurance']].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2">
            {isEdit && (
              <button type="button" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                className="text-xs text-red-600 hover:text-red-800 font-medium">Delete Control</button>
            )}
            <div className={`flex gap-3 ${!isEdit ? 'ml-auto' : ''}`}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary">
                <Save className="w-4 h-4" />
                {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Control'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const STRENGTH_BAR = (val: number) => {
  const pct = Math.round(val * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs">{val.toFixed(2)}</span>
    </div>
  )
}

const TYPE_COLORS: Record<string, string> = {
  PREVENTIVE: 'bg-blue-100 text-blue-800',
  DETECTIVE: 'bg-purple-100 text-purple-800',
  CORRECTIVE: 'bg-orange-100 text-orange-800',
  DIRECTIVE: 'bg-teal-100 text-teal-800',
  COMPENSATING: 'bg-gray-100 text-gray-700',
}

export default function RiskControlPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<{ riskId: string; control?: any } | null>(null)
  const [selectedBuId, setSelectedBuId] = useState('all')

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks-with-controls'],
    queryFn: () => api.get('/risks').then(r => r.data.data),
  })

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  const filtered = (risks as any[]).filter(r =>
    selectedBuId === 'all' || r.businessUnitId === selectedBuId
  )

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Filter */}
        <div className="card card-body flex items-center gap-4">
          <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="label">Filter by Business Unit</label>
            <select title="Business Unit" className="input mt-1" value={selectedBuId} onChange={e => setSelectedBuId(e.target.value)}>
              <option value="all">All Business Units</option>
              {(businessUnits as any[]).map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
        </div>

        {/* Control Matrix */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              Risk Control Matrix
              <span className="text-gray-400 font-normal">({filtered.length} risks)</span>
            </h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No risks found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((risk: any) => {
                const isOpen = expanded.has(risk.id)
                const controls: any[] = risk.controls ?? []
                return (
                  <div key={risk.id}>
                    {/* Risk row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpand(risk.id)}
                    >
                      <button type="button" className="text-gray-400 flex-shrink-0">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <span className="font-mono text-xs text-gray-500 w-16 flex-shrink-0">{risk.riskId}</span>
                      <span className="font-medium text-sm text-gray-900 flex-1 truncate">{risk.name}</span>
                      <span className="text-xs text-gray-500">{risk.businessUnit?.name}</span>
                      <span className="badge bg-gray-100 text-gray-600 text-xs ml-2">{controls.length} control{controls.length !== 1 ? 's' : ''}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setModal({ riskId: risk.id }) }}
                        className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 ml-2"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>

                    {/* Controls table */}
                    {isOpen && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        {controls.length === 0 ? (
                          <div className="px-12 py-4 text-xs text-gray-400 italic">No controls defined — click Add to create the first one.</div>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-200">
                                {['Control','Type','Owner','Strength','Quality','Limits','Assessment','Assurance',''].map(h => (
                                  <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {controls.map((c: any) => (
                                <tr key={c.id} className="hover:bg-white">
                                  <td className="px-4 py-2 font-medium text-gray-800 max-w-xs truncate">{c.title}</td>
                                  <td className="px-4 py-2">
                                    <span className={`badge ${TYPE_COLORS[c.controlType] ?? 'bg-gray-100 text-gray-700'}`}>{c.controlType}</span>
                                  </td>
                                  <td className="px-4 py-2 text-gray-600">{c.owner || '—'}</td>
                                  <td className="px-4 py-2">{STRENGTH_BAR(c.strength ?? 0)}</td>
                                  <td className="px-4 py-2">{STRENGTH_BAR(c.quality ?? 0)}</td>
                                  <td className="px-4 py-2">{c.limits ? <CheckSquare className="w-3.5 h-3.5 text-green-500" /> : <Square className="w-3.5 h-3.5 text-gray-300" />}</td>
                                  <td className="px-4 py-2">{c.assessment ? <CheckSquare className="w-3.5 h-3.5 text-green-500" /> : <Square className="w-3.5 h-3.5 text-gray-300" />}</td>
                                  <td className="px-4 py-2">{c.assurance ? <CheckSquare className="w-3.5 h-3.5 text-green-500" /> : <Square className="w-3.5 h-3.5 text-gray-300" />}</td>
                                  <td className="px-4 py-2">
                                    <button type="button" onClick={() => setModal({ riskId: risk.id, control: c })}
                                      className="text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <ControlModal
          riskId={modal.riskId}
          initial={modal.control}
          onClose={() => setModal(null)}
        />
      )}
    </AppLayout>
  )
}
