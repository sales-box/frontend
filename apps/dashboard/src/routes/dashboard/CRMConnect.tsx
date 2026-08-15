import { useState } from "react";
import { Database, Link2, RefreshCw, CheckCircle2 } from "lucide-react";
import type { Screen } from "../../types";
import {
  useCrmStatus,
  useConnectCrm,
  useDisconnectCrm,
  useMcpStatus,
  useConnectZohoMcp,
  useDisconnectZohoMcp,
} from "../../hooks/queries";
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
  // HubSpot modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // Zoho MCP modal state
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpUrlTouched, setMcpUrlTouched] = useState(false);

  const { data: status } = useCrmStatus();
  const connectCrm = useConnectCrm();
  const disconnectCrm = useDisconnectCrm();

  const { data: mcpStatus } = useMcpStatus();
  const connectMcp = useConnectZohoMcp();
  const disconnectMcp = useDisconnectZohoMcp();

  const connected = status?.connected ?? false;
  const connecting = connectCrm.isPending;
  const disconnecting = disconnectCrm.isPending;
  const syncInfo = connected
    ? { lastSync: status?.lastSync ?? "just now", importedCount: importedCount ?? 0 }
    : null;

  const keyError = !apiKey.trim() ? "API key is required" : "";

  const mcpConnected = mcpStatus?.connected ?? false;
  const mcpConnecting = connectMcp.isPending;
  const mcpDisconnecting = disconnectMcp.isPending;
  const mcpUrlError = !mcpUrl.trim()
    ? "MCP Server URL is required"
    : !mcpUrl.startsWith("http://") && !mcpUrl.startsWith("https://")
    ? "Must be a valid URL (http:// or https://)"
    : "";

  const submitConnect = async () => {
    setKeyTouched(true);
    if (keyError || connecting) return;
    try {
      const res = await connectCrm.mutateAsync({ provider: "hubspot", apiKey });
      setImportedCount(res.importedCount);
      toast("HubSpot connected");
      setShowKeyModal(false);
      setApiKey("");
      setKeyTouched(false);
    } catch {
      toast("Failed to connect to HubSpot");
    }
  };

  const disconnect = async () => {
    try {
      await disconnectCrm.mutateAsync();
      setImportedCount(null);
      toast("HubSpot disconnected");
    } catch {
      toast("Failed to disconnect HubSpot");
    }
  };

  const submitConnectMcp = async () => {
    setMcpUrlTouched(true);
    if (mcpUrlError || mcpConnecting) return;
    try {
      await connectMcp.mutateAsync(mcpUrl.trim());
      toast("Zoho MCP connected successfully");
      setShowMcpModal(false);
      setMcpUrl("");
      setMcpUrlTouched(false);
    } catch {
      toast("Failed to connect Zoho MCP");
    }
  };

  const disconnectZohoMcp = async () => {
    try {
      await disconnectMcp.mutateAsync();
      toast("Zoho MCP disconnected");
    } catch {
      toast("Failed to disconnect Zoho MCP");
    }
  };

  return (
    <Shell active="crm" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader title="CRM Connect" subtitle="Optionally sync your CRM for richer client history context." />

        <div className="flex items-start gap-2.5 text-[13px] text-text-secondary bg-surface-secondary rounded-lg px-4 py-3 mb-6">
          <Database size={14} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-text-tertiary" />
          <span><strong className="text-text-primary">CRM integration is optional.</strong> Your product knowledge comes from Knowledge Base uploads. CRM data enriches replies with client history and deal context.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* HubSpot Card */}
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
                <Btn variant="secondary" size="sm" loading={disconnecting} onClick={disconnect}>Disconnect</Btn>
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

          {/* Zoho MCP Card */}
          <Card className={`p-6 ${mcpConnected ? "ring-1 ring-success" : ""}`}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-secondary border border-border flex items-center justify-center">
                  <span className="text-accent-cool font-bold text-[13px] font-mono">Zo</span>
                </div>
                <div><div className="text-sm font-semibold text-text-primary">Zoho (via MCP)</div><div className="text-xs text-text-tertiary">CRM Agent</div></div>
              </div>
              {mcpConnected ? <Badge variant="success"><CheckCircle2 size={11} strokeWidth={1.5} /> Connected</Badge> : <Badge variant="muted">Not connected</Badge>}
            </div>

            {mcpConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[13px] text-success"><CheckCircle2 size={13} strokeWidth={1.5} /> Connected to Zoho MCP</div>
                <Btn variant="secondary" size="sm" loading={mcpDisconnecting} onClick={disconnectZohoMcp}>Disconnect</Btn>
              </div>
            ) : (
              <div>
                <p className="text-xs text-text-tertiary mb-4 leading-relaxed">Connect your presigned Zoho MCP Server URL to enable multi-action CRM workflows.</p>
                <Btn variant="primary" size="sm" onClick={() => setShowMcpModal(true)}>
                  <Link2 size={13} strokeWidth={1.5} /> Connect Zoho MCP
                </Btn>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* HubSpot Modal */}
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

      {/* Zoho MCP Modal */}
      <Modal
        open={showMcpModal}
        onClose={() => { setShowMcpModal(false); setMcpUrl(""); setMcpUrlTouched(false); }}
        title="Connect Zoho MCP"
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => { setShowMcpModal(false); setMcpUrl(""); setMcpUrlTouched(false); }}>Cancel</Btn>
            <Btn variant="primary" size="sm" loading={mcpConnecting} onClick={submitConnectMcp}>
              {mcpConnecting ? "Connecting…" : "Connect"}
            </Btn>
          </>
        }
      >
        <FormInput
          label="Zoho MCP Server Presigned URL" type="url" placeholder="https://crm-data-metadata-....zohomcp.com/mcp/..." required
          value={mcpUrl} onChange={setMcpUrl}
          onBlur={() => setMcpUrlTouched(true)}
          error={mcpUrlTouched ? mcpUrlError : undefined}
          hint="Paste the presigned URL provided by your Zoho MCP service."
          autoComplete="off"
        />
      </Modal>
    </Shell>
  );
}
