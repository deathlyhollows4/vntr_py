import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  MessageCircleQuestion,
  ShieldAlert,
  ListChecks,
  FileSignature,
} from "lucide-react";
import { getDocument, reportUrl } from "../lib/api";
import QATab from "../components/QATab";
import RisksTab from "../components/RisksTab";
import ClausesTab from "../components/ClausesTab";
import SummaryTab from "../components/SummaryTab";

const TABS = [
  { id: "qa", label: "Q&A", icon: MessageCircleQuestion, Component: QATab },
  { id: "risks", label: "Risks", icon: ShieldAlert, Component: RisksTab },
  { id: "clauses", label: "Clauses", icon: ListChecks, Component: ClausesTab },
  { id: "summary", label: "Summary", icon: FileSignature, Component: SummaryTab },
];

export default function DocumentViewer() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState("qa");

  useEffect(() => {
    getDocument(id).then(setDoc);
  }, [id]);

  if (!doc) {
    return (
      <div className="space-y-3" data-testid="doc-loading">
        <div className="skeleton h-10 w-1/3" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  const ActiveTab = TABS.find((t) => t.id === tab)?.Component ?? QATab;

  return (
    <div className="space-y-6" data-testid="document-viewer">
      <DocumentHeader doc={doc} />
      <TabBar active={tab} onChange={setTab} />
      <div className="fade-in">
        <ActiveTab docId={doc.id} />
      </div>
    </div>
  );
}

function DocumentHeader({ doc }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Link
          to="/"
          className="mono text-[11px] uppercase tracking-widest flex items-center gap-1.5 hover:text-white"
          style={{ color: "var(--text-muted)" }}
          data-testid="back-link"
        >
          <ArrowLeft size={12} /> All documents
        </Link>
        <h1 className="display text-3xl md:text-4xl mt-2" data-testid="doc-title">
          {doc.name}
        </h1>
        <div className="mono text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
          {doc.pages} pages · {Math.round((doc.chars || 0) / 1000)}k characters
        </div>
      </div>
      <a className="btn-ghost" href={reportUrl(doc.id)} data-testid="download-report-btn" target="_blank" rel="noreferrer">
        <Download size={14} /> Report
      </a>
    </div>
  );
}

function TabBar({ active, onChange }) {
  return (
    <div className="flex items-center gap-6 border-b" data-testid="doc-tabs">
      {TABS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`tab-btn ${active === t.id ? "active" : ""}`}
            data-testid={`tab-${t.id}`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon size={13} /> {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
