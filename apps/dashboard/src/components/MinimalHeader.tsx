import { ArrowLeft } from "lucide-react";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

export function MinimalHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="border-b border-border bg-surface shrink-0">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between w-full">
        <button onClick={onBack} className={`flex items-center gap-2.5 cursor-pointer ${focusRing}`}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0A9396" }}>
            <span className="text-white font-bold text-[13px] leading-none">S</span>
          </div>
          <span className="font-semibold text-[14px] text-text-primary tracking-tight">SalesBox</span>
        </button>
        <button onClick={onBack} className={`flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer ${focusRing}`}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to home
        </button>
      </div>
    </header>
  );
}
