import { Activity } from "lucide-react";
import { useState, useEffect } from "react";
import type { Screen } from "../../types";
import { analytics } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";


export interface ActivityRow {
  id: string;
  time: string;
  client: string;
  company: string;
  classification: string | null;
  confidence: number | null; 
  action: string | null;
}

function confidenceColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}

function actionColor(action: string | null) {
  if (action === "Sent as-is") return "text-success";
  if (action === "Escalated") return "text-danger";
  return "text-warning";
}

const COLS = "grid grid-cols-[80px_1fr_1fr_140px_100px_100px] gap-3";

export function ActivityFeed({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<ActivityRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    analytics.getActivity(1, 50)
      .then((result) => {
        if (cancelled) return;
        setRows(result.data as ActivityRow[]);
      })
      .catch(() => {
        if (!cancelled) toast("Failed to load activity feed");
      });
    return () => { cancelled = true; };
  }, []);



  return (
    <Shell active="activity-feed" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[72rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader
          title="Activity Feed"
          subtitle="All emails processed today across your Sales Engineers."
        />

        <Reveal>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
              <Activity size={18} strokeWidth={1.5} className="text-primary" />
            </div>
            <h2 className="text-subheading text-text-primary">Today's Activity</h2>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Emails processed by your Sales Engineers will appear here as they come in."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className={`${COLS} px-5 py-2.5 border-y border-border bg-surface-secondary/50 text-eyebrow min-w-[46rem]`}>
                <span>Time</span>
                <span>Client</span>
                <span>Company</span>
                <span>Classification</span>
                <span>Confidence</span>
                <span>Action</span>
              </div>
              <div className="divide-y divide-border min-w-[46rem]">
                {rows.map((row, i) => {
                  const conf = row.confidence != null ? Math.round(row.confidence * 100) : null;
                  return (
                    <div
                      key={row.id}
                      onClick={() => onNav("clients")}
                      className={`${COLS} px-5 py-3.5 items-center hover:bg-surface-secondary/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}
                    >
                      <span className="text-xs text-text-tertiary font-mono">{row.time}</span>
                      <span className="text-[13px] font-medium text-text-primary truncate">{row.client}</span>
                      <span className="text-[13px] text-text-secondary truncate">{row.company}</span>
                      <span>{row.classification && <Badge variant="muted">{row.classification}</Badge>}</span>
                      <span className={`text-[13px] font-mono font-semibold ${conf != null ? confidenceColor(conf) : "text-text-tertiary"}`}>
                        {conf != null ? `${conf}%` : "—"}
                      </span>
                      <span className={`text-xs font-medium ${actionColor(row.action)}`}>{row.action ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
        </Reveal>
      </div>
    </Shell>
  );
}
