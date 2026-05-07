import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { Flame, Plus, X, Save } from 'lucide-react'

const CATEGORIES = ['OPS','REG','TECH','FIN','STR','REP','ENV','HR','LEGAL','OTHER']
const STATUSES   = ['ACTIVE','CONTAINMENT','STABILISATION','RECOVERY','RESILIENCE','CLOSED']

const URGENCY_COLORS: Record<string,string> = {
  Emergency:   'bg-red-700 text-white',
  Crisis:      'bg-red-100 text-red-800',
  Accelerated: 'bg-orange-100 text-orange-800',
  Standard:    'bg-green-100 text-green-800',
}

const EMPTY_CRISIS = {
  name: '', description: '', category: 'OPS', status: 'ACTIVE',
  probability: 0.5, impactEur: 50, velocity: 1.0, severity: 5,
  amplification: 1.0, accelerationRate: 0.1, propagationRatio: 0.5,
  decisionQuality: 5, responseEffectiveness: 0.5, resourceFactor: 0.5,
  containmentIndex: 0.5, businessUnitId: '', notes: '',
}

function CrisisModal({ initial, onClose, businessUnits }: {
  initial?: any; onClose: () => void; businessUnits: any[]
}) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ?? { ...EMPTY_CRISIS, businessUnitId: businessUnits[0]?.id ?? '' })
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/crises/${initial.id}`, data).then(r => r.data)
      : api.post('/crises', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crises'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const numFields = ['probability','impactEur','velocity','severity','amplification',
    'accelerationRate','propagationRatio','decisionQuality','responseEffectiveness',
    'resourceFactor','containmentIndex']

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const data = { ...form }
    numFields.forEach(k => { data[k] = parseFloat(data[k]) })
    mutation.mutate(data)
  }

  const Field = ({ label, name, min = 0, max, step = 0.01, hint = '' }: any) => (
    <div>
      <label className="label">{label}{hint && <span className="text-gray-400 font-normal ml-1">{hint}</span>}</label>
      <input className="input" type="number" min={min} max={max} step={step}
        value={form[name]} onChange={e => set(name, e.target.value)} required />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Crisis' : 'Add New Crisis'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="label">Business Unit <span className="text-red-500">*</span></label>
            <select className="input" value={form.businessUnitId} onChange={e => set('businessUnitId', e.target.value)} required>
              <option value="">Select BU…</option>
              {businessUnits.map((bu: any) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Crisis Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Supply chain disruption" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
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

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">FORGE Parameters</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Probability L(t)" name="probability" max={1} hint="[0–1]" />
            <Field label="Impact I(t)" name="impactEur" step={0.1} hint="[€M]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Velocity V" name="velocity" step={0.1} />
            <Field label="Severity" name="severity" min={1} max={10} step={0.1} hint="[1–10]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Propagation Ratio v/v_max" name="propagationRatio" max={0.99} hint="[0–0.99]" />
            <Field label="Amplification A" name="amplification" max={3} step={0.1} hint="[0–3]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Response Effectiveness" name="responseEffectiveness" max={1} hint="[0–1]" />
            <Field label="Resource Factor" name="resourceFactor" max={1} hint="[0–1]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Containment Index CI" name="containmentIndex" max={1} hint="[0–1]" />
            <Field label="Decision Quality" name="decisionQuality" min={1} max={10} step={0.1} hint="[1–10]" />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update Crisis' : 'Add Crisis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ForgePage() {
  const [modal, setModal] = useState<null | 'add' | any>(null)

  const { data: crises = [], isLoading } = useQuery({
    queryKey: ['crises'],
    queryFn: () => api.get('/crises').then(r => r.data.data),
  })
  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              FORGE Crisis Register
              <span className="text-gray-400 font-normal">({crises.length} crises)</span>
            </h2>
            <button type="button" onClick={() => setModal('add')} className="btn-primary py-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Crisis
            </button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading crises…</div>
            ) : crises.length === 0 ? (
              <div className="p-12 text-center">
                <Flame className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No crises registered</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Crisis" to register a crystallised risk</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['ID','Crisis Name','Cat','Severity','R-TTS','Residual €M','Recovery (mo)','Urgency','Class','Backcast 50%','Status',''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {crises.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-gray-500">{c.crisisId}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 max-w-40 truncate">{c.name}</td>
                      <td className="px-3 py-2.5"><span className="badge bg-gray-100 text-gray-700">{c.category}</span></td>
                      <td className="px-3 py-2.5">{c.severity?.toFixed(1)}/10</td>
                      <td className="px-3 py-2.5 font-mono font-semibold">{c.rTts?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5">€{c.residualEur?.toFixed(1) ?? '—'}M</td>
                      <td className="px-3 py-2.5">{c.recoveryMonths?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono">{c.urgencyIndex?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        {c.urgencyClass && <span className={`badge ${URGENCY_COLORS[c.urgencyClass] ?? 'bg-gray-100 text-gray-700'}`}>{c.urgencyClass}</span>}
                      </td>
                      <td className="px-3 py-2.5 font-mono">{c.backcast50?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2.5"><span className="badge bg-blue-100 text-blue-800">{c.status}</span></td>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => setModal(c)} className="text-xs text-brand-600 hover:text-brand-800 font-medium">Edit</button>
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
        <CrisisModal
          initial={modal === 'add' ? undefined : modal}
          onClose={() => setModal(null)}
          businessUnits={businessUnits}
        />
      )}
    </AppLayout>
  )
}
