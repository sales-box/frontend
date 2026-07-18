import { type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import mascotIconSilhouette from "../assets/mascot-icon-silhouette.svg"

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm"

export interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

export function LegalLayout({
  pageTitle,
  lastUpdated,
  sections,
}: {
  pageTitle: string
  lastUpdated: string
  sections: LegalSection[]
}) {
  return (
    <div className="min-h-[100dvh] bg-surface font-body text-text-primary">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className={`flex items-center gap-2.5 ${focusRing}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <img src={mascotIconSilhouette} alt="" className="w-4.5 h-4.5 brightness-0 invert" aria-hidden="true" />
            </div>
            <span className="font-display text-[14px] font-semibold text-text-primary">Inbox Sales Copilot</span>
          </Link>
          <Link to="/" className={`flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors ${focusRing}`}>
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to home
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 md:py-20 grid md:grid-cols-[220px_1fr] gap-12">
        <aside className="hidden md:block">
          <nav className="sticky top-20 flex flex-col gap-1 text-[13px]">
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`px-3 py-1.5 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors ${focusRing}`}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <main className="max-w-[42rem]">
          <h1 className="font-display text-[2.25rem] sm:text-[2.75rem] leading-tight tracking-[-0.015em] text-text-primary mb-2">
            {pageTitle}
          </h1>
          <p className="text-caption text-text-tertiary mb-12">Last updated: {lastUpdated}</p>

          <div className="flex flex-col gap-12">
            {sections.map(s => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-heading text-text-primary mb-3">{s.title}</h2>
                <div className="text-body text-text-secondary flex flex-col gap-3">{s.body}</div>
              </section>
            ))}
          </div>
        </main>
      </div>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs text-text-tertiary">© 2026 Inbox Sales Copilot, Inc.</span>
          <div className="flex flex-wrap gap-5 text-xs text-text-tertiary">
            <Link to="/privacy" className={`hover:text-text-primary transition-colors ${focusRing}`}>Privacy</Link>
            <Link to="/terms" className={`hover:text-text-primary transition-colors ${focusRing}`}>Terms</Link>
            <Link to="/security" className={`hover:text-text-primary transition-colors ${focusRing}`}>Security</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
