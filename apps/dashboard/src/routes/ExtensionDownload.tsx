import { Inbox, Download, ExternalLink } from "lucide-react";
import type { Screen } from "../types";
import { Card } from "../components/Card";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

const INSTALL_STEPS = [
  "Download the extension package below.",
  "Unzip it.",
  <>Open <code className="font-mono text-xs bg-surface-secondary px-1 py-0.5 rounded">chrome://extensions</code> in Chrome.</>,
  'Enable "Developer mode" (top-right toggle).',
  'Click "Load unpacked" and select the unzipped folder.',
];

/**
 * Public page — NO auth required.
 *
 * CRITICAL: This route must be registered at the top level in App.tsx
 * (sibling of /, /signin, /callback) with NO <ProtectedRoute> wrapper.
 * DO NOT move this under /dashboard/* or wrap it in <ProtectedRoute>.
 *
 * Why: Sales Engineers receive an invite email whose link points here.
 * SEs have no dashboard login — bouncing them to /signin is the bug
 * this page exists to fix.
 */
export function ExtensionDownload({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="min-h-[100dvh] bg-surface-tertiary flex items-center justify-center px-4 py-10 font-body">
      <div className="w-full max-w-[30rem]">
        {/* Logo header — same block as NotFound.tsx */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Inbox size={15} strokeWidth={1.5} className="text-text-on-primary" />
          </div>
          <span className="font-body font-semibold text-base text-text-primary">Inbox Sales Copilot</span>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Download size={18} strokeWidth={1.5} className="text-primary" />
            </div>
            <div>
              <h1 className="text-heading text-text-primary leading-tight">
                Install the Inbox Sales Copilot extension
              </h1>
              <p className="text-xs text-text-tertiary mt-0.5">Chrome only · Unpacked install</p>
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            Follow the steps below to install the extension in your Chrome browser.
            This extension is not on the Chrome Web Store — it's installed directly from the package.
          </p>

          <ol className="space-y-3 mb-7">
            {INSTALL_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-text-secondary leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          {/* Download button */}
          <div className="space-y-2">
            {/* TODO: replace with the real download URL once Nagy provides the hosted zip path (devops decision) */}
            <a
              id="ext-download-btn"
              href="#extension-download-placeholder"
              className={`
                w-full flex items-center justify-center gap-2
                px-5 py-2.5 text-[13px] font-medium
                text-text-on-primary bg-primary
                rounded-sm hover:opacity-90 transition-opacity
                cursor-pointer ${focusRing}
              `}
            >
              <Download size={14} strokeWidth={1.5} />
              Download extension package
            </a>

            <p className="text-center text-xs text-text-tertiary">
              Version: dev-preview
              {/* TODO: replace with real version string once build pipeline tags releases */}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-text-tertiary text-center">
              Need help?{" "}
              <button
                type="button"
                onClick={() => onNav("landing")}
                className={`text-secondary hover:text-secondary/80 underline transition-colors ${focusRing}`}
              >
                Visit our site
              </button>
              {" "}or contact your admin.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
