import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState } from 'react'
import { TrendingUp, Plus, X, Save } from 'lucide-react'

const CATEGORIES = ['STR','FIN','TECH','OPS','REG','REP','ENV','HR','LEGAL','OTHER']

const EMPTY_OPP = {
  name: '', description: '', category: 'STR',
  probability: 0.3, upsideEur: 10, windowMonths: 12,
  stratFit: 0.5, smiAlign: 0.5, investEur: 0,
  readiness: 0.5, captureStatus: 0,
  businessUnitId: '', notes: '',
}

function OppModal({ initial, onClose, businessUnits }: {
  initial?: any; onClose: () => void; businessUnits: any[]
}) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ?? { ...EMPTY_OPP, businessUnitId: businessUnits[0]?.id ?? '' })
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const numFields = ['probability','upsideEur','windowMonths','stratFit','smiAlign','investEur','readiness','captureStatus']

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/opportunities/${initial.id}`, data).then(r => r.data)
      : api.post('/opportunities', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opportunities'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

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
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Opportunity' : 'Add New Opportunity'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close"><X className="w-5 h-5" /></button>
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
            <label className="label">Opportunity Name <span className="text-red-500">*</span></label>
            <input title="Opportunity Name" className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. New market entry — DACH region" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea title="Description" className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description…" />
          </div>

          <div>
            <label className="label">Category</label>
            <select title="Category" className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">OTS Parameters</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Capture Probability P(t)" name="probability" max={1} hint="[0–1]" />
            <Field label="Upside Value B(t)" name="upsideEur" step={0.1} hint="[€M]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Window Duration" name="windowMonths" min={1} step={1} hint="[months]" />
            <Field label="Investment Required" name="investEur" step={0.1} hint="[€M]" />
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Strategic Fit</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Strategic Fit" name="stratFit" max={1} hint="[0–1]" />
            <Field label="SMI Alignment" name="smiAlign" max={1} hint="[0–1]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Readiness R/R_opt" name="readiness" max={1} hint="[0–1]" />
            <Field label="Capture Status" name="captureStatus" max={1} hint="[0–1]" />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea title="Notes" className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update Opportunity' : 'Add Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OpportunitiesPage() {
  const [modal, setModal] = useState<null | 'add' | any>(null)

  const { data: opps = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => api.get('/opportunities').then(r => r.data.data),
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
              <TrendingUp className="w-4 h-4 text-green-500" />
              Opportunity Register
              <span className="text-gray-400 font-normal">SMI-amplified capture</span>
              <span className="text-gray-400 font-normal">({opps.length})</span>
            </h2>
            <button type="button" onClick={() => setModal('add')} className="btn-primary py-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Opportunity
            </button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
            ) : opps.length === 0 ? (
              <div className="p-12 text-center">
                <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No opportunities registered</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Opportunity" to capture the first opportunity</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['ID','Opportunity','Cat','Prob','Upside €M','Window (mo)','Strat Fit','Capture Idx','OTS Amplified','ROI','Priority','Readiness',''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {opps.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-gray-500">{o.oppId}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900 max-w-40 truncate">{o.name}</td>
                      <td className="px-3 py-2.5">{o.category ?? '—'}</td>
                      <td className="px-3 py-2.5">{(o.probability * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2.5 font-semibold text-green-700">€{o.upsideEur?.toFixed(1)}M</td>
                      <td className="px-3 py-2.5">{o.windowMonths}</td>
                      <td className="px-3 py-2.5">{(o.stratFit * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2.5 font-mono">{o.captureIdx?.toFixed(3) ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold">{o.otsAmplified?.toFixed(2) ?? '—'}</td>
                      <td className="px-3 py-2.5">{o.roi ? `${(o.roi * 100).toFixed(0)}%` : '—'}</td>
                      <td className="px-3 py-2.5">{o.priority ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(o.readiness ?? 0) * 100}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
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
        <OppModal
          initial={modal === 'add' ? undefined : modal}
          onClose={() => setModal(null)}
          businessUnits={businessUnits}
        />
      )}
    </AppLayout>
  )
}
