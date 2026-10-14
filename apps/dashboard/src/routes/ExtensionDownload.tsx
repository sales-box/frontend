import { Download } from "lucide-react";
import type { Screen } from "../types";
import { AuthLayout } from "../components/AuthLayout";
import { Card } from "../components/Card";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm";

const DOWNLOAD_URL = import.meta.env.VITE_EXTENSION_DOWNLOAD_URL ?? "";
const VERSION = import.meta.env.VITE_EXTENSION_VERSION ?? "";

const INSTALL_STEPS = [
  "Download the extension package below.",
  "Unzip it.",
  <>Open <code className="font-mono text-[12px] bg-surface-secondary px-1.5 py-0.5 rounded">chrome://extensions</code> in Chrome.</>,
  'Enable "Developer mode" (top-right toggle).',
  'Click "Load unpacked" and select the unzipped folder.',
];

export function ExtensionDownload({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <AuthLayout onBack={() => onNav("landing")}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(148, 210, 189, 0.12)" }}
          >
            <Download size={18} strokeWidth={1.5} className="text-secondary" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-text-primary tracking-tight leading-tight">
              Install the Extension
            </h1>
            <p className="text-[12px] text-text-tertiary mt-0.5">Chrome only · Unpacked install</p>
          </div>
        </div>
        <p className="text-[14px] text-text-secondary leading-relaxed">
          Follow the steps below to install the SalesBox extension in your Chrome browser.
        </p>
      </div>

      <Card className="p-5 mb-6">
        <ol className="space-y-3">
          {INSTALL_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="w-6 h-6 rounded-full text-[12px] font-semibold flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(148, 210, 189, 0.15)", color: "var(--color-secondary)" }}
              >
                {i + 1}
              </span>
              <span className="text-[14px] text-text-secondary leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="space-y-2">
        {DOWNLOAD_URL ? (
          <a
            id="ext-download-btn"
            href={DOWNLOAD_URL}
            download
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 text-[14px] font-semibold text-text-on-primary bg-primary rounded-xl hover:bg-primary-hover transition-colors cursor-pointer shadow-1 hover:shadow-2 ${focusRing}`}
          >
            <Download size={15} strokeWidth={1.5} />
            Download extension package
          </a>
        ) : (
          <div
            role="status"
            className="w-full rounded-xl border border-border bg-surface px-5 py-4 text-center"
          >
            <p className="text-[14px] font-medium text-text-primary">
              The download isn&apos;t available yet
            </p>
            <p className="mt-0.5 text-[12px] text-text-tertiary">
              Ask your admin for the extension package.
            </p>
          </div>
        )}

        {VERSION && (
          <p className="text-center text-[12px] text-text-tertiary">Version: {VERSION}</p>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <p className="text-[12px] text-text-tertiary text-center">
          Need help?{" "}
          <button
            type="button"
            onClick={() => onNav("landing")}
            className={`text-secondary hover:underline transition-colors ${focusRing}`}
          >
            Visit our site
          </button>
          {" "}or contact your admin.
        </p>
      </div>
    </AuthLayout>
  );
}
