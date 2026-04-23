import { NavLink, useLocation } from "react-router-dom";
import { FileText, GitCompareArrows, ScrollText } from "lucide-react";

export default function AppShell({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen" data-testid="app-shell">
      <header
        className="glass sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 py-4 border-b"
        data-testid="app-header"
      >
        <NavLink to="/" className="flex items-center gap-3 group" data-testid="brand-link">
          <div
            className="w-9 h-9 flex items-center justify-center rounded-sm border"
            style={{ borderColor: "var(--primary)", background: "var(--primary-muted)" }}
          >
            <ScrollText size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div className="leading-tight">
            <div className="display text-xl tracking-tight" style={{ fontWeight: 600 }}>
              SmartLegal<span style={{ color: "var(--primary)" }}>-AI</span>
            </div>
            <div className="mono text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Intelligent Contract Analyzer
            </div>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1" data-testid="primary-nav">
          <NavItem to="/" label="Documents" icon={<FileText size={14} />} active={location.pathname === "/"} testid="nav-documents" />
          <NavItem
            to="/compare"
            label="Compare"
            icon={<GitCompareArrows size={14} />}
            active={location.pathname.startsWith("/compare")}
            testid="nav-compare"
          />
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8" data-testid="app-main">
        {children}
      </main>

      <footer
        className="mx-auto max-w-7xl px-6 md:px-10 py-10 mono text-[11px] uppercase tracking-widest flex justify-between"
        style={{ color: "var(--text-dim)" }}
        data-testid="app-footer"
      >
        <span>EzChip Pvt Limited · SmartLegal-AI</span>
        <span>v1.0 · RAG + GPT-4o</span>
      </footer>
    </div>
  );
}

function NavItem({ to, label, icon, active, testid }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
      className={`px-3 py-2 rounded-sm text-sm flex items-center gap-2 transition-all ${
        active ? "text-white" : "text-[color:var(--text-muted)] hover:text-white"
      }`}
      style={active ? { background: "var(--primary-muted)", border: "1px solid rgba(225,29,72,0.35)" } : { border: "1px solid transparent" }}
    >
      {icon}
      <span className="mono text-[11px] uppercase tracking-widest">{label}</span>
    </NavLink>
  );
}
