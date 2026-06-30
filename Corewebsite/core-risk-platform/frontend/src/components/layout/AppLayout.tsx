import { ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useRequireAuth } from '../../hooks/useRequireAuth'

export function AppLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useRequireAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
