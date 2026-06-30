import { AppLayout } from '../../../components/layout/AppLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'
import { useState } from 'react'
import { Users, Plus, X, Save, CheckCircle, XCircle } from 'lucide-react'

const ROLES = ['ADMIN','DIVISION_HEAD','RISK_OWNER','VIEWER']

const EMPTY_USER = { name: '', email: '', password: '', role: 'RISK_OWNER', isActive: true }

function UserModal({ initial, onClose }: { initial?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ? { ...initial, password: '' } : { ...EMPTY_USER })
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? api.put(`/users/${initial.id}`, data).then(r => r.data)
      : api.post('/users', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onClose() },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Save failed'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const data: any = { name: form.name, email: form.email, role: form.role, isActive: form.isActive }
    if (form.password) data.password = form.password
    mutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Edit User' : 'Add User'}</h2>
          <button type="button" onClick={onClose} title="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input title="Full Name" className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Jane Smith" />
          </div>
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input title="Email" className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="jane@company.com" />
          </div>
          <div>
            <label className="label">{isEdit ? 'New Password' : 'Password'} {!isEdit && <span className="text-red-500">*</span>}</label>
            <input title="Password" className="input" type="password" value={form.password}
              onChange={e => set('password', e.target.value)} required={!isEdit} placeholder={isEdit ? 'Leave blank to keep current' : '••••••••'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select title="Role" className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : isEdit ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ROLE_COLORS: Record<string,string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  DIVISION_HEAD: 'bg-blue-100 text-blue-800',
  RISK_OWNER: 'bg-orange-100 text-orange-800',
  VIEWER: 'bg-gray-100 text-gray-700',
}

export default function AdminUsersPage() {
  const [modal, setModal] = useState<null | 'add' | any>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  })

  return (
    <AppLayout>
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            User Management
            <span className="text-gray-400 font-normal">({(users as any[]).length} users)</span>
          </h2>
          <button type="button" onClick={() => setModal('add')} className="btn-primary py-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name','Email','Role','Business Units','Active',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(users as any[]).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {u.role.replace('_',' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.businessUnitMemberships?.map((m: any) => m.businessUnit.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-gray-300" />}
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setModal(u)} className="text-xs text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <UserModal initial={modal === 'add' ? undefined : modal} onClose={() => setModal(null)} />
      )}
    </AppLayout>
  )
}
