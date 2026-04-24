import { useNavigate } from "react-router-dom";
import { FileText, Trash2 } from "lucide-react";
import { deleteDocument } from "../lib/api";

const fmtDate = (s) => {
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return s;
  }
};

export default function DocumentsList({ docs, loading, onChange }) {
  const navigate = useNavigate();

  const onDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document and all analyses?")) return;
    await deleteDocument(id);
    onChange?.();
  };

  if (loading) {
    return (
      <div className="grid gap-3" data-testid="documents-list-loading">
        {["s1", "s2", "s3"].map((k) => (
          <div key={k} className="skeleton h-20" />
        ))}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="card-surface p-10 text-center" data-testid="empty-state">
        <FileText className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
        <div className="display text-xl">No contracts yet</div>
        <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Upload your first PDF above to unlock Q&A, risk analysis and executive summaries.
        </div>
      </div>
    );
  }

  return (
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
  );
}
