import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import { LoadingSpinner, ErrorBanner } from '../components/PageState'
import { execApi } from '../api/exec'

const TRANSITIONS = {
  draft: ['review'],
  review: ['approved', 'rejected'],
  approved: [],
  rejected: [],
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ExecPage() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', owner: '', description: '' })
  const [filter, setFilter] = useState('all')

  const fetchWorkflows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await execApi.list()
      setWorkflows(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWorkflows() }, [fetchWorkflows])

  const counts = {
    total: workflows.length,
    draft: workflows.filter(w => w.status === 'draft').length,
    review: workflows.filter(w => w.status === 'review').length,
    approved: workflows.filter(w => w.status === 'approved').length,
  }

  const filtered = filter === 'all' ? workflows : workflows.filter(w => w.status === filter)

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await execApi.create(form)
      setWorkflows([res.data, ...workflows])
      setForm({ title: '', owner: '', description: '' })
      setShowModal(false)
      toast.success('Workflow created')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTransition(id, status) {
    try {
      const res = await execApi.updateStatus(id, status)
      setWorkflows(workflows.map(w => w.id === id ? res.data : w))
      toast.success(`Status updated to ${status}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await execApi.remove(id)
      setWorkflows(workflows.filter(w => w.id !== id))
      toast.success('Workflow deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={counts.total} accent="bg-indigo-500" />
        <StatCard title="Draft" value={counts.draft} accent="bg-gray-400" />
        <StatCard title="In Review" value={counts.review} accent="bg-yellow-400" />
        <StatCard title="Approved" value={counts.approved} accent="bg-green-500" />
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchWorkflows} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {['all', 'draft', 'review', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Workflow
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['ID', 'Title', 'Owner', 'Status', 'Updated', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">#{w.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{w.title}</td>
                    <td className="px-4 py-3 text-gray-500">{w.owner}</td>
                    <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                    <td className="px-4 py-3 text-gray-400">{timeAgo(w.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {TRANSITIONS[w.status]?.map(next => (
                          <button key={next} onClick={() => handleTransition(w.id, next)}
                            className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 capitalize">
                            → {next}
                          </button>
                        ))}
                        {TRANSITIONS[w.status]?.length === 0 && (
                          <span className="text-xs text-gray-400 italic">Terminal</span>
                        )}
                        <button onClick={() => handleDelete(w.id)}
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No workflows found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">New Workflow</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Q4 Strategy Review" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                <input required value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. alice@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional description..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
