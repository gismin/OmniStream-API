import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const DEFAULT_USERS = [
  { username: 'admin',     password: 'admin123',     role: 'Admin — full access' },
  { username: 'operator',  password: 'operator123',  role: 'Operator — IoT + Exec' },
  { username: 'executive', password: 'executive123', role: 'Executive — Procurement approval' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Logged in successfully')
      navigate('/exec')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function fillCredentials(username, password) {
    setForm({ username, password })
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Omni<span className="text-indigo-400">Stream</span>
          </h1>
          <p className="mt-2 text-gray-400 text-sm">Sign in to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Default credentials hint */}
        <div className="bg-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Default accounts (dev only)
          </p>
          {DEFAULT_USERS.map(u => (
            <button
              key={u.username}
              onClick={() => fillCredentials(u.username, u.password)}
              className="w-full text-left px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <span className="text-white text-sm font-medium">{u.username}</span>
              <span className="text-gray-400 text-xs ml-2">/ {u.password}</span>
              <span className="block text-indigo-400 text-xs">{u.role}</span>
            </button>
          ))}
          <p className="text-xs text-gray-500 italic">Click any account to fill credentials</p>
        </div>

      </div>
    </div>
  )
}
