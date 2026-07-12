import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && (
        <div className="w-12 h-12 rounded-md bg-surface-secondary flex items-center justify-center mb-4 text-text-tertiary">
          {icon}
        </div>
      )}
      <div className="text-subheading text-text-primary mb-1">{title}</div>
      {description && <p className="text-body text-text-secondary max-w-[22rem] mb-4">{description}</p>}
      {action}
    </div>
  );
}
