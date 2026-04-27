import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import { LoadingSpinner, ErrorBanner } from '../components/PageState'
import { iotApi } from '../api/iot'

const TEMP_WARN = 75, TEMP_CRIT = 90
const PRES_WARN = 80, PRES_CRIT = 95
const VIB_WARN = 5,  VIB_CRIT = 8
const WS_URL = (import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000') + '/iot/ws'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function SensorBar({ label, value, max, warn, crit }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = value >= crit ? 'bg-red-500' : value >= warn ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-medium text-gray-700">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const borderColor = { normal: 'border-green-300', warning: 'border-yellow-400', critical: 'border-red-400' }

export default function IoTPage() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('card')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [wsStatus, setWsStatus] = useState('connecting')
  const [form, setForm] = useState({ device_id: '', device_name: '', temperature: '', pressure: '', vibration: '' })
  const wsRef = useRef(null)

  const fetchReadings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await iotApi.list()
      setReadings(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // WebSocket connection
  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => setWsStatus('live')

      ws.onmessage = (event) => {
        const newReading = JSON.parse(event.data)
        setReadings(prev => [newReading, ...prev])
        if (newReading.status === 'critical') {
          toast.error(`🔴 CRITICAL: ${newReading.device_name}`)
        } else if (newReading.status === 'warning') {
          toast(`⚠ Warning: ${newReading.device_name}`, { icon: '🟡' })
        }
      }

      ws.onclose = () => {
        setWsStatus('disconnected')
        // Reconnect after 3 seconds
        setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        setWsStatus('disconnected')
        ws.close()
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [])

  useEffect(() => { fetchReadings() }, [fetchReadings])

  const counts = {
    devices: [...new Set(readings.map(r => r.device_id))].length,
    normal: readings.filter(r => r.status === 'normal').length,
    warning: readings.filter(r => r.status === 'warning').length,
    critical: readings.filter(r => r.status === 'critical').length,
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await iotApi.create({
        device_id: form.device_id,
        device_name: form.device_name,
        temperature: parseFloat(form.temperature),
        pressure: parseFloat(form.pressure),
        vibration: parseFloat(form.vibration),
      })
      // WebSocket will push the new reading automatically
      setForm({ device_id: '', device_name: '', temperature: '', pressure: '', vibration: '' })
      setShowModal(false)
      toast.success('Reading logged — updating via WebSocket...')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await iotApi.remove(id)
      setReadings(prev => prev.filter(r => r.id !== id))
      toast.success('Reading deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const wsIndicator = {
    live: <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live</span>,
    connecting: <span className="flex items-center gap-1 text-xs text-yellow-600"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />Connecting</span>,
    disconnected: <span className="flex items-center gap-1 text-xs text-red-500"><span className="w-2 h-2 rounded-full bg-red-500" />Disconnected</span>,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Devices" value={counts.devices} accent="bg-indigo-500" />
        <StatCard title="Normal" value={counts.normal} accent="bg-green-500" />
        <StatCard title="Warning" value={counts.warning} accent="bg-yellow-400" />
        <StatCard title="Critical" value={counts.critical} accent="bg-red-500" />
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchReadings} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['card', 'table'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  view === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {v === 'card' ? '🃏 Card View' : '📋 Table View'}
              </button>
            ))}
          </div>
          {wsIndicator[wsStatus]}
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Log Reading
        </button>
      </div>

      {loading ? <LoadingSpinner /> : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {readings.length === 0 && <p className="text-gray-400 col-span-3 text-center py-8">No readings yet. Log one above.</p>}
          {readings.map(r => (
            <div key={r.id} className={`bg-white rounded-xl border-2 shadow-sm p-4 space-y-3 ${borderColor[r.status] ?? 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{r.device_name}</p>
                  <p className="text-xs text-gray-400">{r.device_id}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="space-y-2">
                <SensorBar label="🌡 Temperature (°C)" value={r.temperature} max={120} warn={TEMP_WARN} crit={TEMP_CRIT} />
                <SensorBar label="⚡ Pressure (Bar)" value={r.pressure} max={120} warn={PRES_WARN} crit={PRES_CRIT} />
                <SensorBar label="〰 Vibration (mm/s)" value={r.vibration} max={12} warn={VIB_WARN} crit={VIB_CRIT} />
              </div>
              <div className="flex justify-between items-center pt-1">
                <p className="text-xs text-gray-400">Updated {timeAgo(r.timestamp)}</p>
                <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['ID', 'Device', 'Temp °C', 'Pressure Bar', 'Vibration mm/s', 'Status', 'Time', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {readings.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{r.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.device_name}</p>
                    <p className="text-xs text-gray-400">{r.device_id}</p>
                  </td>
                  <td className="px-4 py-3">{r.temperature}</td>
                  <td className="px-4 py-3">{r.pressure}</td>
                  <td className="px-4 py-3">{r.vibration}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-400">{timeAgo(r.timestamp)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {readings.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No readings yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Log Telemetry Reading</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[['device_id','Device ID *','e.g. machine-006'],['device_name','Device Name *','e.g. Pump F']].map(([f,l,p])=>(
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input required value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={p}/>
                </div>
              ))}
              {[['temperature','Temperature (°C) *','0–120'],['pressure','Pressure (Bar) *','0–120'],['vibration','Vibration (mm/s) *','0–12']].map(([f,l,p])=>(
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input required type="number" step="0.1" value={form[f]} onChange={e=>setForm({...form,[f]:e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={p}/>
                </div>
              ))}
              <p className="text-xs text-gray-400 italic">Status is computed automatically. New reading appears instantly via WebSocket.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Logging...' : 'Log Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
