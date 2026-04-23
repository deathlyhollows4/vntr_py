import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  MessageCircleQuestion,
  ShieldAlert,
  ListChecks,
  FileSignature,
  Send,
  Loader2,
} from "lucide-react";
import {
  analyzeClauses,
  analyzeRisks,
  analyzeSummary,
  askQuestion,
  getDocument,
  getHistory,
  reportUrl,
} from "../lib/api";

const TABS = [
  { id: "qa", label: "Q&A", icon: MessageCircleQuestion },
  { id: "risks", label: "Risks", icon: ShieldAlert },
  { id: "clauses", label: "Clauses", icon: ListChecks },
  { id: "summary", label: "Summary", icon: FileSignature },
];

export default function DocumentViewer() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState("qa");

  useEffect(() => {
    (async () => setDoc(await getDocument(id)))();
  }, [id]);

  if (!doc) {
    return (
      <div className="space-y-3" data-testid="doc-loading">
        <div className="skeleton h-10 w-1/3" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="document-viewer">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/"
            className="mono text-[11px] uppercase tracking-widest flex items-center gap-1.5 hover:text-white"
            style={{ color: "var(--text-muted)" }}
            data-testid="back-link"
          >
            <ArrowLeft size={12} /> All documents
          </Link>
          <h1 className="display text-3xl md:text-4xl mt-2" data-testid="doc-title">
            {doc.name}
          </h1>
          <div className="mono text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
            {doc.pages} pages · {Math.round((doc.chars || 0) / 1000)}k characters
          </div>
        </div>
        <a
          className="btn-ghost"
          href={reportUrl(doc.id)}
          data-testid="download-report-btn"
          target="_blank"
          rel="noreferrer"
        >
          <Download size={14} /> Report
        </a>
      </div>

      <div className="flex items-center gap-6 border-b" data-testid="doc-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn ${tab === t.id ? "active" : ""}`}
              data-testid={`tab-${t.id}`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon size={13} /> {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="fade-in">
        {tab === "qa" && <QATab docId={doc.id} />}
        {tab === "risks" && <RisksTab docId={doc.id} />}
        {tab === "clauses" && <ClausesTab docId={doc.id} />}
        {tab === "summary" && <SummaryTab docId={doc.id} />}
      </div>
    </div>
  );
}

/* ------- Q&A ------- */
function QATab({ docId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      const hist = await getHistory(docId);
      setMessages(hist.map((h) => ({ role: "assistant", ...h })));
    })();
  }, [docId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const SUGGESTIONS = [
    "What are the termination conditions?",
    "What is the liability cap?",
    "Who are the parties and when is the effective date?",
    "Are there any auto-renewal clauses?",
  ];

  const send = async (q) => {
    const question = (q ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setErr(null);
    setMessages((m) => [...m, { role: "user", question, timestamp: new Date().toISOString() }]);
    setLoading(true);
    try {
      const resp = await askQuestion(docId, question);
      setMessages((m) => [...m, { role: "assistant", ...resp }]);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-6" data-testid="qa-tab">
      <div className="card-surface p-5 flex flex-col min-h-[480px]">
        <div className="flex-1 overflow-y-auto pr-1 space-y-4" data-testid="qa-messages">
          {messages.length === 0 && !loading && (
            <div className="text-sm" style={{ color: "var(--text-muted)" }} data-testid="qa-empty">
              Ask anything in plain English. Answers are grounded in the document and cite page numbers.
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="spinner" /> SmartLegal-AI is reading the relevant pages…
            </div>
          )}
          <div ref={endRef} />
        </div>
        {err && (
          <div className="text-xs mb-2" style={{ color: "var(--risk-high)" }} data-testid="qa-error">
            {err}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <input
            className="input-field"
            placeholder="Ask a question about this contract…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
            data-testid="qa-input"
          />
          <button className="btn-primary" onClick={() => send()} disabled={loading} data-testid="qa-send-btn">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Ask
          </button>
        </div>
      </div>

      <aside className="space-y-3" data-testid="qa-suggestions">
        <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Suggestions
        </div>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => send(s)}
            disabled={loading}
            className="card-surface card-clickable w-full text-left p-3 text-sm"
            data-testid={`suggestion-${i}`}
          >
            {s}
          </button>
        ))}
      </aside>
    </div>
  );
}

function MessageBubble({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] px-4 py-2 rounded-sm"
          style={{ background: "var(--primary-muted)", border: "1px solid rgba(225,29,72,0.3)" }}
        >
          <div className="text-sm">{msg.question}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start" data-testid="qa-answer">
      <div className="max-w-[92%]">
        {msg.question && (
          <div className="mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-dim)" }}>
            Re: {msg.question}
          </div>
        )}
        <div
          className="px-4 py-3 rounded-sm"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{renderWithCitations(msg.answer || "")}</div>
        </div>
        {msg.citations?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.citations.map((c, i) => (
              <div
                key={i}
                className="card-surface p-2 text-[11px] max-w-xs"
                style={{ color: "var(--text-muted)" }}
                title={c.quote}
              >
                <span className="citation-tag">Page {c.page}</span>
                <span className="ml-1 line-clamp-2">{c.quote}…</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderWithCitations(text) {
  const parts = text.split(/(\[Page\s+\d+\])/g);
  return parts.map((p, i) => {
    if (/^\[Page\s+\d+\]$/.test(p)) return <span className="citation-tag" key={i}>{p.replace(/[[\]]/g, "")}</span>;
    return <span key={i}>{p}</span>;
  });
}

/* ------- Shared analysis hook ------- */
function useAnalysis(docId, fn, depKey) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fn(docId)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setErr(e?.response?.data?.detail || e?.message || "Failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, depKey]);
  return { data, loading, err };
}

/* ------- Risks ------- */
function RisksTab({ docId }) {
  const { data, loading, err } = useAnalysis(docId, analyzeRisks, "risks");
  const risks = data?.data?.risks || [];
  const counts = useMemo(() => {
    const c = { High: 0, Medium: 0, Low: 0 };
    risks.forEach((r) => (c[r.severity] = (c[r.severity] || 0) + 1));
    return c;
  }, [risks]);

  if (loading) return <AnalysisLoading label="Scanning for risks across the contract…" />;
  if (err) return <ErrorState msg={err} />;

  return (
    <div className="space-y-6" data-testid="risks-tab">
      <div className="grid grid-cols-3 gap-3">
        <RiskStat label="High" count={counts.High} cls="chip-high" />
        <RiskStat label="Medium" count={counts.Medium} cls="chip-med" />
        <RiskStat label="Low" count={counts.Low} cls="chip-low" />
      </div>
      <div className="grid gap-3 stagger">
        {risks.map((r, i) => (
          <div key={i} className="card-surface p-5" data-testid={`risk-${i}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`chip ${severityClass(r.severity)}`}>{r.severity}</span>
                <div className="display text-xl" style={{ fontWeight: 500 }}>
                  {r.title}
                </div>
              </div>
              <span className="citation-tag shrink-0">Page {r.page}</span>
            </div>
            {r.clause && (
              <p className="mt-3 text-sm italic" style={{ color: "var(--text-muted)" }}>
                “{r.clause}”
              </p>
            )}
            {r.why && (
              <div className="mt-3 text-sm">
                <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
                  Why it matters
                </span>
                <div className="mt-1">{r.why}</div>
              </div>
            )}
            {r.recommendation && (
              <div className="mt-3 text-sm">
                <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                  Recommendation
                </span>
                <div className="mt-1">{r.recommendation}</div>
              </div>
            )}
          </div>
        ))}
        {risks.length === 0 && (
          <div className="card-surface p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No risks detected.
          </div>
        )}
      </div>
    </div>
  );
}

function RiskStat({ label, count, cls }) {
  return (
    <div className="card-surface p-5" data-testid={`risk-stat-${label.toLowerCase()}`}>
      <div className="flex items-center justify-between">
        <span className={`chip ${cls}`}>{label}</span>
        <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
          severity
        </span>
      </div>
      <div className="display text-4xl mt-3" style={{ fontWeight: 500 }}>
        {count}
      </div>
    </div>
  );
}

function severityClass(s) {
  if (s === "High") return "chip-high";
  if (s === "Medium") return "chip-med";
  if (s === "Low") return "chip-low";
  return "";
}

/* ------- Clauses ------- */
function ClausesTab({ docId }) {
  const { data, loading, err } = useAnalysis(docId, analyzeClauses, "clauses");
  if (loading) return <AnalysisLoading label="Extracting clauses by category…" />;
  if (err) return <ErrorState msg={err} />;
  const cats = data?.data?.categories || [];
  return (
    <div className="grid gap-4 stagger" data-testid="clauses-tab">
      {cats.map((c, i) => (
        <div key={i} className="card-surface p-5" data-testid={`clause-cat-${i}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="display text-2xl" style={{ fontWeight: 500 }}>
              {c.name}
            </div>
            <span className="chip">{(c.items || []).length} items</span>
          </div>
          <div className="space-y-3">
            {(c.items || []).map((it, j) => (
              <div
                key={j}
                className="p-3 rounded-sm"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{it.title}</div>
                  <span className="citation-tag">Page {it.page}</span>
                </div>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {it.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      {cats.length === 0 && (
        <div className="card-surface p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No clauses extracted.
        </div>
      )}
    </div>
  );
}

/* ------- Summary ------- */
function SummaryTab({ docId }) {
  const { data, loading, err } = useAnalysis(docId, analyzeSummary, "summary");
  if (loading) return <AnalysisLoading label="Drafting your executive briefing…" />;
  if (err) return <ErrorState msg={err} />;
  const s = data?.data || {};
  return (
    <div className="space-y-4" data-testid="summary-tab">
      <div className="card-surface p-6">
        <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--primary)" }}>
          Executive Summary
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">{s.overview}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <KVCard title="Parties" items={s.parties} />
        <KVCard title="Key Obligations" items={s.key_obligations} />
        <KVCard title="Financials" items={s.financials} />
        <KVCard title="Highlights" items={s.highlights} />
        <KVCard title="Red Flags" items={s.red_flags} tone="high" />
        <div className="card-surface p-5">
          <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Key Dates & Law
          </div>
          <Row k="Effective Date" v={s.effective_date} />
          <Row k="Term" v={s.term} />
          <Row k="Governing Law" v={s.governing_law} />
        </div>
      </div>
    </div>
  );
}

function KVCard({ title, items, tone }) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return (
    <div className="card-surface p-5">
      <div
        className="mono text-[10px] uppercase tracking-widest"
        style={{ color: tone === "high" ? "var(--risk-high)" : "var(--text-muted)" }}
      >
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm list-disc list-inside">
        {list.length === 0 ? (
          <li style={{ color: "var(--text-dim)" }}>Not specified</li>
        ) : (
          list.map((i, k) => <li key={k}>{i}</li>)
        )}
      </ul>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--text-muted)" }}>{k}</span>
      <span className="mono text-right max-w-[60%]">{v || "Not specified"}</span>
    </div>
  );
}

function AnalysisLoading({ label }) {
  return (
    <div className="card-surface p-12 text-center" data-testid="analysis-loading">
      <Loader2 className="mx-auto animate-spin mb-3" style={{ color: "var(--primary)" }} />
      <div className="display text-xl">{label}</div>
      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        Cached after first run — subsequent visits load instantly.
      </div>
    </div>
  );
}

function ErrorState({ msg }) {
  return (
    <div className="card-surface p-8 text-center" data-testid="analysis-error">
      <div className="display text-xl" style={{ color: "var(--risk-high)" }}>
        Something went wrong
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
        {msg}
      </div>
    </div>
  );
}
