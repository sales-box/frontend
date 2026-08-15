import type { ToastState } from '../hooks/useAsyncAction'

interface ErrorToastProps {
  toast: ToastState | null
}

export function ErrorToast({ toast }: ErrorToastProps) {
  if (!toast) return null
  return (
    <div
      role="status"
      className="
        absolute bottom-3 left-3 right-3 z-10
        bg-[var(--color-danger-light)] text-[var(--color-danger)]
        border border-[var(--color-danger)]
        rounded-[var(--radius-md)]
        p-3 shadow-[var(--shadow-2)]
        flex justify-between items-center gap-2 text-sm
        animate-panel-in
      "
    >
      <span className="font-semibold min-w-0 break-words">{toast.message}</span>
      <button
        onClick={toast.retry}
        className="flex-shrink-0 px-3 py-1 bg-[var(--color-danger)] text-white rounded hover:opacity-90 transition-opacity text-xs font-semibold cursor-pointer"
      >
        Retry
      </button>
    </div>
  )
}
