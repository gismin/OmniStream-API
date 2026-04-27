import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const titles = {
  '/exec': 'Executive Workflows',
  '/iot': 'IoT Telemetry',
  '/procurement': 'Procurement Requests',
}

const roleColors = {
  admin: 'bg-indigo-600',
  operator: 'bg-green-600',
  executive: 'bg-orange-500',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const title = titles[pathname] ?? 'OmniStream'

  function handleLogout() {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${roleColors[user.role] ?? 'bg-gray-500'}`}>
              {user.username[0].toUpperCase()}
            </div>
            <button onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1">
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}
