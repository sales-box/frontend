import { Inbox } from "lucide-react";
import type { Screen } from "../types";
import { Card } from "../components/Card";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function NotFound({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="min-h-[100dvh] bg-surface-tertiary flex items-center justify-center px-4 py-10 font-body">
      <div className="w-full max-w-[28rem]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Inbox size={15} strokeWidth={1.5} className="text-text-on-primary" />
          </div>
          <span className="font-body font-semibold text-base text-text-primary">Inbox Sales Copilot</span>
        </div>

        <Card className="p-6 sm:p-8 text-center">
          <div className="text-[3rem] leading-none font-bold text-text-tertiary mb-3">404</div>
          <h1 className="text-heading text-text-primary mb-1">Page not found</h1>
          <p className="text-body text-text-secondary mb-5">The page you're looking for doesn't exist or has been moved.</p>
          <button
            type="button"
            onClick={() => onNav("overview")}
            className={`px-5 py-2.5 text-[13px] font-medium text-text-on-primary bg-primary rounded-sm hover:opacity-90 transition-opacity cursor-pointer ${focusRing}`}
          >
            Go to Dashboard
          </button>
        </Card>
      </div>
    </div>
  );
}
