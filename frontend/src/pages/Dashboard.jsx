import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Trash2, Loader2, Sparkles, ShieldAlert, Scale } from "lucide-react";
import { deleteDocument, listDocuments, uploadDocument } from "../lib/api";

const fmtDate = (s) => {
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return s;
  }
};

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDocs(await listDocuments());
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      await refresh();
      navigate(`/documents/${doc.id}`);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const onDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document and all analyses?")) return;
    await deleteDocument(id);
    refresh();
  };

  return (
    <div className="space-y-10" data-testid="dashboard">
      <Hero />

      <section data-testid="upload-section">
        <div
          className={`drop-zone ${drag ? "drag" : ""} p-10 md:p-14 text-center`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          role="button"
          data-testid="upload-dropzone"
          style={{ cursor: "pointer" }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
            data-testid="upload-input"
          />
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-sm flex items-center justify-center border"
              style={{ borderColor: "var(--primary)", background: "var(--primary-muted)" }}
            >
              {uploading ? (
                <Loader2 className="animate-spin" style={{ color: "var(--primary)" }} />
              ) : (
                <UploadCloud style={{ color: "var(--primary)" }} />
              )}
            </div>
            <div className="display text-2xl md:text-3xl" style={{ fontWeight: 500 }}>
              {uploading ? "Analyzing your contract…" : "Drop a contract PDF to begin"}
            </div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              or click to browse — we will chunk, index, and prepare it for Q&A, risk scan, and summary.
            </div>
            <span className="chip mono mt-2">PDF · up to ~50 pages recommended</span>
          </div>
        </div>
        {error && (
          <div className="mt-3 text-sm" style={{ color: "var(--risk-high)" }} data-testid="upload-error">
            {error}
          </div>
        )}
      </section>

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

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="card-surface p-10 text-center" data-testid="empty-state">
            <FileText className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <div className="display text-xl">No contracts yet</div>
            <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Upload your first PDF above to unlock Q&A, risk analysis and executive summaries.
            </div>
          </div>
        ) : (
          <div className="grid gap-3 stagger" data-testid="documents-list">
            {docs.map((d) => (
              <div
                key={d.id}
                className="card-surface card-clickable p-5 flex items-center justify-between gap-4"
                onClick={() => navigate(`/documents/${d.id}`)}
                data-testid={`doc-card-${d.id}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                  >
                    <FileText size={18} style={{ color: "var(--primary)" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium" data-testid={`doc-name-${d.id}`}>
                      {d.name}
                    </div>
                    <div className="mono text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {d.pages} page{d.pages === 1 ? "" : "s"} · {Math.round((d.chars || 0) / 1000)}k chars ·{" "}
                      {fmtDate(d.uploaded_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="chip chip-primary">Ready</span>
                  <button
                    className="btn-ghost"
                    onClick={(e) => onDelete(d.id, e)}
                    data-testid={`doc-delete-${d.id}`}
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden card-surface p-8 md:p-12" data-testid="hero">
      <div className="relative z-10 max-w-3xl">
        <div className="mono text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--primary)" }}>
          EzChip · Internship Edition · 2026
        </div>
        <h1 className="display text-4xl md:text-6xl leading-[1.05]" style={{ fontWeight: 500 }}>
          Read contracts like a partner,{" "}
          <span style={{ fontStyle: "italic", color: "var(--primary)" }}>in seconds.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          SmartLegal-AI turns long, dense contracts into answers, risks, and clear executive briefs — grounded by a
          retrieval-augmented GPT-4o pipeline with page-level citations.
        </p>
        <div className="flex flex-wrap gap-4 mt-8">
          <Capability icon={<Sparkles size={14} />} label="Natural Q&A" />
          <Capability icon={<ShieldAlert size={14} />} label="Risk Detection" />
          <Capability icon={<Scale size={14} />} label="Clause Extraction" />
        </div>
      </div>
      <div
        aria-hidden
        className="absolute -right-24 -top-24 w-[480px] h-[480px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,29,72,0.35), rgba(225,29,72,0.08) 55%, transparent 70%)",
        }}
      />
    </section>
  );
}

function Capability({ icon, label }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-sm"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <span style={{ color: "var(--primary)" }}>{icon}</span>
      <span className="mono text-[11px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
