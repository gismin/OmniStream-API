import { useState } from 'react'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'

const CEO_THRESHOLD = 50000

const MOCK_REQUESTS = [
  { id: 1, title: 'CNC Milling Machine', requester: 'ops@company.com', department: 'Operations', cost: 125000, status: 'pending', requires_ceo_signoff: true, created_at: '2026-04-20T08:00:00' },
  { id: 2, title: 'Server Infrastructure Upgrade', requester: 'it@company.com', department: 'IT', cost: 78000, status: 'pending', requires_ceo_signoff: true, created_at: '2026-04-19T10:00:00' },
  { id: 3, title: 'Office Ergonomic Chairs', requester: 'hr@company.com', department: 'HR', cost: 12000, status: 'approved', requires_ceo_signoff: false, created_at: '2026-04-18T09:00:00' },
  { id: 4, title: 'Forklift Maintenance', requester: 'ops@company.com', department: 'Operations', cost: 8500, status: 'rejected', requires_ceo_signoff: false, created_at: '2026-04-15T11:00:00' },
  { id: 5, title: 'Marketing Analytics Software', requester: 'mkt@company.com', department: 'Marketing', cost: 55000, status: 'pending', requires_ceo_signoff: true, created_at: '2026-04-14T14:00:00' },
]

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ProcurementPage() {
  const [requests, setRequests] = useState(MOCK_REQUESTS)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', requester: '', department: '', cost: '' })

  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    ceo: requests.filter(r => r.requires_ceo_signoff && r.status === 'pending').length,
  }

  const filtered = filter === 'all' ? requests : filter === 'ceo'
    ? requests.filter(r => r.requires_ceo_signoff)
    : requests.filter(r => r.status === filter)

  const costNum = parseFloat(form.cost) || 0
  const willFlag = costNum > CEO_THRESHOLD

  function handleCreate(e) {
    e.preventDefault()
    const cost = parseFloat(form.cost)
    const newReq = {
      id: Date.now(),
      title: form.title,
      requester: form.requester,
      department: form.department,
      cost,
      status: 'pending',
      requires_ceo_signoff: cost > CEO_THRESHOLD,
      created_at: new Date().toISOString(),
    }
    setRequests([newReq, ...requests])
    setForm({ title: '', description: '', requester: '', department: '', cost: '' })
    setShowModal(false)
    toast.success('Request submitted' + (newReq.requires_ceo_signoff ? ' — CEO sign-off required' : ''))
  }

  function handleStatus(id, status) {
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r))
    toast.success(`Request ${status}`)
  }

  function handleDelete(id) {
    setRequests(requests.filter(r => r.id !== id))
    toast.success('Request deleted')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={counts.total} accent="bg-indigo-500" />
        <StatCard title="Pending" value={counts.pending} accent="bg-blue-400" />
        <StatCard title="Approved" value={counts.approved} accent="bg-green-500" />
        <StatCard title="CEO Sign-off Required" value={counts.ceo} accent="bg-orange-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'ceo'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {f === 'ceo' ? '🔺 CEO Flag' : f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Request
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['ID', 'Title', 'Department', 'Cost', 'Status', 'CEO Flag', 'Submitted', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">#{r.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{r.title}</td>
                  <td className="px-4 py-3 text-gray-500">{r.department}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    ${r.cost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.requires_ceo_signoff
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">🔺 CEO</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-400">{timeAgo(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatus(r.id, 'approved')}
                            className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">Approve</button>
                          <button onClick={() => handleStatus(r.id, 'rejected')}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Reject</button>
                        </>
                      )}
                      {r.status !== 'pending' && <span className="text-xs text-gray-400 italic">Terminal</span>}
                      <button onClick={() => handleDelete(r.id)}
                        className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">New Procurement Request</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[['title','Title *','e.g. Industrial Printer'],['requester','Requester *','e.g. ops@company.com'],['department','Department *','e.g. Operations']].map(([field,label,ph])=>(
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input required value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={ph}/>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (USD) *</label>
                <input required type="number" min="1" step="0.01" value={form.cost}
                  onChange={e=>setForm({...form,cost:e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 75000"/>
                {willFlag && (
                  <p className="mt-1 text-xs text-orange-600 font-medium">⚠ This request will require CEO sign-off (cost &gt; $50,000)</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
