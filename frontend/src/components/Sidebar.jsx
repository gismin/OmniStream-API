import { NavLink } from 'react-router-dom'
import {
  BriefcaseIcon,
  SignalIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/exec', label: 'Executive', icon: BriefcaseIcon },
  { to: '/iot', label: 'IoT Monitor', icon: SignalIcon },
  { to: '/procurement', label: 'Procurement', icon: ShoppingCartIcon },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col h-full fixed top-0 left-0">
      <div className="h-14 flex items-center px-5 border-b border-gray-700">
        <span className="text-lg font-bold tracking-tight text-white">
          Omni<span className="text-indigo-400">Stream</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-700 text-xs text-gray-500">
        OmniStream-API v1.0.0
      </div>
    </aside>
  )
}
