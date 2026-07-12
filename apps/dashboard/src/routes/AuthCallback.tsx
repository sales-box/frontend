import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Inbox, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { Screen } from "../types";
import { saveSession, isLoggedIn } from "../api-client";
import { Card } from "../components/Card";

export function AuthCallback({ onNav }: { onNav: (s: Screen) => void }) {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const tenantId = params.get("tenantId");
    const status = params.get("status");

    if (token && tenantId) {
      saveSession(token, tenantId);
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
        setMessage("Google account connected! Set your password to continue.");
        setTimeout(() => onNav("set-password"), 2000);
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

  return (
    <div className="min-h-[100dvh] bg-surface-tertiary flex items-center justify-center px-4 py-10 font-body">
      <div className="w-full max-w-[28rem]">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Inbox size={15} strokeWidth={1.5} className="text-text-on-primary" />
          </div>
          <span className="font-body font-semibold text-base text-text-primary">Inbox Sales Copilot</span>
        </div>

        <Card className="p-6 sm:p-8 text-center">
          {state === "loading" && (
            <>
              <Loader2 size={28} strokeWidth={1.5} className="text-accent mx-auto mb-4 animate-spin" />
              <p className="text-body text-text-secondary">Processing authentication…</p>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 size={28} strokeWidth={1.5} className="text-success mx-auto mb-4" />
              <h1 className="text-heading text-text-primary mb-2">Connected</h1>
              <p className="text-body text-text-secondary">{message}</p>
            </>
          )}

          {state === "error" && (
            <>
              <AlertCircle size={28} strokeWidth={1.5} className="text-danger mx-auto mb-4" />
              <h1 className="text-heading text-text-primary mb-2">Authentication Failed</h1>
              <p className="text-body text-text-secondary mb-5">{message}</p>
              <button
                type="button"
                onClick={() => onNav("signin")}
                className="px-5 py-2.5 text-[13px] font-medium text-text-on-primary bg-primary rounded-sm hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                Back to Sign In
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
