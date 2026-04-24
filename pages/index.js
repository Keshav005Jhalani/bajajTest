import { useState } from "react";
import Head from "next/head";

function TreeNode({ label, children, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = children && Object.keys(children).length > 0;

  return (
    <div className="tree-node" style={{ "--depth": depth }}>
    <div
    className={`node-label ${hasChildren ? "has-children" : "leaf"}`}
    onClick={() => hasChildren && setCollapsed(!collapsed)}
    >
    {hasChildren && (
      <span className="toggle">{collapsed ? "▶" : "▼"}</span>
    )}
    <span className="node-name">{label}</span>
    {!hasChildren && <span className="leaf-badge">leaf</span>}
    </div>

    {!collapsed && hasChildren && (
      <div className="node-children">
      {Object.entries(children).map(([child, grandchildren]) => (
        <TreeNode
        key={child}
        label={child}
        children={grandchildren}
        depth={depth + 1}
        />
      ))}
      </div>
    )}
    </div>
  );
}

function HierarchyCard({ item }) {
  const isCycle = item.has_cycle === true;
  const treeChildren = isCycle ? null : item.tree[item.root];

  return (
    <div className={`card ${isCycle ? "card-cycle" : "card-tree"}`}>
    <div className="card-header">
    <div className="card-title">
    <span className="root-badge">ROOT</span>
    <span className="root-label">{item.root}</span>
    </div>
    <div className="card-meta">
    {isCycle ? (
      <span className="tag tag-cycle">⟳ Cycle</span>
    ) : (
      <span className="tag tag-tree">⎇ Tree · depth {item.depth}</span>
    )}
    </div>
    </div>

    {isCycle ? (
      <div className="cycle-notice">
      Cyclic group detected — no tree structure available.
      </div>
    ) : (
      <div className="tree-wrap">
      <TreeNode label={item.root} children={treeChildren} depth={0} />
      </div>
    )}
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState(
    "A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->"
  );
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setResponse(null);
    setLoading(true);

    const entries = input
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: entries }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setResponse(json);
    } catch (e) {
      setError(e.message || "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <Head>
    <title>BFHL · Node Hierarchy Visualizer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@600;800&display=swap"
    rel="stylesheet"
    />
    </Head>

    <div className="page">
    <header className="header">
    <div className="header-inner">
    <div className="logo">
    <span className="logo-bracket">[</span>
    BFHL
    <span className="logo-bracket">]</span>
    </div>
    <p className="subtitle">Node Hierarchy Visualizer</p>
    </div>
    </header>

    <main className="main">
    <section className="input-section">
    <label className="field-label">
    Enter node edges
    <span className="field-hint">comma or newline separated</span>
    </label>
    <textarea
    className="textarea"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder={"A->B, A->C, B->D\nor one per line"}
    rows={5}
    spellCheck={false}
    />
    <button
    className={`submit-btn ${loading ? "loading" : ""}`}
    onClick={handleSubmit}
    disabled={loading}
    >
    {loading ? (
      <>
      <span className="spinner" /> Processing…
      </>
    ) : (
      "Run →"
    )}
    </button>
    </section>

    {error && (
      <div className="error-box">
      <span className="error-icon">⚠</span> {error}
      </div>
    )}

    {response && (
      <div className="response-section">
      <div className="identity-strip">
      <span>{response.user_id}</span>
      <span className="sep">·</span>
      <span>{response.email_id}</span>
      <span className="sep">·</span>
      <span>{response.college_roll_number}</span>
      </div>

      <div className="summary-row">
      <div className="summary-card">
      <div className="summary-num">{response.summary.total_trees}</div>
      <div className="summary-lbl">Trees</div>
      </div>
      <div className="summary-card">
      <div className="summary-num">{response.summary.total_cycles}</div>
      <div className="summary-lbl">Cycles</div>
      </div>
      <div className="summary-card highlight">
      <div className="summary-num">
      {response.summary.largest_tree_root || "—"}
      </div>
      <div className="summary-lbl">Deepest Root</div>
      </div>
      </div>

      {(response.invalid_entries.length > 0 ||
        response.duplicate_edges.length > 0) && (
          <div className="flags-row">
          {response.invalid_entries.length > 0 && (
            <div className="flag-box flag-invalid">
            <div className="flag-title">Invalid entries</div>
            <div className="flag-items">
            {response.invalid_entries.map((e, i) => (
              <code key={i} className="chip">
              {e || '""'}
              </code>
            ))}
            </div>
            </div>
          )}
          {response.duplicate_edges.length > 0 && (
            <div className="flag-box flag-dupe">
            <div className="flag-title">Duplicate edges</div>
            <div className="flag-items">
            {response.duplicate_edges.map((e, i) => (
              <code key={i} className="chip">
              {e}
              </code>
            ))}
            </div>
            </div>
          )}
          </div>
        )}

        <div className="hierarchies">
        {response.hierarchies.map((h) => (
          <HierarchyCard key={h.root} item={h} />
        ))}
        </div>

        <details className="raw-json">
        <summary>View raw JSON</summary>
        <pre>{JSON.stringify(response, null, 2)}</pre>
        </details>
        </div>
    )}
    </main>

    <footer className="footer">
    Built for SRM Full Stack Engineering Challenge
    </footer>
    </div>

    <style jsx global>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: #0a0a0f;
        --surface: #111118;
        --surface2: #18181f;
        --border: #2a2a35;
        --accent: #7c6ef5;
        --accent2: #f5c56e;
        --text: #e8e8f0;
        --muted: #6b6b80;
        --red: #f56e6e;
        --green: #6ef5a0;
        --font-mono: 'JetBrains Mono', monospace;
        --font-display: 'Syne', sans-serif;
      }
      html, body { background: var(--bg); color: var(--text); font-family: var(--font-mono); min-height: 100vh; }
      .page { display: flex; flex-direction: column; min-height: 100vh; }
      .header { border-bottom: 1px solid var(--border); padding: 20px 0; }
      .header-inner { max-width: 860px; margin: 0 auto; padding: 0 24px; display: flex; align-items: baseline; gap: 16px; }
      .logo { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -1px; }
      .logo-bracket { color: var(--accent); }
      .subtitle { color: var(--muted); font-size: 13px; }
      .main { flex: 1; max-width: 860px; margin: 0 auto; width: 100%; padding: 40px 24px; }
      .input-section { display: flex; flex-direction: column; gap: 12px; }
      .field-label { font-size: 13px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
      .field-hint { color: var(--muted); font-weight: 400; }
      .textarea {
        background: var(--surface); border: 1px solid var(--border); color: var(--text);
        font-family: var(--font-mono); font-size: 13px; padding: 14px 16px; border-radius: 8px;
        resize: vertical; outline: none; transition: border-color 0.15s; line-height: 1.6;
      }
      .textarea:focus { border-color: var(--accent); }
      .submit-btn {
        align-self: flex-start; background: var(--accent); color: #fff;
        border: none; padding: 12px 28px; border-radius: 6px; font-family: var(--font-display);
        font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s, transform 0.1s;
        display: flex; align-items: center; gap: 8px;
      }
      .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .error-box { margin-top: 20px; background: #2a1010; border: 1px solid #5a2020; border-radius: 8px; padding: 14px 18px; color: var(--red); font-size: 13px; }
      .response-section { margin-top: 36px; display: flex; flex-direction: column; gap: 20px; }
      .identity-strip { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: var(--muted); display: flex; gap: 10px; flex-wrap: wrap; }
      .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center; }
      .summary-card.highlight { border-color: var(--accent); background: #16142a; }
      .summary-num { font-family: var(--font-display); font-size: 36px; font-weight: 800; color: var(--text); }
      .summary-card.highlight .summary-num { color: var(--accent); }
      .summary-lbl { font-size: 11px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
      `}</style>
      </>
  );
}
