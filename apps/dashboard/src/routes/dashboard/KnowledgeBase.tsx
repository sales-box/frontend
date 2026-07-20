import { useState } from "react";
import { Upload, FileText, Trash2, CheckCircle2, AlertTriangle, Clock, Search, BookOpen, Zap, FileWarning } from "lucide-react";
import type { Screen } from "../../types";
import { useDocuments, useUploadDocument, useDeleteDocument } from "../../hooks/queries";
import type { QualityReport } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Btn } from "../../components/Btn";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";

type Doc = { id?: string; filename: string; size: string; status: string; uploadDate: string; chunkCount: number | null; fileType?: string; isLowConfidence?: boolean; qualityReason?: string | null; processingError?: string | null; qualityScore?: number | null; qualityReport?: QualityReport | null };

// Human-readable rubric category, e.g. "lead_time" → "lead time".
const prettyCategory = (c: string) => c.replace(/_/g, " ");

// Coverage score → colour band. Red < 60, amber 60–79, green ≥ 80.
function QualityScore({ score, report }: { score: number; report?: QualityReport | null }) {
  const band = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  const missing = report?.failed?.map((f) => prettyCategory(f.category)) ?? [];
  return (
    <div className="mt-1 flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: `color-mix(in srgb, var(--color-${band}) 14%, transparent)`, color: `var(--color-${band})` }}
        title="Sales-coverage quality score (0–100)"
      >
        Quality {score}
      </span>
      {report && report.concisenessScore < 100 && (
        <span className="text-[11px] text-text-tertiary" title="Lower when the document repeats itself">
          {report.concisenessScore}% concise
        </span>
      )}
      {missing.length > 0 && (
        <span className="text-[11px] text-text-tertiary">
          Missing: {missing.join(", ")}
        </span>
      )}
    </div>
  );
}

export function KnowledgeBase({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const { data: docsRes, isLoading, error } = useDocuments();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const docs: Doc[] = (docsRes?.data ?? []).map(d => ({ ...d, size: "", uploadDate: d.uploadDate }));

  // Backend DocumentStatus enum: processing | completed | failed.
  // A completed doc with no quality score yet is still mid-pipeline
  // ("Evaluating quality…") — count it as in-progress, not done, and don't
  // count it as ready until it has a score.
  const isScoring = (d: Doc) => d.status === "completed" && d.qualityScore == null;
  const readyCount = docs.filter(d => d.status === "completed" && !isScoring(d)).length;
  const processingCount = docs.filter(d => d.status === "processing" || isScoring(d)).length;
  // "Needs review" = anything that can't be trusted for AI answers: failed
  // extraction, a low-confidence extraction flag, or a red quality score (<60).
  const warningCount = docs.filter(d => d.status === "failed" || d.isLowConfidence || (d.qualityScore != null && d.qualityScore < 60)).length;
  const totalChunks = docs.reduce((sum, d) => sum + (d.chunkCount ?? 0), 0);

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return { color: "text-danger", bg: "color-mix(in srgb, var(--color-danger) 14%, transparent)" };
    if (ext === "docx" || ext === "doc") return { color: "text-primary", bg: "color-mix(in srgb, var(--color-primary) 14%, transparent)" };
    return { color: "text-text-tertiary", bg: "color-mix(in srgb, var(--color-text-tertiary) 14%, transparent)" };
  };

  const statusDot = (s: string) => {
    const cfg = s === "completed" ? { dot: "bg-success", text: "text-success", label: "Ready" }
      : s === "processing" ? { dot: "bg-primary", text: "text-primary", label: "Processing" }
      : { dot: "bg-danger", text: "text-danger", label: "Failed" };
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${cfg.dot} ${s === "processing" ? "animate-pulse" : ""}`} />
        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
      </div>
    );
  };

  const filtered = docs.filter(d => d.filename.toLowerCase().includes(query.toLowerCase()));

  const removeDoc = (doc: Doc) => {
    if (doc.id) deleteDoc.mutate(doc.id);
    setDeleteConfirm(null);
    toast(`Deleted "${doc.filename}"`);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    // Upload one at a time so a multi-file selection doesn't fire a burst of
    // concurrent requests (which trips the per-minute upload rate limit and,
    // before the mock-fallback fix, failed silently). Each file reports its
    // own outcome.
    for (const file of Array.from(files)) {
      try {
        await uploadDoc.mutateAsync(file);
      } catch {
        toast(`Failed to upload "${file.name}"`);
      }
    }
  };


  return (
    <Shell active="knowledge-base" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader
          title="Knowledge Base"
          subtitle="Documents your AI uses to generate accurate replies."
          actions={
            <span className="text-sm text-text-tertiary">
              <span className="font-mono font-semibold text-text-primary">{docs.length}</span> / 200 documents
            </span>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <Reveal>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
                <BookOpen size={18} strokeWidth={1.5} className="text-primary" />
              </div>
              <div className="text-xs text-text-tertiary">Documents</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{docs.length}</div>
            <div className="text-xs text-text-tertiary mt-1">of 200 limit</div>
          </Card>
          </Reveal>

          <Reveal delay={70}>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-success) 14%, transparent)" }}>
                <CheckCircle2 size={18} strokeWidth={1.5} className="text-success" />
              </div>
              <div className="text-xs text-text-tertiary">Ready</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{readyCount}</div>
            <div className="text-xs text-success mt-1">{totalChunks} chunks indexed</div>
          </Card>
          </Reveal>

          <Reveal delay={140}>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
                <Clock size={18} strokeWidth={1.5} className="text-primary" />
              </div>
              <div className="text-xs text-text-tertiary">Processing</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{processingCount}</div>
            <div className="text-xs text-text-tertiary mt-1">Indexing or scoring</div>
          </Card>
          </Reveal>

          <Reveal delay={210}>
          <Card className="p-5 transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-warning) 14%, transparent)" }}>
                <FileWarning size={18} strokeWidth={1.5} className="text-warning" />
              </div>
              <div className="text-xs text-text-tertiary">Needs Review</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{warningCount}</div>
            <div className="text-xs text-warning mt-1">Low quality</div>
          </Card>
          </Reveal>
        </div>

        {/* Document Quality Gate — real low-confidence extractions */}
        {docs.some(d => d.isLowConfidence) && (
          <div className="flex items-start gap-3 bg-warning-light border border-warning/20 rounded-lg px-4 py-3 mb-5" role="status">
            <AlertTriangle size={15} strokeWidth={1.5} className="text-warning mt-0.5 shrink-0" />
            <p className="text-[13px] text-warning leading-snug">
              {(() => {
                const flagged = docs.filter(d => d.isLowConfidence);
                const many = flagged.length > 1;
                return (
                  <>
                    <span className="font-semibold">{flagged[0].filename}</span>
                    {many ? ` and ${flagged.length - 1} other document${flagged.length > 2 ? "s" : ""}` : ""}{" "}
                    {many ? "have" : "has"} very little extractable text — review before relying on {many ? "them" : "it"} for AI answers.
                  </>
                );
              })()}
            </p>
          </div>
        )}

        {/* Accessible dropzone */}
        <Reveal>
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 mb-5 transition-all cursor-pointer focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 ${
            dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-surface hover:border-primary/50 hover:bg-primary/[0.02]"
          }`}
        >
          <input type="file" multiple className="sr-only" aria-label="Upload documents" accept=".pdf,.docx,.xlsx,.pptx,.ppt,.txt,.md" onChange={e => handleUpload(e.target.files)} />
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>
            <Upload size={24} strokeWidth={1.5} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">Drop files here or click to upload</p>
            <p className="text-xs text-text-tertiary mt-1">PDF, DOCX, XLSX, PPTX, TXT, MD — max 25 MB per file</p>
          </div>
          <span className="inline-flex items-center justify-center gap-2 font-body font-semibold rounded-lg px-4 py-2 text-[13px] bg-primary text-text-on-primary">
            Browse files
          </span>
        </label>
        </Reveal>

        {/* Search */}
        {docs.length > 0 && (
          <div className="relative mb-4">
            <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search documents…"
              aria-label="Search documents"
              className="w-full pl-9 pr-3.5 py-2.5 text-sm font-body bg-surface text-text-primary rounded-md border border-border focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary/25 placeholder:text-text-tertiary transition-colors"
            />
          </div>
        )}

        <Reveal>
        <Card className="overflow-hidden transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}>
              <FileText size={18} strokeWidth={1.5} className="text-primary" />
            </div>
            <h2 className="text-subheading text-text-primary">Documents</h2>
          </div>
          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-text-tertiary">Loading documents…</div>
          ) : error ? (
            <div className="px-5 py-10 text-center text-sm text-danger">{(error as Error).message}</div>
          ) : docs.length === 0 ? (
            <EmptyState
              icon={<FileText size={20} strokeWidth={1.5} />}
              title="No documents yet"
              description="Upload your first document above so the AI has knowledge to draw from."
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="No matches" description={`No documents match "${query}".`} />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((doc, i) => {
                const fi = fileIcon(doc.filename);
                return (
                <div key={doc.filename}>
                  <div className={`flex items-center gap-3 px-5 py-3.5 hover:bg-surface-secondary/50 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: fi.bg }}>
                      <FileText size={16} strokeWidth={1.5} className={fi.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text-primary truncate">{doc.filename}</div>
                      <div className="text-xs text-text-tertiary flex items-center gap-1.5 font-mono flex-wrap">
                        <span>{doc.fileType?.toUpperCase() ?? "FILE"}</span><span>·</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        {doc.chunkCount !== null && (<><span>·</span><span>{doc.chunkCount} chunks</span></>)}
                      </div>
                      {typeof doc.qualityScore === "number"
                        ? <QualityScore score={doc.qualityScore} report={doc.qualityReport} />
                        : doc.status === "completed" && (
                          <div className="mt-1 text-[11px] text-text-tertiary">Evaluating quality…</div>
                        )}
                    </div>
                    {statusDot(doc.status)}
                    <button
                      onClick={() => setDeleteConfirm(doc.filename)}
                      aria-label={`Delete ${doc.filename}`}
                      className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-tertiary hover:text-danger hover:border-danger/40 hover:bg-danger-light transition-colors cursor-pointer ${focusRing}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                  {deleteConfirm === doc.filename && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-danger-light border-t border-danger/15 px-5 py-3">
                      <span className="text-[13px] text-danger">Permanently delete <strong>{doc.filename}</strong> and its embeddings?</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setDeleteConfirm(null)} className={`text-xs text-text-tertiary hover:text-text-primary cursor-pointer px-2 py-1 rounded-sm ${focusRing}`}>Cancel</button>
                        <Btn variant="danger" size="sm" onClick={() => removeDoc(doc)}>Delete permanently</Btn>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </Card>
        </Reveal>

        {/* Test Knowledge Base — Coming soon */}
        <Reveal>
        <Card className="p-5 mt-5 opacity-60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-text-tertiary) 14%, transparent)" }}>
              <Zap size={18} strokeWidth={1.5} className="text-text-tertiary" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-[15px] font-semibold text-text-primary tracking-tight">Test Knowledge Base</h2>
              <p className="text-xs text-text-tertiary">Run a query to see what the AI would retrieve before sending it to your reps.</p>
            </div>
            <Badge variant="muted">Coming soon</Badge>
          </div>
        </Card>
        </Reveal>
      </div>
    </Shell>
  );
}
