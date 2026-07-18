import { ArrowLeft } from "lucide-react";
import mascotIconSilhouette from "../assets/mascot-icon-silhouette.svg";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function MinimalHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="border-b border-border bg-surface shrink-0">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between w-full">
        <button onClick={onBack} className={`flex items-center gap-2.5 ${focusRing}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
            <img src={mascotIconSilhouette} alt="" className="w-4.5 h-4.5 brightness-0 invert" aria-hidden="true" />
          </div>
          <span className="font-display text-[14px] font-semibold text-text-primary">Inbox Sales Copilot</span>
        </button>
        <button onClick={onBack} className={`flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors ${focusRing}`}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to home
        </button>
      </div>
    </header>
  );
}
