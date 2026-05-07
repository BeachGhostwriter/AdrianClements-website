import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AuthUser } from 'shared-types'
import { api } from '../services/api'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isDivisionHead: boolean
  isRiskOwner: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('core_token')
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.data))
        .catch(() => localStorage.removeItem('core_token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data.data
    localStorage.setItem('core_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    navigate('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('core_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading, login, logout,
      isAdmin: user?.role === 'ADMIN',
      isDivisionHead: user?.role === 'DIVISION_HEAD',
      isRiskOwner: user?.role === 'RISK_OWNER',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
