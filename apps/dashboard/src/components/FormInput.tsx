import { useId, type ReactNode } from "react";

export function FormInput({
  label, type = "text", placeholder, value, onChange, onBlur, hint, error,
  required, trailing, name, autoComplete,
}: {
  label?: string; type?: string; placeholder?: string;
  value?: string; onChange?: (v: string) => void; onBlur?: () => void;
  hint?: string; error?: string; required?: boolean;
  trailing?: ReactNode; name?: string; autoComplete?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  
  const describedBy = [errId, error ? undefined : hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] font-body font-medium text-text-primary tracking-[0.01em]">
          {label}{required && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={e => onChange?.(e.target.value)}
          onBlur={onBlur}
          className={`w-full px-3.5 py-2.5 text-sm font-body bg-surface text-text-primary rounded-md border shadow-1 focus:outline-none focus:ring-4 placeholder:text-text-tertiary transition-all duration-200 ${trailing ? "pr-10" : ""} ${
            error ? "border-danger focus:border-danger focus:ring-danger/15" : "border-border focus:border-primary focus:ring-primary/15"
          }`}
        />
        {trailing && <div className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error ? (
        <p id={errId} className="text-xs font-body text-danger">{error}</p>
      ) : hint ? (
        <p id={hintId} className="text-xs font-body text-text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}
