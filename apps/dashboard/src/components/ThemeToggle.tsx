import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../store/theme";

interface ThemeToggleProps {
  variant?: "standard" | "compact";
  className?: string;
}

export function ThemeToggle({ variant = "standard", className = "" }: ThemeToggleProps) {
  const { dark, toggleDark } = useThemeStore();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleDark();
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={toggleDark}
        onKeyDown={handleKeyDown}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        aria-checked={dark}
        role="switch"
        className={`w-9 h-9 flex items-center justify-center bg-surface-secondary border border-border/80 text-text-secondary rounded-xl cursor-pointer hover:bg-surface-tertiary hover:text-text-primary transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 shadow-sm ${className}`}
      >
        <span className={`transition-transform duration-500 ease-out flex items-center justify-center ${dark ? "rotate-[360deg] scale-100" : "rotate-0 scale-100"}`}>
          {dark ? (
            <Moon size={16} strokeWidth={1.5} className="text-primary" />
          ) : (
            <Sun size={16} strokeWidth={1.5} className="text-accent-warm" />
          )}
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={toggleDark}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="switch"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-checked={dark}
      className={`relative w-[60px] h-8 bg-surface-tertiary border border-border/60 rounded-full p-1 cursor-pointer flex items-center justify-between select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-theme hover:border-border-focus/40 ${className}`}
    >
      {/* Background track icons */}
      <span className="w-5 h-5 flex items-center justify-center text-text-tertiary pl-0.5">
        <Sun size={12} strokeWidth={2} />
      </span>
      <span className="w-5 h-5 flex items-center justify-center text-text-tertiary pr-0.5">
        <Moon size={12} strokeWidth={2} />
      </span>

      {/* Sliding knob */}
      <div
        className="absolute top-[3px] left-[3px] w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md transition-transform duration-300 ease-out"
        style={{
          transform: dark ? "translateX(28px)" : "translateX(0px)",
        }}
      >
        <span className={`transition-transform duration-500 ease-out flex items-center justify-center ${dark ? "rotate-[360deg] scale-100" : "rotate-0 scale-100"}`}>
          {dark ? (
            <Moon size={13} strokeWidth={2} className="text-text-on-primary" />
          ) : (
            <Sun size={13} strokeWidth={2} className="text-text-on-primary" />
          )}
        </span>
      </div>
    </div>
  );
}
