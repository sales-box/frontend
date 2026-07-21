import { useCallback, useRef, useState } from 'react'

export interface ToastState { message: string; retry: () => void }

export interface AsyncAction<A extends unknown[]> {
  run: (...args: A) => Promise<void>
  toast: ToastState | null
  clearToast: () => void
}

export function useAsyncAction<A extends unknown[]>(
  fn: (...args: A) => Promise<void>,
  errorLabel: (err: unknown) => string,
): AsyncAction<A> {
  const [toast, setToast] = useState<ToastState | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async (...args: A): Promise<void> => {
    setToast(null)
    try {
      await fnRef.current(...args)
    } catch (err) {
      setToast({
        message: errorLabel(err),
        retry: () => { void run(...args) },
      })
    }
  }, [errorLabel])

  const clearToast = useCallback(() => setToast(null), [])

  return { run, toast, clearToast }
}
