import { useCallback, useEffect, useState } from "react";
import { listDocuments } from "../lib/api";
import UploadZone, { Hero } from "../components/UploadZone";
import DocumentsList from "../components/DocumentsList";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await listDocuments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-10" data-testid="dashboard">
      <Hero />
      <UploadZone onUploaded={refresh} />
      <section data-testid="documents-section">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
              Archive
            </div>
            <h2 className="display text-2xl md:text-3xl mt-1">Your Contracts</h2>
          </div>
          <div className="mono text-xs" style={{ color: "var(--text-muted)" }} data-testid="docs-count">
            {loading ? "loading…" : `${docs.length} document${docs.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <DocumentsList docs={docs} loading={loading} onChange={refresh} />
      </section>
    </div>
  );
}
