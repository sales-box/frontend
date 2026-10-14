import { type ReactNode } from "react";

export function Marquee({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex gap-16 w-max animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused]">
        {children}
        {children /* duplicated for a seamless loop */}
      </div>
    </div>
  );
}
