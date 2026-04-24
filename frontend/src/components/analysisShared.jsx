import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function useAnalysis(docId, fn) {
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
    // fn is an imported module function, stable; docId is the real dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);
  return { data, loading, err };
}

export function AnalysisLoading({ label }) {
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

export function ErrorState({ msg }) {
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

export function severityClass(s) {
  if (s === "High") return "chip-high";
  if (s === "Medium") return "chip-med";
  if (s === "Low") return "chip-low";
  return "";
}
