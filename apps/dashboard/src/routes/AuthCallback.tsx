import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Screen } from "../types";
import { isLoggedIn } from "../api-client";
import { useAuthStore } from "../store/auth";
import { Card } from "../components/Card";
import { Btn } from "../components/Btn";

export function AuthCallback({ onNav }: { onNav: (s: Screen) => void }) {
  const [params] = useSearchParams();
  const login = useAuthStore(s => s.login);
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const tenantId = params.get("tenantId");
    const status = params.get("status");

    if (token && tenantId) {
      login(token, tenantId);
      setState("success");
      setMessage("Signed in successfully. Redirecting…");
      setTimeout(() => onNav("overview"), 1200);
      return;
    }

    if (status === "connected") {
      setState("success");
      if (isLoggedIn()) {
        setMessage("Google account connected successfully. Redirecting…");
        setTimeout(() => onNav("overview"), 1500);
      } else {
        const pendingEmail = sessionStorage.getItem("pendingEmail") ?? "";
        const pendingTid = sessionStorage.getItem("pendingTenantId") ?? "";
        sessionStorage.removeItem("pendingEmail");
        sessionStorage.removeItem("pendingTenantId");
        const q = new URLSearchParams();
        if (pendingEmail) q.set("email", pendingEmail);
        if (pendingTid) q.set("tenantId", pendingTid);
        setMessage("Google account connected! Set your password to continue.");
        setTimeout(() => {
          window.location.replace(`/set-password${q.toString() ? `?${q}` : ""}`);
        }, 2000);
      }
      return;
    }

    setState("error");
    setMessage(
      status === "error"
        ? "Google authentication failed. Please try again."
        : "Invalid callback. Please sign in again."
    );
  }, [params, onNav]);

  const iconWrap = "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5";

  return (
    <div className="min-h-[100dvh] bg-surface-secondary flex items-center justify-center px-5 py-10 font-body">
      <div className="w-full max-w-[26rem]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#0A9396" }}>
            <span className="text-white font-bold text-[15px] leading-none">S</span>
          </div>
          <span className="font-semibold text-[16px] text-text-primary tracking-tight">SalesBox</span>
        </div>

        <Card className="p-8 text-center">
          {state === "loading" && (
            <>
              <div className={iconWrap} style={{ backgroundColor: "rgba(148, 210, 189, 0.12)" }}>
                <Loader2 size={28} strokeWidth={1.5} className="text-secondary animate-spin" />
              </div>
              <h1 className="text-[22px] font-bold text-text-primary mb-2">Processing</h1>
              <p className="text-[15px] text-text-secondary">Verifying your authentication…</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className={iconWrap} style={{ backgroundColor: "rgba(10, 147, 150, 0.12)" }}>
                <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" />
              </div>
              <h1 className="text-[22px] font-bold text-text-primary mb-2">Connected</h1>
              <p className="text-[15px] text-text-secondary">{message}</p>
            </>
          )}

          {state === "error" && (
            <>
              <div className={iconWrap} style={{ backgroundColor: "rgba(174, 32, 18, 0.1)" }}>
                <AlertCircle size={28} strokeWidth={1.5} className="text-danger" />
              </div>
              <h1 className="text-[22px] font-bold text-text-primary mb-2">Authentication Failed</h1>
              <p className="text-[15px] text-text-secondary mb-6">{message}</p>
              <Btn variant="primary" onClick={() => onNav("signin")} className="w-full">
                Back to Sign In
              </Btn>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
