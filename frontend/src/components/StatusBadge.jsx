const styles = {
  normal:    'bg-green-100 text-green-800 border-green-300',
  approved:  'bg-green-100 text-green-800 border-green-300',
  warning:   'bg-yellow-100 text-yellow-800 border-yellow-300',
  review:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  critical:  'bg-red-100 text-red-800 border-red-300',
  rejected:  'bg-red-100 text-red-800 border-red-300',
  pending:   'bg-blue-100 text-blue-800 border-blue-300',
  draft:     'bg-gray-100 text-gray-600 border-gray-300',
  ceo_flag:  'bg-orange-100 text-orange-800 border-orange-300',
}

const dots = {
  normal:   'bg-green-500',
  approved: 'bg-green-500',
  warning:  'bg-yellow-500',
  review:   'bg-yellow-500',
  critical: 'bg-red-500',
  rejected: 'bg-red-500',
  pending:  'bg-blue-500',
  draft:    'bg-gray-400',
  ceo_flag: 'bg-orange-500',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase() ?? 'draft'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[key] ?? styles.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[key] ?? dots.draft}`} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  )
}
