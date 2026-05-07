import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Radar, Flame, TrendingUp, ShieldAlert,
  Network, BarChart3, Target, Clock, Activity, Settings,
  Users, Building2, Sliders, BookOpen, ChevronRight
} from 'lucide-react'

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
    ],
  },
  {
    label: 'Risk Engines',
    items: [
      { href: '/radar',      label: 'RADAR',            icon: Radar },
      { href: '/forge',      label: 'FORGE',            icon: Flame },
      { href: '/opportunities', label: 'Opportunities', icon: TrendingUp },
    ],
  },
  {
    label: 'Risk Analysis',
    items: [
      { href: '/top-risks',          label: 'Top 10 Risks',    icon: ShieldAlert },
      { href: '/risk-control',       label: 'Risk Control',    icon: Target },
      { href: '/risk-interaction',   label: 'Interaction Map', icon: Network },
      { href: '/risk-aggregation',   label: 'Aggregation',     icon: BarChart3 },
      { href: '/long-term-risks',    label: 'Long-term Risks', icon: Clock },
      { href: '/conformal',          label: 'CCORD Diagram',   icon: Activity },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: '/calibration',  label: 'Calibration',  icon: Sliders },
      { href: '/objectives',   label: 'Objectives',   icon: Target },
    ],
  },
]

const adminSection = {
  label: 'Administration',
  items: [
    { href: '/admin/users',           label: 'Users',           icon: Users },
    { href: '/admin/business-units',  label: 'Business Units',  icon: Building2 },
    { href: '/admin/parameters',      label: 'Parameters',      icon: Settings },
    { href: '/admin/formulas',        label: 'Formula Reference', icon: BookOpen },
  ],
}

export function Sidebar() {
  const location = useLocation()
  const { user, logout, isAdmin } = useAuth()
  const sections = isAdmin ? [...navSections, adminSection] : navSections

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = location.pathname === href || location.pathname.startsWith(href + '/')
    return (
      <Link to={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{label}</span>
        {active && <ChevronRight className="w-3 h-3 ml-auto" />}
      </Link>
    )
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">CORE v7</p>
            <p className="text-xs text-gray-500 leading-tight">Risk Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {sections.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
            {user?.name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600 text-xs">Out</button>
        </div>
      </div>
    </aside>
  )
}
