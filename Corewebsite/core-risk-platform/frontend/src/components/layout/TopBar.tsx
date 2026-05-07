import { useLocation } from 'react-router-dom'
import { Bell, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Executive Dashboard',
  '/radar': 'RADAR — Risk Assessment Detection & Alert Register',
  '/forge': 'FORGE — Focused Organisational Response & Governance Engine',
  '/opportunities': 'Opportunities Register',
  '/top-risks': 'Top 10 Risks',
  '/risk-control': 'Risk Control Matrix',
  '/risk-interaction': 'Risk Interaction Map',
  '/risk-aggregation': 'Risk Aggregation & Monte Carlo',
  '/long-term-risks': 'Long-term Risk Horizon',
  '/conformal': 'CCORD Conformal Diagram',
  '/calibration': 'Organisational Calibration',
  '/objectives': 'Strategic Objectives',
  '/admin/users': 'User Management',
  '/admin/business-units': 'Business Units',
  '/admin/parameters': 'System Parameters',
  '/admin/formulas': 'Formula Reference',
}

export function TopBar() {
  const location = useLocation()
  const { user } = useAuth()
  const title = PAGE_TITLES[location.pathname] ?? 'CORE v7'
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-sm font-semibold text-gray-900 flex-1 truncate">{title}</h1>
      <div className="flex items-center gap-2">
        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {user?.role?.toLowerCase().replace('_', ' ')}
        </span>
      </div>
    </header>
  )
}
