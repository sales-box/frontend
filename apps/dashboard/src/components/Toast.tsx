import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastTone = "info" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };

/**
 * How long a toast stays.
 *
 * A fixed 3.5s was fine for "HubSpot connected" and far too short for a
 * sentence explaining why a connection failed — it vanished mid-read. Long
 * messages now get proportionally longer, capped so nothing camps on screen.
 * Roughly 15 characters a second, which is unhurried reading.
 */
function readingTime(message: string): number {
  return Math.min(12_000, Math.max(4_000, 4_000 + message.length * 45));
}

let _globalPush: ((msg: string, tone?: ToastTone) => void) | null = null;

export function globalToast(message: string, tone: ToastTone = "info") {
  if (_globalPush) _globalPush(message, tone);
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), readingTime(message));
  }, []);

  useEffect(() => {
    _globalPush = push;
    return () => { _globalPush = null; };
  }, [push]);

  const dismiss = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-4 right-4 z-[600] flex flex-col gap-2 max-w-[min(28rem,92vw)]" role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-start gap-2.5 bg-primary text-text-on-primary rounded-md px-4 py-2.5 text-[13px] font-body border border-border/30 min-w-[220px] shadow-lg"
          >
            {t.tone === "error" ? (
              <AlertCircle size={15} strokeWidth={1.5} className="text-danger flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={15} strokeWidth={1.5} className="text-accent-cool flex-shrink-0 mt-0.5" />
            )}
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
