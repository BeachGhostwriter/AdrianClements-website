import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try { await login(email, password) }
    catch { setError('Invalid credentials. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CORE v7</h1>
          <p className="text-gray-500 text-sm mt-1">Risk Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input" placeholder="you@company.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full btn-primary justify-center py-2.5 mt-2">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          CORE© Framework — Confidential
        </p>
      </div>
    </div>
  )
}
