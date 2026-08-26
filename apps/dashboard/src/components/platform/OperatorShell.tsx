import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, LogOut, ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlatformAuthStore } from "../../store/platformAuth";
import { Btn } from "../Btn";
import { ThemeToggle } from "../ThemeToggle";
import mascotIconSilhouette from "../../assets/mascot-icon-silhouette.svg";

/**
 * Page frame for the operator console.
 *
 * Deliberately its own chrome rather than the tenant `Shell`: this is a
 * different identity (platformJwt), a different audience, and destructive
 * actions live here. The INTERNAL flag is always visible so nobody mistakes
 * it for a customer-facing screen — but every colour, font, and control comes
 * from the product design system, so it still reads as Salesbox.
 */
export function OperatorShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const logout = usePlatformAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  const onTenants =
    pathname === "/admin" || pathname.startsWith("/admin/tenants");

  return (
    <div className="min-h-dvh bg-surface-secondary text-text-primary font-body">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <img
          src={mascotIconSilhouette}
          alt=""
          aria-hidden="true"
          className="h-7 w-7"
        />
        <span className="font-display text-lg font-semibold tracking-tight">
          Salesbox
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-danger-light px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-danger">
          <ShieldAlert size={12} strokeWidth={2} />
          Internal
        </span>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              // The QueryClient is shared app-wide and staleTime is 30s, so
              // without this the next operator to sign in on this tab is served
              // the previous operator's cached tenant data.
              queryClient.clear();
              navigate("/admin/login");
            }}
          >
            <LogOut size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Sign out</span>
          </Btn>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-6">
        <nav
          aria-label="Operator sections"
          className="hidden w-52 shrink-0 md:block"
        >
          <Link
            to="/admin"
            aria-current={onTenants ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
              onTenants
                ? "border-border bg-surface text-text-primary shadow-1"
                : "border-transparent text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <Building2 size={16} strokeWidth={1.5} className="text-primary" />
            Tenants
          </Link>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
