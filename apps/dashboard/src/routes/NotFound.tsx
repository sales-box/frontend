import type { Screen } from "../types";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";

export function NotFound({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="min-h-[100dvh] bg-surface-secondary font-body flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[26rem]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#0A9396" }}>
            <span className="text-white font-bold text-[15px] leading-none">S</span>
          </div>
          <span className="font-semibold text-[16px] text-text-primary tracking-tight">SalesBox</span>
        </div>

        <Card className="p-8 text-center">
          <div className="text-[56px] leading-none font-bold text-text-tertiary/40 mb-4">404</div>
          <h1 className="text-[22px] font-bold text-text-primary mb-2">Page not found</h1>
          <p className="text-[15px] text-text-secondary mb-6">The page you're looking for doesn't exist or has been moved.</p>
          <Btn variant="primary" onClick={() => onNav("landing")} className="w-full">
            Back to home
          </Btn>
        </Card>
      </div>
    </div>
  );
}
