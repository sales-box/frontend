import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, Users, Link2, BarChart2, LogOut, Menu, X,
  Contact, Activity, Settings as SettingsIcon,
} from "lucide-react";
import type { Screen } from "../types";
import { useAuthStore } from "../store/auth";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS: { id: Screen; icon: ReactNode; label: string }[] = [
  { id: "overview", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: "Overview" },
  { id: "analytics", icon: <BarChart2 size={18} strokeWidth={1.5} />, label: "Analytics" },
  { id: "knowledge-base", icon: <BookOpen size={18} strokeWidth={1.5} />, label: "Knowledge Base" },
  { id: "team", icon: <Users size={18} strokeWidth={1.5} />, label: "Team" },
  { id: "clients", icon: <Contact size={18} strokeWidth={1.5} />, label: "Clients" },
  { id: "activity-feed", icon: <Activity size={18} strokeWidth={1.5} />, label: "Activity Feed" },
  { id: "crm", icon: <Link2 size={18} strokeWidth={1.5} />, label: "CRM Connect" },
  { id: "settings", icon: <SettingsIcon size={18} strokeWidth={1.5} />, label: "Settings" },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return isMobile;
}

export function Shell({ active, onNav, onLogout, children }: {
  active: Screen; onNav: (s: Screen) => void; onLogout?: () => void; children: ReactNode;
}) {
  const user = useAuthStore(s => s.user);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const firstNavRef = useRef<HTMLButtonElement>(null);

  const close = () => { setMobileOpen(false); requestAnimationFrame(() => menuBtnRef.current?.focus()); };
  const go = (s: Screen) => { setMobileOpen(false); onNav(s); };

  useEffect(() => {
    if (!(isMobile && mobileOpen)) return;
    firstNavRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobile, mobileOpen]);

  const drawerHidden = isMobile && !mobileOpen;
  const bgInert = isMobile && mobileOpen;

  return (
    <div className="md:flex h-screen font-body bg-surface-secondary transition-colors duration-200">
      {/* Mobile top bar — Ink Black */}
      <header
        inert={bgInert || undefined}
        className="md:hidden fixed top-0 inset-x-0 h-14 flex items-center gap-3 px-4 z-30"
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        <button
          ref={menuBtnRef}
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu" aria-expanded={mobileOpen}
          className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          style={{ color: "#94D2BD" }}
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0A9396" }}>
            <span className="text-white font-bold text-[14px] leading-none">S</span>
          </div>
          <span className="font-semibold text-[14px] text-white truncate">SalesBox</span>
        </div>
        <ThemeToggle variant="compact" className="ml-auto" />
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={close} aria-hidden />
      )}

      {/* Sidebar — 240px, Ink Black */}
      <aside
        inert={drawerHidden || undefined}
        className={`fixed md:relative inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col w-60 transform transition-transform duration-200 ease-out md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        {/* Logo + company name */}
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0A9396" }}>
            <span className="text-white font-bold text-lg leading-none">S</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[15px] text-white tracking-tight leading-tight truncate">SalesBox</div>
            {user.companyName && (
              <div className="text-[12px] truncate" style={{ color: "rgba(148,210,189,0.75)" }}>{user.companyName}</div>
            )}
          </div>
          <button
            onClick={close}
            aria-label="Close navigation menu"
            className="md:hidden ml-auto cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            style={{ color: "#94D2BD" }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto" aria-label="Primary">
          {NAV_ITEMS.map((item, i) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                ref={i === 0 ? firstNavRef : undefined}
                onClick={() => go(item.id)}
                aria-current={isActive ? "page" : undefined}
                className="sidebar-link w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 mt-auto" style={{ borderTop: "1px solid rgba(148,210,189,0.15)" }}>
          <div className="px-2 mb-2">
            <ThemeToggle variant="standard" />
          </div>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
              style={{ backgroundColor: "rgba(148,210,189,0.2)", color: "#94D2BD" }}
            >
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white truncate">{user.name}</div>
              <div className="text-[12px]" style={{ color: "rgba(148,210,189,0.7)" }}>{user.isAdmin ? "Admin" : "User"}</div>
            </div>
            <button
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="sidebar-logout w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      <main inert={bgInert || undefined} className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
