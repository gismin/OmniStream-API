import { useLocation } from 'react-router-dom'

const titles = {
  '/exec': 'Executive Workflows',
  '/iot': 'IoT Telemetry',
  '/procurement': 'Procurement Requests',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'OmniStream'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Admin</span>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
          A
        </div>
      </div>
    </header>
  )
}
