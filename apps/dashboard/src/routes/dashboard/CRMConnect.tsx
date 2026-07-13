import { useState, useEffect } from "react";
import { Database, Link2, RefreshCw, CheckCircle2 } from "lucide-react";
import type { Screen } from "../../types";
import { crm } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Btn } from "../../components/Btn";
import { FormInput } from "../../components/FormInput";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/Toast";

export function CRMConnect({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncInfo, setSyncInfo] = useState<{ lastSync: string; importedCount: number } | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);

  useEffect(() => {
    crm.status()
      .then(res => {
        setConnected(res.connected);
        setSyncInfo({ lastSync: res.lastSync ?? "just now", importedCount: 0 });
      })
      .catch(() => {});
  }, []);

  const keyError = !apiKey.trim() ? "API key is required" : "";

  const submitConnect = () => {
    setKeyTouched(true);
    if (keyError || connecting) return;
    setConnecting(true);
    crm.connect("hubspot", apiKey)
      .then(res => {
        setConnected(true);
        setSyncInfo({ lastSync: "just now", importedCount: res.importedCount });
        toast("HubSpot connected");
        setShowKeyModal(false);
        setApiKey("");
        setKeyTouched(false);
      })
      .catch(() => {
        toast("Failed to connect to HubSpot");
      })
      .finally(() => setConnecting(false));
  };
  const disconnect = () => { setConnected(false); setSyncInfo(null); toast("HubSpot disconnected"); };

  return (
    <Shell active="crm" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader title="CRM Connect" subtitle="Optionally sync your CRM for richer client history context." />

        <div className="flex items-start gap-2.5 text-[13px] text-text-secondary bg-surface-secondary rounded-lg px-4 py-3 mb-6">
          <Database size={14} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-text-tertiary" />
          <span><strong className="text-text-primary">CRM integration is optional.</strong> Your product knowledge comes from Knowledge Base uploads. CRM data enriches replies with client history and deal context.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className={`p-6 ${connected ? "ring-1 ring-success" : ""}`}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-secondary border border-border flex items-center justify-center">
                  <span className="text-danger font-bold text-[13px] font-mono">Hs</span>
                </div>
                <div><div className="text-sm font-semibold text-text-primary">HubSpot</div><div className="text-xs text-text-tertiary">CRM</div></div>
              </div>
              {connected ? <Badge variant="success"><CheckCircle2 size={11} strokeWidth={1.5} /> Connected</Badge> : <Badge variant="muted">Not connected</Badge>}
            </div>

            {connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[13px] text-success"><CheckCircle2 size={13} strokeWidth={1.5} /> Connected to HubSpot</div>
                {syncInfo ? (
                  <>
                    <div className="text-xs text-text-tertiary flex items-center gap-1.5"><RefreshCw size={11} strokeWidth={1.5} /> Last synced: {syncInfo.lastSync}</div>
                    <div className="text-xs text-text-tertiary">{syncInfo.importedCount} records imported</div>
                  </>
                ) : (
                  <div className="text-xs text-text-tertiary">Not yet synced</div>
                )}
                <Btn variant="secondary" size="sm" onClick={disconnect}>Disconnect</Btn>
              </div>
            ) : (
              <div>
                <p className="text-xs text-text-tertiary mb-4 leading-relaxed">Read-only sync of contacts, deal history, and company info. No data is written back to HubSpot.</p>
                <Btn variant="primary" size="sm" onClick={() => setShowKeyModal(true)}>
                  <Link2 size={13} strokeWidth={1.5} /> Connect HubSpot
                </Btn>
              </div>
            )}
          </Card>

          {/* Salesforce — legible even though disabled: muted CTA, not a dimmed card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-secondary border border-border flex items-center justify-center">
                  <span className="text-accent-cool font-bold text-[13px] font-mono">SF</span>
                </div>
                <div><div className="text-sm font-semibold text-text-primary">Salesforce</div><div className="text-xs text-text-tertiary">CRM</div></div>
              </div>
              <Badge variant="muted">Coming soon</Badge>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed mb-4">Salesforce integration available Q4 2026.</p>
            <Btn variant="secondary" size="sm" disabled aria-label="Connect Salesforce — coming soon">Connect Salesforce</Btn>
          </Card>
        </div>
      </div>

      <Modal
        open={showKeyModal}
        onClose={() => { setShowKeyModal(false); setApiKey(""); setKeyTouched(false); }}
        title="Connect HubSpot"
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => { setShowKeyModal(false); setApiKey(""); setKeyTouched(false); }}>Cancel</Btn>
            <Btn variant="primary" size="sm" loading={connecting} onClick={submitConnect}>
              {connecting ? "Connecting…" : "Connect"}
            </Btn>
          </>
        }
      >
        <FormInput
          label="HubSpot API key" type="password" placeholder="pat-na1-..." required
          value={apiKey} onChange={setApiKey}
          onBlur={() => setKeyTouched(true)}
          error={keyTouched ? keyError : undefined}
          hint="Find your key in HubSpot → Settings → Integrations → Private Apps."
          autoComplete="off"
        />
      </Modal>
    </Shell>
  );
}
