import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Building2, Clock, Gauge } from "lucide-react";
import { useParams } from "react-router-dom";
import type { Screen } from "../../types";
import { clients, type Client, type Interaction } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

function confidenceColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

export function ClientRecord({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError("No client ID"); setLoading(false); return; }
    clients.get(id)
      .then(res => {
        const { interactions: ix, ...c } = res ?? {};
        setClient(c as Client);
        setInteractions(ix ?? []);
      })
      .catch(err => setError(err.message || "Failed to load client"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Shell active="clients" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <div className="mb-6">
          <button
            onClick={() => onNav("clients")}
            className={`flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer ${focusRing}`}
          >
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to Clients
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-text-tertiary">Loading client…</div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-danger">{error}</div>
        ) : client ? (
          <>
            <PageHeader title={client.name} subtitle={client.email} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              {/* Contact info sidebar */}
              <Reveal>
              <Card className="p-5">
                <h2 className="text-subheading text-text-primary mb-4">Contact Info</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={14} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
                    <span className="text-[13px] text-text-primary truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 size={14} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
                    <span className="text-[13px] text-text-primary">{client.company}</span>
                  </div>
                  {client.updatedAt && (
                    <div className="flex items-center gap-3">
                      <Clock size={14} strokeWidth={1.5} className="text-text-tertiary shrink-0" />
                      <span className="text-[13px] text-text-primary">Updated {new Date(client.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border mt-4 pt-4">
                  <Badge variant={client.status === "Active" ? "success" : client.status === "At risk" ? "danger" : "muted"}>
                    {client.status}
                  </Badge>
                </div>
              </Card>
              </Reveal>

              {/* AI summary */}
              <Reveal delay={70} className="lg:col-span-2">
              <Card className="p-5">
                <h2 className="text-subheading text-text-primary mb-3">AI Summary</h2>
                {interactions.length > 0 && interactions[0].aiSummary ? (
                  <p className="text-[13px] text-text-secondary leading-relaxed">{interactions[0].aiSummary}</p>
                ) : (
                  <p className="text-[13px] text-text-tertiary italic">No AI summary available yet. Summary will be generated after more interactions.</p>
                )}
              </Card>
              </Reveal>
            </div>

            {/* Interaction timeline */}
            <Reveal>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
                  <Clock size={18} strokeWidth={1.5} className="text-primary" />
                </div>
                <h2 className="text-subheading text-text-primary">Interaction History</h2>
                <span className="ml-auto text-xs text-text-tertiary">{interactions.length} interactions</span>
              </div>

              {interactions.length === 0 ? (
                <EmptyState
                  icon={<Mail size={20} strokeWidth={1.5} />}
                  title="No interactions yet"
                  description="Email interactions with this client will appear here."
                />
              ) : (
                <div className="divide-y divide-border">
                  {interactions.map((ix, i) => (
                    <div key={ix.id} className={`px-5 py-4 hover:bg-surface-secondary/30 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="text-[13px] font-medium text-text-primary">{ix.subject}</div>
                        <span className="text-xs text-text-tertiary font-mono whitespace-nowrap shrink-0">{ix.date}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {ix.classification && <Badge variant="muted">{ix.classification}</Badge>}
                        {ix.productConfidence != null && (
                          <div className="flex items-center gap-1.5">
                            <Gauge size={12} strokeWidth={1.5} className={confidenceColor(ix.productConfidence)} />
                            <span className={`text-xs font-medium ${confidenceColor(ix.productConfidence)}`}>{ix.productConfidence}%</span>
                          </div>
                        )}
                        {ix.recommendation && <span className="text-xs text-text-tertiary">{ix.recommendation}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            </Reveal>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
