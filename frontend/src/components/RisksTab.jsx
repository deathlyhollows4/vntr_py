import { useMemo } from "react";
import { analyzeRisks } from "../lib/api";
import { AnalysisLoading, ErrorState, severityClass, useAnalysis } from "./analysisShared";

export default function RisksTab({ docId }) {
  const { data, loading, err } = useAnalysis(docId, analyzeRisks);
  const risks = data?.data?.risks || [];
  const counts = useMemo(() => {
    const c = { High: 0, Medium: 0, Low: 0 };
    risks.forEach((r) => {
      c[r.severity] = (c[r.severity] || 0) + 1;
    });
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
        {risks.map((r, idx) => (
          <RiskCard key={`${r.title}-${r.page}-${idx}`} risk={r} idx={idx} />
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

function RiskCard({ risk: r, idx }) {
  return (
    <div className="card-surface p-5" data-testid={`risk-${idx}`}>
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
