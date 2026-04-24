import { NavLink, useLocation } from "react-router-dom";
import { FileText, GitCompareArrows, ScrollText } from "lucide-react";

const NAV = [
  { to: "/", label: "Documents", icon: FileText, match: (p) => p === "/", testid: "nav-documents" },
  {
    to: "/compare",
    label: "Compare",
    icon: GitCompareArrows,
    match: (p) => p.startsWith("/compare"),
    testid: "nav-compare",
  },
];

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen" data-testid="app-shell">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8" data-testid="app-main">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}

function AppHeader() {
  const location = useLocation();
  return (
    <header
      className="glass sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 py-4 border-b"
      data-testid="app-header"
    >
      <Brand />
      <nav className="flex items-center gap-1" data-testid="primary-nav">
        {NAV.map((n) => (
          <NavItem key={n.to} item={n} active={n.match(location.pathname)} />
        ))}
      </nav>
    </header>
  );
}

function Brand() {
  return (
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
  );
}

function NavItem({ item, active }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      data-testid={item.testid}
      className={`px-3 py-2 rounded-sm text-sm flex items-center gap-2 transition-all ${
        active ? "text-white" : "text-[color:var(--text-muted)] hover:text-white"
      }`}
      style={
        active
          ? { background: "var(--primary-muted)", border: "1px solid rgba(225,29,72,0.35)" }
          : { border: "1px solid transparent" }
      }
    >
      <Icon size={14} />
      <span className="mono text-[11px] uppercase tracking-widest">{item.label}</span>
    </NavLink>
  );
}

function AppFooter() {
  return (
    <footer
      className="mx-auto max-w-7xl px-6 md:px-10 py-10 mono text-[11px] uppercase tracking-widest flex justify-between"
      style={{ color: "var(--text-dim)" }}
      data-testid="app-footer"
    >
      <span>EzChip Pvt Limited · SmartLegal-AI</span>
      <span>v1.0 · RAG + GPT-4o</span>
    </footer>
  );
}
