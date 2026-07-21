import type { ToastState } from '../hooks/useAsyncAction'

interface ErrorToastProps {
  toast: ToastState | null
}

export function ErrorToast({ toast }: ErrorToastProps) {
  if (!toast) return null
  return (
    <div className="bg-[var(--color-danger-light)] text-[var(--color-danger)] p-3 border-b border-[var(--color-danger)] flex justify-between items-center text-sm flex-shrink-0">
      <span className="font-semibold">{toast.message}</span>
      <button
        onClick={toast.retry}
        className="ml-2 px-3 py-1 bg-[var(--color-danger)] text-white rounded hover:opacity-90 transition-opacity text-xs font-semibold cursor-pointer"
      >
        Retry
      </button>
    </div>
  )
}
