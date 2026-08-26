import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { platformApi } from "../../platform-client";
import { PlatformApiError } from "../../lib/platformError";
import { friendlyError } from "../../lib/platformFormat";
import { usePlatformAuthStore } from "../../store/platformAuth";
import { Btn } from "../../components/Btn";
import { FormInput } from "../../components/FormInput";
import { ThemeToggle } from "../../components/ThemeToggle";
import mascotIconSilhouette from "../../assets/mascot-icon-silhouette.svg";

export function PlatformLogin() {
  const navigate = useNavigate();
  const login = usePlatformAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { token } = await platformApi.login(email.trim(), password);
      login(token);
      navigate("/admin");
    } catch (err) {
      // Only a 401 actually means "wrong credentials". Reporting a dead
      // server or a network outage as a bad password sends the operator
      // hunting for a problem that isn't there.
      setError(
        err instanceof PlatformApiError && err.status === 401
          ? "That email and password don't match an operator account."
          : friendlyError(err),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-dvh bg-surface-secondary font-body text-text-primary">
      {/* Brand wash — the same cool gradient used on the marketing surfaces. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.07]"
        style={{ background: "var(--gradient-brand-cool)" }}
      />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle variant="compact" />
      </div>

      <div className="relative flex min-h-dvh items-center justify-center p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-[26rem] rounded-xl border border-border bg-surface p-7 shadow-card"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src={mascotIconSilhouette}
              alt=""
              aria-hidden="true"
              className="mb-3 h-11 w-11"
            />
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Operator console
            </h1>
            <p className="text-body mt-1 text-text-secondary">
              Salesbox platform administration
            </p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-danger-light px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-danger">
              <ShieldAlert size={12} strokeWidth={2} />
              Internal access only
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <FormInput
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={setEmail}
              placeholder="operator@salesbox.com"
            />
            <FormInput
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={setPassword}
            />

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-light px-3 py-2.5 text-[13px] text-danger"
              >
                <AlertCircle
                  size={15}
                  strokeWidth={1.5}
                  className="mt-0.5 flex-shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            <Btn type="submit" loading={busy} className="w-full" size="lg">
              {busy ? "Signing in…" : "Sign in"}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}
