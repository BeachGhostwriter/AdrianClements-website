import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from 'shared-types'

export function useRequireAuth(requiredRoles?: UserRole[]) {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (isLoading) return
    if (!user) { navigate('/login'); return }
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      navigate('/dashboard')
    }
  }, [user, isLoading, navigate, requiredRoles])
  return { user, isLoading }
}
