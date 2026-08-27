import { useState } from "react";
import { Database, Link2 } from "lucide-react";
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
  // Prefer the count the server just counted; fall back to the one this session
  // saw when it connected, so the number does not blink on the mutation's race.
  const syncInfo = connected
    ? {
        lastSync: status?.lastSync ?? "just now",
        importedCount: status?.importedCount ?? importedCount ?? 0,
      }
    : null;

  const keyError = !apiKey.trim() ? "API key is required" : "";

  // Connecting HubSpot also writes an agent connection, so `connected` alone
  // lit this card up for a Zoho that was never connected. The provider decides.
  const mcpConnected =
    (mcpStatus?.connected ?? false) && mcpStatus?.provider === "zoho";
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
      // The MutationCache onError in main.tsx already toasts the API's message
      // for every failed mutation. Toasting here as well showed it twice.
    }
  };

  const disconnect = async () => {
    try {
      await disconnectCrm.mutateAsync();
      setImportedCount(null);
      toast("HubSpot disconnected");
    } catch {
      // The MutationCache onError in main.tsx already toasts the API's message
      // for every failed mutation. Toasting here as well showed it twice.
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
      // The MutationCache onError in main.tsx already toasts the API's message
      // for every failed mutation. Toasting here as well showed it twice.
    }
  };

  const disconnectZohoMcp = async () => {
    try {
      await disconnectMcp.mutateAsync();
      toast("Zoho MCP disconnected");
    } catch {
      // The MutationCache onError in main.tsx already toasts the API's message
      // for every failed mutation. Toasting here as well showed it twice.
    }
  };

  return (
    <Shell active="crm" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader title="CRM Connect" subtitle="Connect your CRM to sync contacts and enrich email context." />

        <div className="flex items-start gap-2.5 text-[14px] text-text-secondary bg-surface-secondary rounded-lg px-4 py-3 mb-6">
          <Database size={14} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-text-tertiary" />
          <span><strong className="text-text-primary">CRM integration is optional.</strong> Your product knowledge comes from Knowledge Base uploads. A connected CRM adds client history to replies, and lets the assistant propose records for you to approve. <strong className="text-text-primary">One CRM per workspace</strong> — disconnect before switching.</span>
        </div>

        {/* Provider cards — Figma: 48px icon box, 20px title, status pill/action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* HubSpot */}
          <div className={`bg-surface rounded-2xl p-5 flex flex-col gap-3 ${connected ? "border-2 border-secondary" : "border border-border"}`}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/10">
              <span className="text-secondary font-bold text-lg leading-none">H</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">HubSpot</div>
              <p className="text-[14px] text-text-tertiary mt-1 leading-relaxed">Sync contacts, deals, and company data from HubSpot CRM.</p>
            </div>
            <div className="mt-auto">
              {connected ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center rounded-lg px-4 py-2 text-[14px] font-semibold bg-success-light text-success">Connected</span>
                  <Btn variant="secondary" size="sm" loading={disconnecting} onClick={disconnect}>Disconnect</Btn>
                </div>
              ) : mcpConnected ? (
                <p className="text-[12px] text-text-tertiary">Disconnect Zoho first — one CRM per workspace.</p>
              ) : (
                <Btn variant="primary" size="sm" onClick={() => setShowKeyModal(true)}>
                  <Link2 size={13} strokeWidth={1.5} /> Connect HubSpot
                </Btn>
              )}
            </div>
          </div>

          {/* Zoho (via MCP) */}
          <div className={`bg-surface rounded-2xl p-5 flex flex-col gap-3 ${mcpConnected ? "border-2 border-secondary" : "border border-border"}`}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/10">
              <span className="text-secondary font-bold text-lg leading-none">Z</span>
            </div>
            <div>
              <div className="text-lg font-semibold text-text-primary">Zoho CRM</div>
              <p className="text-[14px] text-text-tertiary mt-1 leading-relaxed">Import leads and contacts from your Zoho workspace (via MCP).</p>
            </div>
            <div className="mt-auto">
              {mcpConnected ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center rounded-lg px-4 py-2 text-[14px] font-semibold bg-success-light text-success">Connected</span>
                  <Btn variant="secondary" size="sm" loading={mcpDisconnecting} onClick={disconnectZohoMcp}>Disconnect</Btn>
                </div>
              ) : connected ? (
                <p className="text-[12px] text-text-tertiary">Disconnect HubSpot first — one CRM per workspace.</p>
              ) : (
                <Btn variant="primary" size="sm" onClick={() => setShowMcpModal(true)}>
                  <Link2 size={13} strokeWidth={1.5} /> Connect Zoho MCP
                </Btn>
              )}
            </div>
          </div>

        </div>

        {/* HubSpot Sync Status — real data, shown when connected */}
        {connected && (
          <Card className="p-5 flex flex-col gap-2.5">
            <h3 className="text-base font-semibold text-text-primary">HubSpot Sync Status</h3>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-text-tertiary">Contacts synced</span>
              <span className="text-[14px] font-semibold text-secondary">{syncInfo?.importedCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-text-tertiary">Last sync</span>
              <span className="text-[14px] font-semibold text-text-primary">{syncInfo?.lastSync ?? "just now"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-text-tertiary">Sync errors</span>
              <span className="text-[14px] font-semibold text-text-tertiary">0</span>
            </div>
          </Card>
        )}
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
