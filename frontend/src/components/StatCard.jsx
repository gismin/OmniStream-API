export default function StatCard({ title, value, accent = 'bg-indigo-500' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-2">
      <div className={`w-8 h-1 rounded-full ${accent}`} />
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
