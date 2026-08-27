import { useState, useCallback, useRef, useEffect, Fragment } from "react";
import { Upload, FileText, Trash2, CheckCircle2, AlertTriangle, Clock, Search, BookOpen, Zap, FileWarning, X, Loader2, ChevronDown } from "lucide-react";
import type { Screen } from "../../types";
import { useDocuments, useDeleteDocument, useDeleteAllDocuments, useQualityCriteria, useTenant } from "../../hooks/queries";
import { knowledgeBase, type QualityReport, type KbSearchResult, type KbMatchStrength, type QualityPreview } from "../../api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Btn } from "../../components/Btn";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { docCap } from "../../data/pricingTiers";
import { Reveal } from "../../components/Reveal";
import { useToast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { FormInput } from "../../components/FormInput";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40";

type Doc = { id?: string; filename: string; size: string; status: string; uploadDate: string; chunkCount: number | null; fileType?: string; isLowConfidence?: boolean; qualityReason?: string | null; processingError?: string | null; qualityScore?: number | null; qualityReport?: QualityReport | null };

// Human-readable rubric category, e.g. "lead_time" → "lead time".
const prettyCategory = (c: string) => c.replace(/_/g, " ");

// Coverage score → colour band. Red < 50, amber 50–79, green ≥ 80.
function QualityScore({ score, report }: { score: number; report?: QualityReport | null }) {
  const band = score >= 80 ? "success" : score >= 50 ? "warning" : "danger";
  const missing = report?.failed?.map((f) => prettyCategory(f.category)) ?? [];
  return (
    <div className="mt-1 flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold"
        style={{ background: `color-mix(in srgb, var(--color-${band}) 14%, transparent)`, color: `var(--color-${band})` }}
        title="Sales-coverage quality score (0–100)"
      >
        Quality {score}
      </span>
      {report && report.concisenessScore < 100 && (
        <span className="text-[12px] text-text-tertiary" title="Lower when the document repeats itself">
          {report.concisenessScore}% concise
        </span>
      )}
      {missing.length > 0 && (
        <span className="text-[12px] text-text-tertiary">
          Missing: {missing.join(", ")}
        </span>
      )}
    </div>
  );
}

/**
 * What the quality score is actually looking for, shown BEFORE a file is
 * picked rather than after it has been scored.
 *
 * The rubric only existed as a constant on the server. An admin could upload a
 * document, get a number back, and have no way to find out what the number was
 * measuring — so the only route to a good score was trial and error.
 *
 * The criteria come from the endpoint rather than being written out here, so
 * they cannot drift from what the scorer does. That includes the score bands:
 * they used to be hard-coded in two places on this screen and nowhere on the
 * backend that produces the score.
 */
function QualityCriteriaPanel() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQualityCriteria();

  if (isLoading || error || !data) return null;

  return (
    <Card className="mb-5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`w-full flex items-center gap-2.5 px-5 py-4 text-left cursor-pointer hover:bg-surface-secondary/40 transition-colors ${focusRing}`}
      >
        <BookOpen size={18} strokeWidth={1.5} className="text-text-tertiary" />
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[15px] font-semibold text-text-primary tracking-tight">
            What makes a good document
          </h2>
          <p className="text-[12px] text-text-tertiary">
            Every upload is scored against {data.criteria.length} checks. {data.bands.good}+ is healthy, under {data.bands.fair} is weak.
          </p>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className={`text-text-tertiary shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1">
          <ul className="space-y-2.5">
            {data.criteria.map(c => (
              <li key={c.category} className="flex gap-3">
                <span className="shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[2.6rem] h-5 rounded-full bg-surface-secondary text-[12px] font-semibold text-text-secondary">
                  +{c.worth}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] text-text-primary">{c.asks}</span>
                  {/* The scoring is regex-based and fussier than the question
                      sounds — "competitive pricing" is not a price. The example
                      is what makes this list actionable instead of agreeable. */}
                  <span className="block mt-0.5 font-mono text-[12px] text-text-tertiary break-words">
                    {c.example}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/**
 * A distinct name per draft, because upload REPLACES any document with the same
 * filename. A fixed "draft.txt" made every accepted draft silently delete the
 * one before it — the exact destruction this panel exists to prevent,
 * reintroduced by a constant.
 */
function draftFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `draft-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
}

/** Long enough to be worth scoring; below this the result is just noise. */
const MIN_DRAFT_CHARS = 20;
/** Scored on a pause, not a keystroke — every check is a real request. */
const DRAFT_DEBOUNCE_MS = 900;

/**
 * Score before you commit — for a file, or for text as it is written.
 *
 * Uploading used to be the only way to find out what a document scored, and
 * uploading is destructive: persist() deletes any existing document with the
 * same filename before it writes. So "let me upload this and see" had already
 * replaced the better version of Pricing.pdf by the time the number appeared.
 *
 * Nothing here is stored. Check, fix, check again, and accept when it is ready
 * — accepting from this panel, not by hunting the file down again in the
 * dropzone.
 */
function QualityPreviewPanel({
  bands,
  onAccept,
}: {
  bands: { good: number; fair: number };
  onAccept: (files: File[]) => void;
}) {
  const [result, setResult] = useState<QualityPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [draft, setDraft] = useState("");
  const [accepted, setAccepted] = useState(false);
  // The exact file that produced the current result, so accepting uploads THAT
  // — not whatever happens to be in the picker afterwards.
  const checkedFile = useRef<File | null>(null);
  const lastScored = useRef<string>("");
  // Which input produced the result on screen. The extraction warning only
  // makes sense for a file.
  const [isDraft, setIsDraft] = useState(false);
  // Monotonic request id. Previews are debounced and vary wildly in cost — a
  // 20MB PDF against a one-line draft — so responses can and do arrive out of
  // order. Without this the slower, older one wins and the panel shows a score
  // for text the admin has already changed.
  const requestSeq = useRef(0);

  const check = useCallback(async (file?: File) => {
    if (!file) return;
    const seq = ++requestSeq.current;
    setChecking(true);
    setError(null);
    setAccepted(false);
    try {
      const res = await knowledgeBase.previewQuality(file);
      if (seq !== requestSeq.current) return; // superseded — drop it
      checkedFile.current = file;
      setResult(res);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      checkedFile.current = null;
      // Let this text be retried. lastScored was set before the request, so
      // leaving it in place after a failure means the identical draft can
      // never be scored again — the admin retypes it and nothing happens.
      lastScored.current = "";
      setResult(null);
      setError(err instanceof Error ? err.message : "Could not read that file");
    } finally {
      if (seq === requestSeq.current) setChecking(false);
    }
  }, []);

  // Live scoring while the admin writes or pastes.
  //
  // It goes to the server rather than running the rubric in the browser. The
  // patterns are deliberately not published — they are a recipe for text that
  // matches and says nothing — and a second copy of the rules here would drift
  // from the ones that actually score the upload. Debounced, and skipped when
  // the text has not changed, so a pause costs one request rather than a burst.
  useEffect(() => {
    const text = draft.trim();
    if (text.length < MIN_DRAFT_CHARS) {
      if (lastScored.current || error) {
        lastScored.current = "";
        setResult(null);
        setError(null); // otherwise a failure stays on screen over an empty box
        checkedFile.current = null;
      }
      return;
    }
    if (text === lastScored.current) return;

    const timer = setTimeout(() => {
      lastScored.current = text;
      // Wrapped as a .txt file so it goes through the identical path an
      // uploaded document takes — same extraction, same chunking, same rubric.
      //
      // The name carries a timestamp because upload REPLACES any document with
      // the same filename. A fixed "draft.txt" made every accepted draft
      // silently delete the one before it — the exact destruction this panel
      // exists to prevent, reintroduced by a constant.
      setIsDraft(true);
      void check(
        new File([draft], draftFilename(), { type: "text/plain" }),
      );
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, check, error]);

  // True while the score on screen no longer describes what is in the box.
  // During the 900ms debounce no request has started yet, so `checking` is
  // false and the held file is still the PRE-EDIT draft — accepting there
  // would store text the admin has already replaced.
  const stale = checking || draft.trim() !== lastScored.current;

  const accept = () => {
    if (!checkedFile.current || stale) return;
    onAccept([checkedFile.current]);
    setAccepted(true);
  };

  const band = (score: number) =>
    score >= bands.good ? "success" : score >= bands.fair ? "warning" : "danger";

  return (
    <Card className="p-5 mb-5">
      <div className="flex items-center gap-2.5 mb-3">
        <FileWarning size={18} strokeWidth={1.5} className="text-text-tertiary" />
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[15px] font-semibold text-text-primary tracking-tight">Check before you add it</h2>
          <p className="text-[12px] text-text-tertiary">
            Score a file, or write below and watch the score change. Nothing is saved until you accept.
          </p>
        </div>
        <label className={`inline-flex items-center gap-2 font-body font-semibold rounded-lg px-3 py-1.5 text-[14px] border border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-text-primary transition-colors cursor-pointer shrink-0 focus-within:ring-2 focus-within:ring-primary/25 ${checking ? "opacity-60 pointer-events-none" : ""}`}>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.docx,.xlsx,.pptx,.ppt,.txt,.md"
            aria-label="Choose a file to check"
            disabled={checking}
            onChange={e => { setDraft(""); lastScored.current = ""; setIsDraft(false); void check(e.target.files?.[0]); e.target.value = ""; }}
          />
          {checking ? "Checking…" : "Choose a file"}
        </label>
      </div>

      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={4}
        placeholder="…or paste / write the content here and the score updates as you go"
        aria-label="Draft content to score"
        className="w-full px-3.5 py-2.5 mb-3 text-[14px] font-body bg-surface text-text-primary rounded-md border border-border focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary/25 placeholder:text-text-tertiary transition-colors resize-y"
      />

      {error && <p className="text-[14px] text-danger">{error}</p>}

      {result && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2.5 flex-wrap mb-3">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: `color-mix(in srgb, var(--color-${band(result.score)}) 14%, transparent)`, color: `var(--color-${band(result.score)})` }}
            >
              Would score {result.score} / 100
            </span>
            <span className="text-[14px] text-text-secondary truncate">{result.filename}</span>
            <span className="text-[12px] text-text-tertiary font-mono">{result.chunks} passage{result.chunks === 1 ? "" : "s"}</span>
            {checking && <span className="text-[12px] text-text-tertiary">updating…</span>}

            {/* Accept, from here. Without this the admin has to find the file
                again in the dropzone — the "يقبل" half of the task was a
                second file-picker away. */}
            <span className="ml-auto shrink-0">
              {accepted ? (
                // "Queued", not "Added": onAccept hands the file to the upload
                // queue and returns. The queue below reports the real outcome,
                // and claiming success here would stay green through a failure.
                <span className="inline-flex items-center gap-1.5 text-[14px] text-success">
                  <CheckCircle2 size={14} strokeWidth={1.5} /> Queued for upload
                </span>
              ) : (
                <Btn variant="primary" size="sm" disabled={stale} onClick={accept}>
                  Add to knowledge base
                </Btn>
              )}
            </span>
          </div>

          {/* Only for FILES. The flag means "we could not read this document
              properly" — a scanned PDF, a corrupt file. Applied to text the
              admin just typed it says "very little extractable text" about
              words they can see on screen, which reads as a bug. A short draft
              is short, not unreadable; the score already says the rest. */}
          {result.isLowConfidence && !isDraft && (
            <div className="flex items-start gap-2 border-l-2 border-warning pl-3 py-1 mb-3">
              <AlertTriangle size={14} strokeWidth={1.5} className="text-warning mt-0.5 shrink-0" />
              <p className="text-[12px] text-warning leading-snug">
                {result.qualityReason ?? "The text extraction looks unreliable."}
              </p>
            </div>
          )}

          {result.covers.length > 0 && (
            <p className="text-[12px] text-text-tertiary mb-2">
              Already covers: <span className="text-success">{result.covers.map(prettyCategory).join(", ")}</span>
            </p>
          )}

          {result.gaps.length > 0 ? (
            <>
              <p className="text-[12px] font-semibold text-text-secondary mb-2">Add any of these before uploading:</p>
              <ol className="space-y-2">
                {result.gaps.map(g => (
                  <li key={g.category} className="flex gap-2.5 text-[12px]">
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[2.4rem] h-5 rounded-full bg-surface text-[12px] font-semibold text-success">
                      +{g.worth}
                    </span>
                    <span className="min-w-0">
                      <span className="text-text-secondary">{g.asks}</span>
                      <span className="block mt-0.5 font-mono text-[12px] text-text-tertiary break-words">{g.example}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-[14px] text-success">Covers everything the score looks for.</p>
          )}

          {/* Stated, not omitted: an absent repetition score would read as a
              perfect one. It genuinely cannot be measured before storage. */}
          {!result.redundancyMeasured && (
            <p className="text-[12px] text-text-tertiary mt-3">
              Repetition isn't checked here — that needs the file to be indexed first.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * "What would the AI find?" — the admin's own retrieval check.
 *
 * This card was a disabled placeholder while the retrieval stack underneath was
 * fully working, so the only way to discover a gap in the knowledge base was to
 * wait for a real client email to need it.
 *
 * It deliberately shows what retrieval ACTUALLY returned rather than a tidied
 * version: vector search always hands back its top results, so a question the
 * knowledge base does not cover still produces passages. They are labelled
 * instead of hidden — the point of the screen is to be able to trust it.
 */
function TestKnowledgeBase() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<KbSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const ask = async () => {
    const q = question.trim();
    if (q.length < 3 || running) return;
    setRunning(true);
    setError(null);
    try {
      setResult(await knowledgeBase.test(q));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setRunning(false);
    }
  };

  // Every verdict is about the passages the AI is ACTUALLY given, never about
  // the extra ones shown below the cutoff — claiming coverage from a passage
  // the model never receives is the one lie this screen exists to prevent.
  const OUTCOME: Record<KbSearchResult["outcome"], { tone: string; text: string }> = {
    ok: { tone: "text-success", text: "The AI has a real match to work from." },
    weak_match: {
      tone: "text-warning",
      text: "Nothing the AI receives really answers this. These passages came back because search always returns its closest matches — not because they cover the question.",
    },
    no_match: { tone: "text-warning", text: "Nothing in your knowledge base matched." },
    empty_knowledge_base: {
      tone: "text-text-tertiary",
      text: "Nothing is indexed yet. Upload a document first — a new upload takes a moment to become searchable.",
    },
  };

  // Match quality is a measurement, not an alarm — "weak" means the index is
  // thin on this topic, which is not the same kind of event as an escalation.
  const strengthStyle = (s: KbMatchStrength) =>
    s === "strong" ? "success" : "muted";

  return (
    <Card className="p-5 mt-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Zap size={18} strokeWidth={1.5} className="text-text-tertiary" />
        <div className="flex-1">
          <h2 className="font-display text-[15px] font-semibold text-text-primary tracking-tight">Test retrieval</h2>
          <p className="text-[12px] text-text-tertiary">Ask what a client would ask, and see what the AI would find.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") void ask(); }}
          placeholder="e.g. What is the lead time on the WP-120?"
          aria-label="Question to test against the knowledge base"
          className="flex-1 px-3.5 py-2.5 text-[14px] font-body bg-surface text-text-primary rounded-md border border-border focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary/25 placeholder:text-text-tertiary transition-colors"
        />
        <Btn variant="primary" loading={running} disabled={question.trim().length < 3} onClick={() => { void ask(); }}>
          {running ? "Searching…" : "Test"}
        </Btn>
      </div>

      {error && <p className="text-[14px] text-danger mt-3">{error}</p>}

      {result && (
        <div className="mt-4">
          <div className="flex items-baseline gap-2 flex-wrap mb-3">
            <span className={`text-[14px] font-medium ${OUTCOME[result.outcome].tone}`}>
              {OUTCOME[result.outcome].text}
            </span>
            {/* The two halves are shown separately because they fail differently:
                the keyword half is the one that catches an exact SKU the
                embedding misses, and seeing it return 0 explains a lot. */}
            <span className="text-[12px] text-text-tertiary font-mono">
              {result.candidates.semantic} by meaning · {result.candidates.keyword} by keyword · {result.tookMs}ms
            </span>
          </div>

          {/* The answer existing but ranking out of reach is invisible without
              saying so: the verdict correctly reads "weak", the passage
              correctly reads "strong", and nothing connects the two. */}
          {result.outcome !== "ok" && result.hits.some(h => !h.reachesModel && h.strength === "strong") && (
            <p className="text-[14px] text-warning mb-3">
              A strong passage ranked just below the cutoff — the AI will not see it.
              Cutting the noise above it, or splitting that document, would bring it into reach.
            </p>
          )}

          <ol className="space-y-2">
            {result.hits.map((h, i) => (
              <Fragment key={h.chunkId}>
                {/* Drawn from the pipeline's own TOP_K, not a number copied
                    here — a preview that guessed its own cutoff would show a
                    line in the wrong place, which is worse than no line. */}
                {i === result.modelTopK && (
                  <li aria-hidden className="flex items-center gap-2.5 pt-1 pb-0.5">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[12px] text-text-tertiary shrink-0">
                      the AI reads the {result.modelTopK} above · everything below is out of reach
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </li>
                )}
              <li className={`border-t border-border py-3 ${h.reachesModel ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-[12px] font-mono text-text-tertiary">#{i + 1}</span>
                  <span className="text-[14px] font-medium text-text-primary truncate">{h.filename}</span>
                  <Badge variant={strengthStyle(h.strength)}>{h.strength}</Badge>
                  <span className="text-[12px] text-text-tertiary" title="Which half of the hybrid search found it">
                    {h.foundBy === "both" ? "meaning + keyword" : h.foundBy === "semantic" ? "meaning" : "keyword"}
                  </span>
                  {h.similarity !== null && (
                    <span className="text-[12px] font-mono text-text-tertiary">{h.similarity.toFixed(2)}</span>
                  )}
                  {h.isLowConfidence && (
                    <span className="text-[12px] text-warning" title="This document had an unreliable text extraction">
                      unreliable extraction
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {h.content}
                </p>
              </li>
              </Fragment>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}

type UploadEntry = {
  id: string;
  name: string;
  status: "queued" | "uploading" | "done" | "failed";
  progress: number;
  error?: string;
};

export function KnowledgeBase({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const uploadingRef = useRef(false);
  const queueRef = useRef<{ file: File; id: string }[]>([]);
  // Lets the header "Upload Document" button drive the same hidden input as
  // the dropzone below — one upload path, two entry points.
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const { data: docsRes, isLoading, error } = useDocuments();
  const { data: tenant } = useTenant();
  const limit = docCap(tenant?.tier);
  const criteria = useQualityCriteria();
  const deleteDoc = useDeleteDocument();
  const deleteAll = useDeleteAllDocuments();

  const docs: Doc[] = (docsRes?.data ?? []).map(d => ({ ...d, size: "", uploadDate: d.uploadDate }));

  // Backend DocumentStatus enum: processing | completed | failed.
  // A completed doc with no quality score yet is still mid-pipeline
  // ("Evaluating quality…") — count it as in-progress, not done, and don't
  // count it as ready until it has a score.
  const isScoring = (d: Doc) => d.status === "completed" && d.qualityScore == null;
  const readyCount = docs.filter(d => d.status === "completed" && !isScoring(d)).length;
  const processingCount = docs.filter(d => d.status === "processing" || isScoring(d)).length;
  // "Needs review" = anything that can't be trusted for AI answers: failed
  // extraction, a low-confidence extraction flag, or a red quality score (<50).
  const warningCount = docs.filter(d => d.status === "failed" || d.isLowConfidence || (d.qualityScore != null && d.qualityScore < 50)).length;
  const totalChunks = docs.reduce((sum, d) => sum + (d.chunkCount ?? 0), 0);

  // File type is not a status. Colouring PDFs red put a perfectly good
  // document in the same register as a failed one; the extension is shown
  // as text instead, which is also the thing the reader actually wanted.
  const fileExt = (name: string) => name.split(".").pop()?.toUpperCase() ?? "FILE";

  const statusDot = (s: string) => {
    const cfg = s === "completed" ? { dot: "bg-success", text: "text-success", label: "Ready" }
      : s === "processing" ? { dot: "bg-primary", text: "text-primary", label: "Processing" }
      : { dot: "bg-danger", text: "text-danger", label: "Failed" };
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${cfg.dot} ${s === "processing" ? "animate-pulse" : ""}`} />
        <span className={`text-[12px] font-medium ${cfg.text}`}>{cfg.label}</span>
      </div>
    );
  };

  const filtered = docs.filter(d => d.filename.toLowerCase().includes(query.toLowerCase()));

  const removeDoc = (doc: Doc) => {
    if (doc.id) deleteDoc.mutate(doc.id);
    setDeleteConfirm(null);
    toast(`Deleted "${doc.filename}"`);
  };

  // The tenant-wide total, not the page. `docs` only holds the current page, so
  // using its length would understate what the button is about to destroy.
  const totalDocs = docsRes?.meta?.total ?? docs.length;

  const confirmDeleteAll = async () => {
    try {
      const { deleted } = await deleteAll.mutateAsync();
      toast(`Deleted ${deleted} document${deleted === 1 ? "" : "s"}`);
      setShowDeleteAll(false);
      setTyped("");
    } catch {
      toast("Couldn't empty the knowledge base. Please try again.");
    }
  };

  // Drains the queue one file at a time (a multi-file selection must not fire a
  // burst — that trips the per-minute upload rate limit). Each file reports its
  // own progress; the list is refetched once when the whole queue is done.
  const processQueue = useCallback(async () => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    while (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      setUploads(prev => prev.map(u => u.id === next.id ? { ...u, status: "uploading", progress: 0 } : u));
      try {
        const { promise } = knowledgeBase.uploadWithProgress(next.file, (pct) => {
          setUploads(prev => prev.map(u => u.id === next.id ? { ...u, progress: pct } : u));
        });
        await promise;
        setUploads(prev => prev.map(u => u.id === next.id ? { ...u, status: "done", progress: 100 } : u));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploads(prev => prev.map(u => u.id === next.id ? { ...u, status: "failed", error: msg } : u));
        toast(`Failed to upload "${next.file.name}"`);
      }
    }
    uploadingRef.current = false;
    qc.invalidateQueries({ queryKey: ["kb"] });
    setUploads(prev => {
      const hasFailed = prev.some(u => u.status === "failed");
      if (!hasFailed) setTimeout(() => setUploads([]), 3000);
      return prev;
    });
  }, [qc, toast]);

  const dismissUploads = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status === "queued" || u.status === "uploading"));
  }, []);

  const uploadFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const entries: { entry: UploadEntry; file: File }[] = files.map((file, i) => ({
      file,
      entry: { id: `${Date.now()}-${i}`, name: file.name, status: "queued" as const, progress: 0 },
    }));
    setUploads(prev => [...prev, ...entries.map(e => e.entry)]);
    queueRef.current.push(...entries.map(e => ({ file: e.file, id: e.entry.id })));
    processQueue();
  }, [processQueue]);

  const handleUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    uploadFiles(Array.from(files));
  }, [uploadFiles]);


  return (
    <Shell active="knowledge-base" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader
          title="Knowledge Base"
          subtitle="Documents your AI uses to generate accurate replies."
          actions={
            <button
              onClick={() => uploadInputRef.current?.click()}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white shrink-0 cursor-pointer bg-(--brand-cyan) hover:bg-(--brand-teal) transition-colors ${focusRing}`}
            >
              <Upload size={16} strokeWidth={1.75} /> Upload Document
            </button>
          }
        />

        {/* Storage usage — Figma: "X of Y documents used" + progress bar */}
        {limit !== null && (
          <Reveal>
          <Card className="px-6 py-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-medium text-text-primary">{totalDocs} of {limit} documents used</span>
              <span className="text-[14px] font-semibold text-secondary">{Math.round((totalDocs / limit) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-500"
                style={{ width: `${Math.min(100, (totalDocs / limit) * 100)}%` }}
              />
            </div>
          </Card>
          </Reveal>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <Reveal>
          <Card className="p-5 ">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={18} strokeWidth={1.5} className="text-text-tertiary" />
              <div className="text-[12px] text-text-tertiary">Documents</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{docs.length}</div>
            <div className="text-[12px] text-text-tertiary mt-1">{limit === null ? "no limit" : `of ${limit} limit`}</div>
          </Card>
          </Reveal>

          <Reveal delay={70}>
          <Card className="p-5 ">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 size={18} strokeWidth={1.5} className="text-text-tertiary" />
              <div className="text-[12px] text-text-tertiary">Ready</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{readyCount}</div>
            <div className="text-[12px] text-success mt-1">{totalChunks} chunks indexed</div>
          </Card>
          </Reveal>

          <Reveal delay={140}>
          <Card className="p-5 ">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={18} strokeWidth={1.5} className="text-text-tertiary" />
              <div className="text-[12px] text-text-tertiary">Processing</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{processingCount}</div>
            <div className="text-[12px] text-text-tertiary mt-1">Indexing or scoring</div>
          </Card>
          </Reveal>

          <Reveal delay={210}>
          <Card className="p-5 ">
            <div className="flex items-center gap-3 mb-3">
              <FileWarning size={18} strokeWidth={1.5} className="text-text-tertiary" />
              <div className="text-[12px] text-text-tertiary">Needs Review</div>
            </div>
            <div className="text-2xl font-display font-bold text-text-primary">{warningCount}</div>
            <div className="text-[12px] text-warning mt-1">Low quality</div>
          </Card>
          </Reveal>
        </div>

        {/* Document Quality Gate — real low-confidence extractions */}
        {docs.some(d => d.isLowConfidence) && (
          <div className="flex items-start gap-3 bg-warning-light border border-warning/20 rounded-lg px-4 py-3 mb-5" role="status">
            <AlertTriangle size={15} strokeWidth={1.5} className="text-warning mt-0.5 shrink-0" />
            <p className="text-[14px] text-warning leading-snug">
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

        {/* Both sit directly above the dropzone: they are only useful while
            the admin still has the chance to fix the file. */}
        <Reveal>
        <QualityCriteriaPanel />
        </Reveal>
        <Reveal>
        <QualityPreviewPanel bands={criteria.data?.bands ?? { good: 80, fair: 50 }} onAccept={uploadFiles} />
        </Reveal>

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
          <input ref={uploadInputRef} type="file" multiple className="sr-only" aria-label="Upload documents" accept=".pdf,.docx,.xlsx,.pptx,.ppt,.txt,.md" onChange={e => handleUpload(e.target.files)} />
          <Upload size={24} strokeWidth={1.5} className="text-text-tertiary" />
          <div className="text-center">
            <p className="text-[14px] font-semibold text-text-primary">Drop files here or click to upload</p>
            <p className="text-[12px] text-text-tertiary mt-1">PDF, DOCX, XLSX, PPTX, TXT, MD — max 25 MB per file</p>
          </div>
          <span className="inline-flex items-center justify-center gap-2 font-body font-semibold rounded-lg px-4 py-2 text-[14px] bg-primary text-text-on-primary">
            Browse files
          </span>
        </label>
        </Reveal>

        {/* Upload queue */}
        {uploads.length > 0 && (
          <Card className="mb-5 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Upload size={14} strokeWidth={1.5} className="text-primary" />
                <span className="text-[14px] font-semibold text-text-primary">
                  Uploading {uploads.filter(u => u.status === "queued" || u.status === "uploading").length > 0
                    ? `${uploads.filter(u => u.status === "done").length}/${uploads.length}`
                    : `${uploads.length} done`}
                </span>
              </div>
              {uploads.every(u => u.status === "done" || u.status === "failed") && (
                <button onClick={dismissUploads} className={`text-[12px] text-text-tertiary hover:text-text-primary cursor-pointer ${focusRing}`}>Dismiss</button>
              )}
            </div>
            <div className="divide-y divide-border">
              {uploads.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0">
                    {u.status === "uploading" ? <Loader2 size={14} strokeWidth={1.5} className="text-primary animate-spin" />
                     : u.status === "done" ? <CheckCircle2 size={14} strokeWidth={1.5} className="text-success" />
                     : u.status === "failed" ? <AlertTriangle size={14} strokeWidth={1.5} className="text-danger" />
                     : <Clock size={14} strokeWidth={1.5} className="text-text-tertiary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-text-primary truncate">{u.name}</div>
                    {u.status === "uploading" && (
                      <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                          style={{ width: `${u.progress}%` }}
                        />
                      </div>
                    )}
                    {u.status === "failed" && u.error && (
                      <div className="text-[12px] text-danger mt-0.5 truncate">{u.error}</div>
                    )}
                  </div>
                  <span className="text-[12px] font-mono text-text-tertiary shrink-0 w-12 text-right">
                    {u.status === "uploading" ? `${u.progress}%`
                     : u.status === "done" ? "Done"
                     : u.status === "failed" ? "Error"
                     : "Queued"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

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
              className="w-full pl-9 pr-3.5 py-2.5 text-[14px] font-body bg-surface text-text-primary rounded-md border border-border focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary/25 placeholder:text-text-tertiary transition-colors"
            />
          </div>
        )}

        <Reveal>
        <Card className="overflow-hidden ">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <FileText size={18} strokeWidth={1.5} className="text-text-tertiary" />
            <h2 className="text-subheading text-text-primary">Documents</h2>
            {/* Sits with the list it empties, not up in the page header — a
                destructive action belongs next to the thing it destroys. */}
            {totalDocs > 0 && (
              <div className="ml-auto">
                <Btn variant="danger" size="sm" onClick={() => { setTyped(""); setShowDeleteAll(true); }}>
                  <Trash2 size={13} strokeWidth={1.5} />
                  Delete all
                </Btn>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="px-5 py-10 text-center text-[14px] text-text-tertiary">Loading documents…</div>
          ) : error ? (
            <div className="px-5 py-10 text-center text-[14px] text-danger">{(error as Error).message}</div>
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
                const ext = fileExt(doc.filename);
                return (
                <div key={doc.filename}>
                  <div className={`flex items-center gap-3 px-5 py-3.5 hover:bg-surface-secondary/50 transition-colors ${i % 2 === 1 ? "bg-surface-secondary/40" : ""}`}>
                    {/* Figma: wheat-tinted file-type badge (theme-aware) */}
                    <span
                      className="px-2 py-1 rounded shrink-0 text-[12px] font-semibold leading-none"
                      style={{ backgroundColor: "var(--filetype-bg)", color: "var(--filetype-fg)" }}
                    >
                      {ext}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-text-primary truncate">{doc.filename}</div>
                      <div className="text-[12px] text-text-tertiary flex items-center gap-1.5 font-mono flex-wrap">
                        <span>{doc.fileType?.toUpperCase() ?? "FILE"}</span><span>·</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        {doc.chunkCount !== null && (<><span>·</span><span>{doc.chunkCount} chunks</span></>)}
                      </div>
                      {typeof doc.qualityScore === "number"
                        ? <QualityScore score={doc.qualityScore} report={doc.qualityReport} />
                        : doc.status === "completed" && (
                          <div className="mt-1 text-[12px] text-text-tertiary">Evaluating quality…</div>
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
                      <span className="text-[14px] text-danger">Permanently delete <strong>{doc.filename}</strong> and its embeddings?</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setDeleteConfirm(null)} className={`text-[12px] text-text-tertiary hover:text-text-primary cursor-pointer px-2 py-1 rounded-sm ${focusRing}`}>Cancel</button>
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

        <Reveal>
        <TestKnowledgeBase />
        </Reveal>
      </div>

      {/* Emptying the KB starves the Matcher for every SE at once and there is
          no restore path, so it asks for the word to be typed — same treatment
          as offboarding the team in Settings. */}
      <Modal
        open={showDeleteAll}
        onClose={() => { setShowDeleteAll(false); setTyped(""); }}
        title="Delete the entire Knowledge Base"
        footer={
          <>
            <Btn variant="secondary" size="sm" onClick={() => { setShowDeleteAll(false); setTyped(""); }}>Cancel</Btn>
            <Btn
              variant="danger"
              size="sm"
              loading={deleteAll.isPending}
              disabled={typed !== "DELETE"}
              onClick={confirmDeleteAll}
            >
              Delete all {totalDocs} documents
            </Btn>
          </>
        }
      >
        <div>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-danger-light flex items-center justify-center shrink-0">
              <AlertTriangle size={18} strokeWidth={1.5} className="text-danger" />
            </div>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              This permanently removes <strong className="text-text-primary">{totalDocs} document{totalDocs === 1 ? "" : "s"}</strong> from your Knowledge Base.
            </p>
          </div>

          <div className="bg-danger-light border border-danger/15 rounded-lg p-4">
            <ul className="space-y-1.5">
              {[
                "Every document, its chunks and its embeddings are deleted",
                "Replies stop being grounded — the AI will find no product answers",
                "There is no restore. Documents must be uploaded again",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-[14px] text-danger">
                  <X size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[14px] text-text-secondary leading-relaxed mt-5 mb-3">
            Type <strong className="text-text-primary font-mono">DELETE</strong> to confirm.
          </p>
          <FormInput value={typed} onChange={setTyped} placeholder="DELETE" />
        </div>
      </Modal>
    </Shell>
  );
}
