import { useEffect, useState } from "react";
import { Loader2, GitCompareArrows, Check, Minus } from "lucide-react";
import { compareDocuments, listDocuments } from "../lib/api";

export default function ComparePage() {
  const [docs, setDocs] = useState([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [aspect, setAspect] = useState("overall terms, risks, and key differences");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      const d = await listDocuments();
      setDocs(d);
      if (d[0]) setA(d[0].id);
      if (d[1]) setB(d[1].id);
    })();
  }, []);

  const run = async () => {
    if (!a || !b || a === b) {
      setErr("Pick two different documents.");
      return;
    }
    setErr(null);
    setLoading(true);
    setResult(null);
    try {
      setResult(await compareDocuments(a, b, aspect));
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="compare-page">
      <div>
        <div className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
          Side-by-side
        </div>
        <h1 className="display text-3xl md:text-4xl mt-1">Compare Contracts</h1>
        <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Pick two documents and SmartLegal-AI will surface aspect-by-aspect differences — who has the better deal.
        </p>
      </div>

      <div className="card-surface p-5 grid md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end">
        <DocSelect label="Document A" value={a} onChange={setA} docs={docs} testid="compare-doc-a" />
        <DocSelect label="Document B" value={b} onChange={setB} docs={docs} testid="compare-doc-b" />
        <div>
          <div className="mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Focus aspect
          </div>
          <input
            className="input-field"
            value={aspect}
            onChange={(e) => setAspect(e.target.value)}
            data-testid="compare-aspect-input"
          />
        </div>
        <button className="btn-primary h-[42px]" onClick={run} disabled={loading} data-testid="compare-run-btn">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCompareArrows size={14} />} Compare
        </button>
      </div>

      {err && (
        <div className="text-sm" style={{ color: "var(--risk-high)" }} data-testid="compare-error">
          {err}
        </div>
      )}

      {docs.length < 2 && (
        <div className="card-surface p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Upload at least two contracts on the Documents page to enable comparison.
        </div>
      )}

      {loading && (
        <div className="card-surface p-10 text-center fade-in">
          <Loader2 className="mx-auto animate-spin mb-3" style={{ color: "var(--primary)" }} />
          <div className="display text-xl">Analyzing both contracts…</div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5 fade-in" data-testid="compare-result">
          <div className="card-surface p-6">
            <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--primary)" }}>
              Verdict Summary
            </div>
            <p className="mt-2 text-[15px] leading-relaxed">{result.summary}</p>
          </div>

          <div className="card-surface overflow-hidden">
            <div className="grid grid-cols-[1fr_1.3fr_1.3fr_100px] text-[11px] uppercase mono tracking-widest"
              style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <div className="p-3" style={{ color: "var(--text-muted)" }}>Aspect</div>
              <div className="p-3" style={{ color: "var(--primary)" }}>{result.doc1?.name}</div>
              <div className="p-3" style={{ color: "var(--primary)" }}>{result.doc2?.name}</div>
              <div className="p-3 text-center" style={{ color: "var(--text-muted)" }}>Better</div>
            </div>
            {(result.rows || []).map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1.3fr_1.3fr_100px] text-sm border-t items-start"
                style={{ borderColor: "var(--border)" }}
                data-testid={`compare-row-${i}`}
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
      )}
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

function Verdict({ v }) {
  if (v === "doc1") return <span className="chip chip-primary">A</span>;
  if (v === "doc2") return <span className="chip chip-primary">B</span>;
  if (v === "equal") return <span className="chip"><Check size={10} /> equal</span>;
  return <span className="chip"><Minus size={10} /> n/a</span>;
}
