import { AppLayout } from '../../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'
import { useState } from 'react'
import { Building2, Plus, X, Save } from 'lucide-react'

const EMPTY_BU = { name: '', description: '', code: '' }

function BuModal({ initial, onClose }: { initial?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ?? { ...EMPTY_BU })
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/business-units/${initial.id}`, data).then(r => r.data)
      : api.post('/business-units', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['business-units'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate({ name: form.name, description: form.description, code: form.code })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit Business Unit' : 'Add Business Unit'}</h2>
          <button type="button" onClick={onClose} title="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input title="Name" className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Corporate Finance" />
          </div>
          <div>
            <label className="label">Short Code</label>
            <input title="Code" className="input" value={form.code ?? ''} onChange={e => set('code', e.target.value)} placeholder="e.g. CF" maxLength={10} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea title="Description" className="input" rows={3} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Brief description…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add Business Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminBusinessUnitsPage() {
  const [modal, setModal] = useState<null | 'add' | any>(null)

  const { data: bus = [], isLoading } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  return (
    <AppLayout>
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            Business Units
            <span className="text-gray-400 font-normal">({(bus as any[]).length} units)</span>
          </h2>
          <button type="button" onClick={() => setModal('add')} className="btn-primary py-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Business Unit
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
          ) : (bus as any[]).length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No business units yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Add Business Unit" to create the first one</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name','Code','Description','Members',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bus as any[]).map((bu: any) => (
                  <tr key={bu.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{bu.name}</td>
                    <td className="px-4 py-3">
                      {bu.code
                        ? <span className="badge bg-brand-50 text-brand-700">{bu.code}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{bu.description || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{bu._count?.members ?? bu.members?.length ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setModal(bu)} className="text-xs text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <BuModal initial={modal === 'add' ? undefined : modal} onClose={() => setModal(null)} />
      )}
    </AppLayout>
  )
}
