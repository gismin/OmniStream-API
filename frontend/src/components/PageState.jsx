export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
      <p className="text-sm text-red-700">⚠ {message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-red-600 font-medium hover:underline ml-4">
          Retry
        </button>
      )}
    </div>
  )
}
