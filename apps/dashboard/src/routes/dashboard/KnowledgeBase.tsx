import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, CheckCircle2, AlertTriangle, Clock, Search, BookOpen, Zap, FileWarning } from "lucide-react";
import type { Screen } from "../../types";
import { knowledgeBase, type KBDocument } from "../../api-client";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Btn } from "../../components/Btn";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

type Doc = { id?: string; name: string; size: string; status: string; uploaded: string; chunks: number | null };

export function KnowledgeBase({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const [dragging, setDragging] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    knowledgeBase.list()
      .then(res => setDocs(res.documents.map(d => ({ ...d, uploaded: d.uploaded }))))
      .catch(err => setError(err.message || "Failed to load documents"))
      .finally(() => setLoading(false));
  }, []);

  const readyCount = docs.filter(d => d.status === "ready").length;
  const processingCount = docs.filter(d => d.status === "processing").length;
  const warningCount = docs.filter(d => d.status === "warning").length;
  const totalChunks = docs.reduce((sum, d) => sum + (d.chunks ?? 0), 0);

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return { color: "text-danger", bg: "color-mix(in srgb, var(--color-danger) 14%, transparent)" };
    if (ext === "docx" || ext === "doc") return { color: "text-primary", bg: "color-mix(in srgb, var(--color-primary) 14%, transparent)" };
    return { color: "text-text-tertiary", bg: "color-mix(in srgb, var(--color-text-tertiary) 14%, transparent)" };
  };

  const statusDot = (s: string) => {
    const cfg = s === "ready" ? { dot: "bg-success", text: "text-success", label: "Ready" }
      : s === "processing" ? { dot: "bg-primary", text: "text-primary", label: "Processing" }
      : { dot: "bg-warning", text: "text-warning", label: "Low Quality" };
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${cfg.dot} ${s === "processing" ? "animate-pulse" : ""}`} />
        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
      </div>
    );
  };

  const filtered = docs.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));

  const removeDoc = (doc: Doc) => {
    if (doc.id) knowledgeBase.delete(doc.id).catch(() => {});
    setDocs(p => p.filter(d => d.name !== doc.name));
    setDeleteConfirm(null);
    toast(`Deleted "${doc.name}"`);
  };

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const tempDoc: Doc = { name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, status: "processing", uploaded: "Just now", chunks: null };
      setDocs(p => [tempDoc, ...p]);
      knowledgeBase.upload(file)
        .then(res => setDocs(p => p.map(d => d.name === file.name ? { ...res, uploaded: res.uploaded } : d)))
        .catch(() => {
          setDocs(p => p.map(d => d.name === file.name ? { ...d, status: "warning" } : d));
          toast(`Failed to upload "${file.name}"`);
        });
    });
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
            <div className="text-xs text-text-tertiary mt-1">Being indexed</div>
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

        {/* Document Quality Gate */}
        {docs.some(d => d.status === "warning") && (
          <div className="flex items-start gap-3 bg-warning-light border border-warning/20 rounded-lg px-4 py-3 mb-5" role="status">
            <AlertTriangle size={15} strokeWidth={1.5} className="text-warning mt-0.5 shrink-0" />
            <p className="text-[13px] text-warning leading-snug">
              <span className="font-semibold">test.docx</span> has very little text — review before relying on it for AI suggestions.{" "}
              <a href="#" className={`underline font-medium cursor-pointer rounded-sm ${focusRing}`}>Review document</a>
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
          <input type="file" multiple className="sr-only" aria-label="Upload documents" onChange={e => handleUpload(e.target.files)} />
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}>
            <Upload size={24} strokeWidth={1.5} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">Drop files here or click to upload</p>
            <p className="text-xs text-text-tertiary mt-1">PDF, DOCX, TXT — max 25 MB per file</p>
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
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-text-tertiary">Loading documents…</div>
          ) : error ? (
            <div className="px-5 py-10 text-center text-sm text-danger">{error}</div>
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
                const fi = fileIcon(doc.name);
                return (
                <div key={doc.name}>
                  <div className={`flex items-center gap-3 px-5 py-3.5 hover:bg-surface-secondary/50 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: fi.bg }}>
                      <FileText size={16} strokeWidth={1.5} className={fi.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text-primary truncate">{doc.name}</div>
                      <div className="text-xs text-text-tertiary flex items-center gap-1.5 font-mono flex-wrap">
                        <span>{doc.size}</span><span>·</span><span>{doc.uploaded}</span>
                        {doc.chunks !== null && (<><span>·</span><span>{doc.chunks} chunks</span></>)}
                      </div>
                    </div>
                    {statusDot(doc.status)}
                    <button
                      onClick={() => setDeleteConfirm(doc.name)}
                      aria-label={`Delete ${doc.name}`}
                      className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-tertiary hover:text-danger hover:border-danger/40 hover:bg-danger-light transition-colors cursor-pointer ${focusRing}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                  {deleteConfirm === doc.name && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-danger-light border-t border-danger/15 px-5 py-3">
                      <span className="text-[13px] text-danger">Permanently delete <strong>{doc.name}</strong> and its embeddings?</span>
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
