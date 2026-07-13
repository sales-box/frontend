import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";

type ToastItem = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[600] flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 bg-primary text-text-on-primary rounded-md px-4 py-2.5 text-[13px] font-body border border-border/30 min-w-[220px] max-w-[92vw]"
          >
            <CheckCircle2 size={15} strokeWidth={1.5} className="text-accent-cool flex-shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-text-on-primary/60 hover:text-text-on-primary cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            >
              <X size={13} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
