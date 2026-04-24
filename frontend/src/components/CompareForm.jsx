import { Loader2, GitCompareArrows } from "lucide-react";

export default function CompareForm({ docs, a, b, aspect, loading, onA, onB, onAspect, onRun }) {
  return (
    <div className="card-surface p-5 grid md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end">
      <DocSelect label="Document A" value={a} onChange={onA} docs={docs} testid="compare-doc-a" />
      <DocSelect label="Document B" value={b} onChange={onB} docs={docs} testid="compare-doc-b" />
      <div>
        <div className="mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          Focus aspect
        </div>
        <input
          className="input-field"
          value={aspect}
          onChange={(e) => onAspect(e.target.value)}
          data-testid="compare-aspect-input"
        />
      </div>
      <button className="btn-primary h-[42px]" onClick={onRun} disabled={loading} data-testid="compare-run-btn">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCompareArrows size={14} />} Compare
      </button>
    </div>
  );
}

function DocSelect({ label, value, onChange, docs, testid }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
      >
        <option value="">— select —</option>
        {docs.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}
