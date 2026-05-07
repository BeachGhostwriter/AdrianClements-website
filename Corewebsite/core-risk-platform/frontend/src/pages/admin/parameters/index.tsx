import { AppLayout } from '../../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'
import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'

export default function AdminParametersPage() {
  const qc = useQueryClient()
  const [selectedBuId, setSelectedBuId] = useState('')
  const [form, setForm] = useState({ ceoName: '', riskCoordinator: '', reportingPeriod: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  useEffect(() => {
    if ((businessUnits as any[]).length > 0 && !selectedBuId)
      setSelectedBuId((businessUnits as any[])[0].id)
  }, [businessUnits, selectedBuId])

  // Fetch existing parameters for selected BU via calibration endpoint
  const { data: existing } = useQuery({
    queryKey: ['params', selectedBuId],
    queryFn: () => api.get(`/calibration/${selectedBuId}`).then(r => r.data.data),
    enabled: !!selectedBuId,
  })

  useEffect(() => {
    if (existing) setForm({
      ceoName: existing.ceoName ?? '',
      riskCoordinator: existing.riskCoordinator ?? '',
      reportingPeriod: existing.reportingPeriod ?? '',
    })
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: any) => api.put(`/calibration/${selectedBuId}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['params', selectedBuId] })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    mutation.mutate(form)
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="card card-body flex items-center gap-4">
          <Settings className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="label">Business Unit</label>
            <select title="Business Unit" className="input mt-1" value={selectedBuId}
              onChange={e => setSelectedBuId(e.target.value)}>
              {(businessUnits as any[]).map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="card">
            <div className="card-header">
              <span className="text-xs font-semibold text-gray-700">BU Parameters</span>
            </div>
            <div className="card-body space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="label">CEO / Accountable Executive</label>
                <input title="CEO Name" className="input" placeholder="Full name" value={form.ceoName}
                  onChange={e => set('ceoName', e.target.value)} />
              </div>
              <div>
                <label className="label">Risk Coordinator</label>
                <input title="Risk Coordinator" className="input" placeholder="Full name" value={form.riskCoordinator}
                  onChange={e => set('riskCoordinator', e.target.value)} />
              </div>
              <div>
                <label className="label">Reporting Period</label>
                <input title="Reporting Period" className="input" placeholder="e.g. 2026Q2" value={form.reportingPeriod}
                  onChange={e => set('reportingPeriod', e.target.value)} />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={mutation.isPending || !selectedBuId} className="btn-primary">
                  <Save className="w-4 h-4" />
                  {mutation.isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save Parameters'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
