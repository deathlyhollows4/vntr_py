import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Loader2, Sparkles, ShieldAlert, Scale } from "lucide-react";
import { uploadDocument } from "../lib/api";

export default function UploadZone({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are supported.");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const doc = await uploadDocument(file);
        onUploaded?.();
        navigate(`/documents/${doc.id}`);
      } catch (e) {
        setError(e?.response?.data?.detail || e?.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [navigate, onUploaded]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <section data-testid="upload-section">
      <div
        className={`drop-zone ${drag ? "drag" : ""} p-10 md:p-14 text-center`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
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
          onChange={(e) => handleFile(e.target.files?.[0])}
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
  );
}

export function Hero() {
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
