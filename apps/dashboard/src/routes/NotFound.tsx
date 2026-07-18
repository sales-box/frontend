import type { Screen } from "../types";
import { Card } from "../components/Card";
import { MinimalHeader } from "../components/MinimalHeader";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function NotFound({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="min-h-[100dvh] bg-surface-tertiary font-body flex flex-col">
      <MinimalHeader onBack={() => onNav("landing")} />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[28rem]">
          <Card className="p-6 sm:p-8 text-center">
            <div className="text-[3rem] leading-none font-bold text-text-tertiary mb-3">404</div>
            <h1 className="text-heading text-text-primary mb-1">Page not found</h1>
            <p className="text-body text-text-secondary mb-5">The page you're looking for doesn't exist or has been moved.</p>
            <button
              type="button"
              onClick={() => onNav("landing")}
              className={`px-5 py-2.5 text-[13px] font-medium text-text-on-primary bg-primary rounded-sm hover:opacity-90 transition-opacity cursor-pointer ${focusRing}`}
            >
              Back to home
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
