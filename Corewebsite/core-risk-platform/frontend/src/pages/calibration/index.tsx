import { AppLayout } from '../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { useState, useEffect } from 'react'
import { Sliders, Save, RefreshCw, Info } from 'lucide-react'

const DEFAULTS = {
  vMax: 1.0, psiC: 5.0, beta: 2.0, gamma: 3.0, alpha: 0.15,
  delta: 1.0, ttsHorizon: 16.67, kappaCoh: 0.2, alphaWeight: 0.5, asymmetryFactor: 1.4,
  ceWeight: 0.35, tcWeight: 0.30, rcWeight: 0.25, srWeight: 0.10,
  orgSize: '', sector: '', riskMaturity: '', reportingPeriod: '', timeHorizon: '',
}

const PARAM_GROUPS = [
  {
    label: 'CORE / RADAR Engine',
    hint: 'White Paper CORE v4.0 — Section 3',
    params: [
      { key: 'vMax',        label: 'Max Propagation Velocity v_max',  hint: 'Caps Lorentz denominator',                step: 0.01, min: 0.1, max: 10 },
      { key: 'psiC',        label: 'Critical Threshold ψ_c',          hint: 'System stress tipping point',             step: 0.1,  min: 0,   max: 50 },
      { key: 'beta',        label: 'Criticality Amplification β',      hint: 'Scales criticality multiplier',          step: 0.1,  min: 0,   max: 10 },
      { key: 'gamma',       label: 'Criticality Exponent γ',           hint: 'Power-law sharpness',                    step: 0.1,  min: 0,   max: 10 },
      { key: 'alpha',       label: 'Acceleration Rate α',              hint: 'Exponential growth rate',                step: 0.01, min: 0,   max: 2  },
      { key: 'ttsHorizon',  label: 'TTS Appetite Horizon (quarters)',   hint: 'Stability window for risk appetite',     step: 0.1,  min: 1,   max: 100 },
    ],
  },
  {
    label: 'RADAR — Coherence & Phase',
    hint: 'White Paper RADAR v4.0 — Section 4',
    params: [
      { key: 'kappaCoh',    label: 'Coherence Coupling κ_coh',  hint: 'Cascade synchronisation sensitivity', step: 0.01, min: 0, max: 2 },
      { key: 'alphaWeight', label: 'Industry/Maturity Weight α', hint: 'Balance between industry & maturity', step: 0.01, min: 0, max: 1 },
    ],
  },
  {
    label: 'FORGE Engine',
    hint: 'White Paper FORGE v4.0 — Section 3',
    params: [
      { key: 'delta',           label: 'Sigmoid Width δ',         hint: 'Sharpness of criticality transition', step: 0.01, min: 0.01, max: 10 },
      { key: 'asymmetryFactor', label: 'Asymmetry Factor (Opp)',   hint: 'Opp threshold = RA × (1 + factor)',  step: 0.01, min: 0,    max: 5  },
    ],
  },
  {
    label: 'Resilience Index Weights',
    hint: 'Must sum to 1.0 — FORGE Section 4.2',
    params: [
      { key: 'ceWeight', label: 'Control Effectiveness (CE)',  hint: 'Default 0.35', step: 0.01, min: 0, max: 1 },
      { key: 'tcWeight', label: 'Team Capability (TC)',         hint: 'Default 0.30', step: 0.01, min: 0, max: 1 },
      { key: 'rcWeight', label: 'Response Capacity (RC)',       hint: 'Default 0.25', step: 0.01, min: 0, max: 1 },
      { key: 'srWeight', label: 'System Redundancy (SR)',       hint: 'Default 0.10', step: 0.01, min: 0, max: 1 },
    ],
  },
]

export default function CalibrationPage() {
  const qc = useQueryClient()
  const [selectedBuId, setSelectedBuId] = useState('')
  const [form, setForm] = useState<any>({ ...DEFAULTS })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { data: businessUnits = [] } = useQuery({
    queryKey: ['business-units'],
    queryFn: () => api.get('/business-units').then(r => r.data.data),
  })

  useEffect(() => {
    if (businessUnits.length > 0 && !selectedBuId) setSelectedBuId((businessUnits as any[])[0].id)
  }, [businessUnits, selectedBuId])

  const { data: calib, isLoading } = useQuery({
    queryKey: ['calibration', selectedBuId],
    queryFn: () => api.get(`/calibration/${selectedBuId}`).then(r => r.data.data),
    enabled: !!selectedBuId,
  })

  useEffect(() => {
    setForm(calib ? { ...DEFAULTS, ...calib } : { ...DEFAULTS })
  }, [calib])

  const mutation = useMutation({
    mutationFn: (data: any) => api.put(`/calibration/${selectedBuId}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calibration', selectedBuId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const riSum = ['ceWeight','tcWeight','rcWeight','srWeight']
    .reduce((s, k) => s + parseFloat(form[k] ?? 0), 0)
  const riValid = Math.abs(riSum - 1.0) < 0.001

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!riValid) { setError(`RI weights must sum to 1.0 (currently ${riSum.toFixed(3)})`); return }
    const data: any = {}
    Object.keys(DEFAULTS).forEach(k => {
      const v = form[k]
      const def = (DEFAULTS as any)[k]
      data[k] = typeof def === 'number' ? parseFloat(v ?? 0) : (v ?? '')
    })
    mutation.mutate(data)
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* BU selector */}
        <div className="card card-body flex items-center gap-4">
          <Sliders className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="label">Business Unit</label>
            <select title="Business Unit" className="input mt-1" value={selectedBuId}
              onChange={e => setSelectedBuId(e.target.value)}>
              {(businessUnits as any[]).map(bu => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="card card-body text-center text-gray-400 text-sm py-12">Loading calibration…</div>
        ) : (
          <form onSubmit={submit} className="space-y-6">

            {/* Reporting context */}
            <div className="card">
              <div className="card-header">
                <span className="text-xs font-semibold text-gray-700">Reporting Context</span>
              </div>
              <div className="card-body grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Reporting Period</label>
                  <input title="Reporting Period" className="input" placeholder="e.g. 2026Q2"
                    value={form.reportingPeriod ?? ''} onChange={e => set('reportingPeriod', e.target.value)} />
                </div>
                <div>
                  <label className="label">Time Horizon</label>
                  <input title="Time Horizon" className="input" placeholder="e.g. next 3 – 5 years"
                    value={form.timeHorizon ?? ''} onChange={e => set('timeHorizon', e.target.value)} />
                </div>
                <div>
                  <label className="label">Organisation Size</label>
                  <select title="Organisation Size" className="input" value={form.orgSize ?? ''} onChange={e => set('orgSize', e.target.value)}>
                    <option value="">Select…</option>
                    {['Micro','Small','Medium','Large','Enterprise'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Risk Maturity</label>
                  <select title="Risk Maturity" className="input" value={form.riskMaturity ?? ''} onChange={e => set('riskMaturity', e.target.value)}>
                    <option value="">Select…</option>
                    {['Initial','Developing','Defined','Managed','Optimising'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Sector</label>
                  <input title="Sector" className="input" placeholder="e.g. Financial Services"
                    value={form.sector ?? ''} onChange={e => set('sector', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Parameter groups */}
            {PARAM_GROUPS.map(group => (
              <div key={group.label} className="card">
                <div className="card-header flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-700">{group.label}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{group.hint}</p>
                  </div>
                  {group.label === 'Resilience Index Weights' && (
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      riValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      Σ = {riSum.toFixed(3)}
                    </span>
                  )}
                </div>
                <div className="card-body grid grid-cols-2 gap-x-6 gap-y-4">
                  {group.params.map(p => (
                    <div key={p.key}>
                      <label className="label flex items-center gap-1">
                        {p.label}
                        <span title={p.hint} className="text-gray-400 cursor-help"><Info className="w-3 h-3" /></span>
                      </label>
                      <input
                        title={p.label}
                        className="input font-mono"
                        type="number"
                        step={p.step}
                        min={p.min}
                        max={p.max}
                        value={form[p.key] ?? ''}
                        onChange={e => set(p.key, e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-400 mt-0.5">{p.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex items-center justify-between pb-6">
              <button type="button" onClick={() => setForm({ ...DEFAULTS })} className="btn-secondary text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Reset to defaults
              </button>
              <button type="submit" disabled={mutation.isPending || !selectedBuId} className="btn-primary">
                <Save className="w-4 h-4" />
                {mutation.isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save Calibration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
