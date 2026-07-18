import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function AccordionItem({ question, children }: { question: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-5">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus/40 rounded-sm"
      >
        <span className="text-subheading text-text-primary">{question}</span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          className={`flex-shrink-0 text-text-tertiary transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="text-body text-text-secondary pt-3 pr-8">{children}</p>
        </div>
      </div>
    </div>
  );
}
