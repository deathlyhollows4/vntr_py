import { analyzeClauses } from "../lib/api";
import { AnalysisLoading, ErrorState, useAnalysis } from "./analysisShared";

export default function ClausesTab({ docId }) {
  const { data, loading, err } = useAnalysis(docId, analyzeClauses);
  if (loading) return <AnalysisLoading label="Extracting clauses by category…" />;
  if (err) return <ErrorState msg={err} />;
  const cats = data?.data?.categories || [];

  if (cats.length === 0) {
    return (
      <div className="card-surface p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        No clauses extracted.
      </div>
    );
  }

  return (
    <div className="grid gap-4 stagger" data-testid="clauses-tab">
      {cats.map((c, idx) => (
        <div key={`${c.name}-${idx}`} className="card-surface p-5" data-testid={`clause-cat-${idx}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="display text-2xl" style={{ fontWeight: 500 }}>
              {c.name}
            </div>
            <span className="chip">{(c.items || []).length} items</span>
          </div>
          <div className="space-y-3">
            {(c.items || []).map((it, j) => (
              <div
                key={`${it.title || "item"}-${it.page}-${j}`}
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
    </div>
  );
}
