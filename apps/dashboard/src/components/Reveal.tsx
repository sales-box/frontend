import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({ children, delay = 0, className = "", variant = "up" }: {
  children: ReactNode; delay?: number; className?: string;
  variant?: "up" | "scale" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hiddenClass = {
    up:    "opacity-0 translate-y-8",
    scale: "opacity-0 scale-95",
    left:  "opacity-0 -translate-x-8",
    right: "opacity-0 translate-x-8",
  }[variant];
  const shownClass = "opacity-100 translate-y-0 translate-x-0 scale-100";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        shown ? shownClass : `${hiddenClass} motion-reduce:translate-y-0 motion-reduce:translate-x-0 motion-reduce:scale-100`
      } ${className}`}
    >
      {children}
    </div>
  );
}
