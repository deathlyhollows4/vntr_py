import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { askQuestion, getHistory } from "../lib/api";

const SUGGESTIONS = [
  "What are the termination conditions?",
  "What is the liability cap?",
  "Who are the parties and when is the effective date?",
  "Are there any auto-renewal clauses?",
];

export default function QATab({ docId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    getHistory(docId).then((hist) => {
      setMessages(hist.map((h) => ({ role: "assistant", ...h })));
    });
  }, [docId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (q) => {
    const question = (q ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setErr(null);
    setMessages((m) => [...m, { role: "user", question, timestamp: new Date().toISOString() }]);
    setLoading(true);
    try {
      const resp = await askQuestion(docId, question);
      setMessages((m) => [...m, { role: "assistant", ...resp }]);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-6" data-testid="qa-tab">
      <div className="card-surface p-5 flex flex-col min-h-[480px]">
        <div className="flex-1 overflow-y-auto pr-1 space-y-4" data-testid="qa-messages">
          {messages.length === 0 && !loading && (
            <div className="text-sm" style={{ color: "var(--text-muted)" }} data-testid="qa-empty">
              Ask anything in plain English. Answers are grounded in the document and cite page numbers.
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={`${m.role}-${m.id || m.timestamp}-${(m.question || "").slice(0, 20)}`} msg={m} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="spinner" /> SmartLegal-AI is reading the relevant pages…
            </div>
          )}
          <div ref={endRef} />
        </div>
        {err && (
          <div className="text-xs mb-2" style={{ color: "var(--risk-high)" }} data-testid="qa-error">
            {err}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <input
            className="input-field"
            placeholder="Ask a question about this contract…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={loading}
            data-testid="qa-input"
          />
          <button className="btn-primary" onClick={() => send()} disabled={loading} data-testid="qa-send-btn">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Ask
          </button>
        </div>
      </div>

      <aside className="space-y-3" data-testid="qa-suggestions">
        <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Suggestions
        </div>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={loading}
            className="card-surface card-clickable w-full text-left p-3 text-sm"
            data-testid={`suggestion-${s.slice(0, 12)}`}
          >
            {s}
          </button>
        ))}
      </aside>
    </div>
  );
}

function MessageBubble({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] px-4 py-2 rounded-sm"
          style={{ background: "var(--primary-muted)", border: "1px solid rgba(225,29,72,0.3)" }}
        >
          <div className="text-sm">{msg.question}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start" data-testid="qa-answer">
      <div className="max-w-[92%]">
        {msg.question && (
          <div className="mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-dim)" }}>
            Re: {msg.question}
          </div>
        )}
        <div
          className="px-4 py-3 rounded-sm"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
            {renderWithCitations(msg.answer || "")}
          </div>
        </div>
        {msg.citations?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {msg.citations.map((c, idx) => (
              <div
                key={`${c.page}-${(c.quote || "").slice(0, 16)}-${idx}`}
                className="card-surface p-2 text-[11px] max-w-xs"
                style={{ color: "var(--text-muted)" }}
                title={c.quote}
              >
                <span className="citation-tag">Page {c.page}</span>
                <span className="ml-1 line-clamp-2">{c.quote}…</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderWithCitations(text) {
  const parts = text.split(/(\[Page\s+\d+\])/g);
  return parts.map((p, idx) => {
    if (/^\[Page\s+\d+\]$/.test(p)) {
      return (
        <span className="citation-tag" key={`cite-${idx}-${p}`}>
          {p.replace(/[[\]]/g, "")}
        </span>
      );
    }
    return <span key={`txt-${idx}-${p.slice(0, 8)}`}>{p}</span>;
  });
}
