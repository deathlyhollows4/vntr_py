import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { compareDocuments, listDocuments } from "../lib/api";
import CompareForm from "../components/CompareForm";
import CompareResult from "../components/CompareResult";

export default function ComparePage() {
  const [docs, setDocs] = useState([]);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [aspect, setAspect] = useState("overall terms, risks, and key differences");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    listDocuments().then((d) => {
      setDocs(d);
      if (d[0]) setA(d[0].id);
      if (d[1]) setB(d[1].id);
    });
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

      <CompareForm
        docs={docs}
        a={a}
        b={b}
        aspect={aspect}
        loading={loading}
        onA={setA}
        onB={setB}
        onAspect={setAspect}
        onRun={run}
      />

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

      {result && !loading && <CompareResult result={result} />}
    </div>
  );
}
