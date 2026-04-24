import { Check, Minus } from "lucide-react";

export default function CompareResult({ result }) {
  return (
    <div className="space-y-5 fade-in" data-testid="compare-result">
      <div className="card-surface p-6">
        <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--primary)" }}>
          Verdict Summary
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">{result.summary}</p>
      </div>

      <div className="card-surface overflow-hidden">
        <div
          className="grid grid-cols-[1fr_1.3fr_1.3fr_100px] text-[11px] uppercase mono tracking-widest"
          style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="p-3" style={{ color: "var(--text-muted)" }}>Aspect</div>
          <div className="p-3" style={{ color: "var(--primary)" }}>{result.doc1?.name}</div>
          <div className="p-3" style={{ color: "var(--primary)" }}>{result.doc2?.name}</div>
          <div className="p-3 text-center" style={{ color: "var(--text-muted)" }}>Better</div>
        </div>
        {(result.rows || []).map((r, idx) => (
          <div
            key={`${r.aspect || "row"}-${idx}`}
            className="grid grid-cols-[1fr_1.3fr_1.3fr_100px] text-sm border-t items-start"
            style={{ borderColor: "var(--border)" }}
            data-testid={`compare-row-${idx}`}
          >
            <div className="p-3 font-medium capitalize">{r.aspect}</div>
            <div className="p-3" style={{ color: "var(--text-muted)" }}>{r.doc1}</div>
            <div className="p-3" style={{ color: "var(--text-muted)" }}>{r.doc2}</div>
            <div className="p-3 flex justify-center items-center">
              <Verdict v={r.verdict} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Verdict({ v }) {
  if (v === "doc1") return <span className="chip chip-primary">A</span>;
  if (v === "doc2") return <span className="chip chip-primary">B</span>;
  if (v === "equal")
    return (
      <span className="chip">
        <Check size={10} /> equal
      </span>
    );
  return (
    <span className="chip">
      <Minus size={10} /> n/a
    </span>
  );
}
