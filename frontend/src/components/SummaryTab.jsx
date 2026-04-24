import { analyzeSummary } from "../lib/api";
import { AnalysisLoading, ErrorState, useAnalysis } from "./analysisShared";

export default function SummaryTab({ docId }) {
  const { data, loading, err } = useAnalysis(docId, analyzeSummary);
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
          list.map((item, idx) => (
            <li key={`${typeof item === "string" ? item.slice(0, 24) : "item"}-${idx}`}>{item}</li>
          ))
        )}
      </ul>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div
      className="flex justify-between text-sm py-2 border-b last:border-b-0"
      style={{ borderColor: "var(--border)" }}
    >
      <span style={{ color: "var(--text-muted)" }}>{k}</span>
      <span className="mono text-right max-w-[60%]">{v || "Not specified"}</span>
    </div>
  );
}
