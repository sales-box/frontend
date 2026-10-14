import type { ReactNode } from "react";
import mascotEmpty from "../assets/mascot-empty.png";

export function EmptyState({ title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <img
        src={mascotEmpty}
        alt=""
        className="w-28 h-28 mb-5 object-contain"
        aria-hidden="true"
      />
      <div className="text-subheading text-text-primary mb-1">{title}</div>
      {description && <p className="text-body text-text-secondary max-w-[22rem] mb-4">{description}</p>}
      {action}
    </div>
  );
}

