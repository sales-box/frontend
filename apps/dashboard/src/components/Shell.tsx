import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, Users, Link2, BarChart2, LogOut, Menu, X,
  ChevronLeft, ChevronRight, Contact, Activity, Settings as SettingsIcon,
} from "lucide-react";
import type { Screen } from "../types";
import { useAuthStore } from "../store/auth";
import mascotIconSilhouette from "../assets/mascot-icon-silhouette.svg";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS: { id: Screen; icon: ReactNode; label: string }[] = [
  { id: "overview", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: "Overview" },
  { id: "activity-feed", icon: <Activity size={18} strokeWidth={1.5} />, label: "Activity Feed" },
  { id: "clients", icon: <Contact size={18} strokeWidth={1.5} />, label: "Clients" },
  { id: "knowledge-base", icon: <BookOpen size={18} strokeWidth={1.5} />, label: "Knowledge Base" },
  { id: "team", icon: <Users size={18} strokeWidth={1.5} />, label: "Team" },
  { id: "crm", icon: <Link2 size={18} strokeWidth={1.5} />, label: "CRM Connect" },
  { id: "analytics", icon: <BarChart2 size={18} strokeWidth={1.5} />, label: "Analytics" },
  { id: "settings", icon: <SettingsIcon size={18} strokeWidth={1.5} />, label: "Settings" },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";
const TINT = { background: "color-mix(in srgb, var(--color-primary) 9%, var(--color-surface))" };

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
  const [collapsed, setCollapsed] = useState(false);
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
  const hideLabel = collapsed ? "md:hidden" : "";

  return (
    <div className="md:flex h-screen bg-surface-tertiary font-body transition-colors duration-200">
      {/* Mobile top bar */}
      <header inert={bgInert || undefined} style={TINT} className="md:hidden fixed top-0 inset-x-0 h-14 border-b border-border/60 flex items-center gap-3 px-4 z-30 transition-colors duration-200">
        <button
          ref={menuBtnRef}
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu" aria-expanded={mobileOpen}
          className={`w-9 h-9 -ml-1.5 flex items-center justify-center rounded-sm text-text-secondary hover:bg-primary/10 cursor-pointer ${focusRing}`}
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-6">
            <img src={mascotIconSilhouette} alt="" className="w-[18px] h-[18px] brightness-0 invert" aria-hidden="true" />
          </div>
          <span className="font-display font-semibold text-sm text-text-primary">Inbox Copilot</span>
        </div>
        <ThemeToggle variant="compact" className="ml-auto" />
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" style={{ backgroundColor: "var(--color-overlay)" }} onClick={close} aria-hidden />
      )}

      {/* Sidebar — collapsible, strongly rounded right edge, blue-tinted */}
      <aside
        inert={drawerHidden || undefined}
        style={TINT}
        className={`fixed md:relative inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col rounded-r-[28px] w-64 ${collapsed ? "md:w-[76px]" : "md:w-64"} transform transition-[width,transform,background-color] duration-200 ease-out md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Edge toggle — always visible on desktop, opens AND closes */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden md:flex absolute top-5 -right-3 w-6 h-6 items-center justify-center rounded-full bg-surface border border-border text-text-secondary hover:text-primary hover:border-primary transition-all duration-200 cursor-pointer z-20 shadow-sm ${focusRing}`}
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={2} /> : <ChevronLeft size={14} strokeWidth={2} />}
        </button>

        {/* Header */}
        <div className={`px-4 py-4 flex items-center gap-2.5 ${collapsed ? "md:justify-center md:px-3" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-6">
            <img src={mascotIconSilhouette} alt="" className="w-5 h-5 brightness-0 invert" aria-hidden="true" />
          </div>
          <div className={`min-w-0 flex-1 ${hideLabel}`}>
            <div className="font-display font-semibold text-sm text-text-primary truncate">Inbox Copilot</div>
            {user.companyName && <div className="text-xs text-text-tertiary truncate">{user.companyName}</div>}
          </div>
          <button onClick={close} aria-label="Close navigation menu" className={`md:hidden text-text-tertiary hover:text-text-primary cursor-pointer rounded-sm ${focusRing}`}>
            <X size={17} strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Primary">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              ref={i === 0 ? firstNavRef : undefined}
              onClick={() => go(item.id)}
              aria-current={active === item.id ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ease-out cursor-pointer ${focusRing} ${collapsed ? "md:justify-center md:px-0" : ""} ${
                active === item.id
                  ? "bg-primary/10 text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:bg-primary/5 hover:text-text-primary"
              }`}
            >
              {/* Left Accent indicator bar */}
              <span
                className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-primary transition-all duration-200 ease-out origin-left ${
                  active === item.id ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 group-hover:scale-y-50 group-hover:opacity-40"
                }`}
              />
              <span className={`flex-shrink-0 transition-transform duration-200 ${active === item.id ? "scale-110 text-primary" : "group-hover:scale-105 text-text-secondary group-hover:text-text-primary"}`}>
                {item.icon}
              </span>
              <span className={hideLabel}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Area with Theme Toggle and Profile */}
        <div className="px-3 py-3 border-t border-border/40 mt-auto flex flex-col gap-2 transition-colors duration-200">
          {/* Theme Toggle row */}
          <div className={`flex items-center justify-between px-2 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
            <span className={`text-[10px] font-semibold text-text-tertiary tracking-wider uppercase ${hideLabel}`}>
              Appearance
            </span>
            <ThemeToggle variant={collapsed ? "compact" : "standard"} />
          </div>
          
          {/* Divider line, only visible when not collapsed */}
          {!collapsed && <div className="border-t border-border/40 my-1 mx-2" />}

          {/* Profile Details */}
          <div className={`flex items-center gap-2.5 px-2 py-1.5 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
              {user.initials}
            </div>
            <div className={`flex-1 min-w-0 ${hideLabel}`}>
              <div className="text-xs font-medium text-text-primary truncate">{user.name}</div>
              <div className="text-xs text-text-tertiary">{user.isAdmin ? "Admin" : "User"}</div>
            </div>
            <button
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger-light transition-all duration-200 cursor-pointer ${collapsed ? "md:hidden" : ""} ${focusRing}`}
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
