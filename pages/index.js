import { useState } from "react";
import Head from "next/head";

// ── Recursive tree renderer ──────────────────────────────────────────────────
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

// ── Hierarchy card ───────────────────────────────────────────────────────────
function HierarchyCard({ item, index }) {
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

// ── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState(
    'A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->'
  );
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setResponse(null);
    setLoading(true);

    // Parse comma or newline separated entries
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@600;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="page">
        {/* Header */}
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
          {/* Input section */}
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

          {/* Error */}
          {error && (
            <div className="error-box">
              <span className="error-icon">⚠</span> {error}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="response-section">
              {/* Identity strip */}
              <div className="identity-strip">
                <span>{response.user_id}</span>
                <span className="sep">·</span>
                <span>{response.email_id}</span>
                <span className="sep">·</span>
                <span>{response.college_roll_number}</span>
              </div>

              {/* Summary cards */}
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
                  <div className="summary-num">{response.summary.largest_tree_root || "—"}</div>
                  <div className="summary-lbl">Deepest Root</div>
                </div>
              </div>

              {/* Flags row */}
              {(response.invalid_entries.length > 0 ||
                response.duplicate_edges.length > 0) && (
                <div className="flags-row">
                  {response.invalid_entries.length > 0 && (
                    <div className="flag-box flag-invalid">
                      <div className="flag-title">Invalid entries</div>
                      <div className="flag-items">
                        {response.invalid_entries.map((e, i) => (
                          <code key={i} className="chip">{e || '""'}</code>
                        ))}
                      </div>
                    </div>
                  )}
                  {response.duplicate_edges.length > 0 && (
                    <div className="flag-box flag-dupe">
                      <div className="flag-title">Duplicate edges</div>
                      <div className="flag-items">
                        {response.duplicate_edges.map((e, i) => (
                          <code key={i} className="chip">{e}</code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hierarchy cards */}
              <div className="hierarchies">
                {response.hierarchies.map((h, i) => (
                  <HierarchyCard key={h.root} item={h} index={i} />
                ))}
              </div>

              {/* Raw JSON toggle */}
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

        /* Page layout */
        .page { display: flex; flex-direction: column; min-height: 100vh; }

        /* Header */
        .header { border-bottom: 1px solid var(--border); padding: 20px 0; }
        .header-inner { max-width: 860px; margin: 0 auto; padding: 0 24px; display: flex; align-items: baseline; gap: 16px; }
        .logo { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -1px; }
        .logo-bracket { color: var(--accent); }
        .subtitle { color: var(--muted); font-size: 13px; }

        /* Main */
        .main { flex: 1; max-width: 860px; margin: 0 auto; width: 100%; padding: 40px 24px; }

        /* Input */
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

        /* Error */
        .error-box { margin-top: 20px; background: #2a1010; border: 1px solid #5a2020; border-radius: 8px; padding: 14px 18px; color: var(--red); font-size: 13px; }
        .error-icon { margin-right: 6px; }

        /* Response */
        .response-section { margin-top: 36px; display: flex; flex-direction: column; gap: 20px; }

        .identity-strip { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: var(--muted); display: flex; gap: 10px; flex-wrap: wrap; }
        .sep { color: var(--border); }

        /* Summary */
        .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center; }
        .summary-card.highlight { border-color: var(--accent); background: #16142a; }
        .summary-num { font-family: var(--font-display); font-size: 36px; font-weight: 800; color: var(--text); }
        .summary-card.highlight .summary-num { color: var(--accent); }
        .summary-lbl { font-size: 11px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

        /* Flags */
        .flags-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .flag-box { flex: 1; min-width: 200px; background: var(--surface); border-radius: 8px; padding: 14px 16px; }
        .flag-invalid { border: 1px solid #5a2020; }
        .flag-dupe { border: 1px solid #3a3010; }
        .flag-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
        .flag-items { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { background: #1e1e28; border: 1px solid var(--border); border-radius: 4px; padding: 3px 8px; font-size: 12px; color: var(--accent2); }

        /* Hierarchy cards */
        .hierarchies { display: flex; flex-direction: column; gap: 16px; }
        .card { border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
        .card-tree { background: var(--surface); }
        .card-cycle { background: #140f0f; border-color: #3a1a1a; }

        .card-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border); }
        .card-title { display: flex; align-items: center; gap: 10px; }
        .root-badge { font-size: 10px; background: var(--surface2); border: 1px solid var(--border); color: var(--muted); padding: 2px 7px; border-radius: 4px; letter-spacing: 0.06em; }
        .root-label { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--text); }
        .tag { font-size: 12px; padding: 4px 10px; border-radius: 20px; }
        .tag-tree { background: #0e2a1a; color: var(--green); border: 1px solid #1a4a2a; }
        .tag-cycle { background: #2a0e0e; color: var(--red); border: 1px solid #4a1a1a; }

        .cycle-notice { padding: 20px; color: var(--muted); font-size: 13px; font-style: italic; }
        .tree-wrap { padding: 16px 20px; }

        /* Tree nodes */
        .tree-node { margin-left: calc(var(--depth) * 20px); }
        .node-label {
          display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px;
          margin: 3px 0; border-radius: 6px; font-size: 13px; cursor: default;
          border: 1px solid transparent; transition: background 0.1s;
          background: var(--surface2); border-color: var(--border);
        }
        .node-label.has-children { cursor: pointer; }
        .node-label.has-children:hover { border-color: var(--accent); }
        .toggle { font-size: 9px; color: var(--muted); width: 12px; }
        .node-name { font-weight: 600; color: var(--text); }
        .leaf-badge { font-size: 10px; color: var(--muted); background: var(--surface); border: 1px solid var(--border); padding: 1px 6px; border-radius: 3px; }
        .node-children { border-left: 1px dashed var(--border); margin-left: 18px; padding-left: 4px; }

        /* Raw JSON */
        .raw-json { margin-top: 8px; }
        .raw-json summary { cursor: pointer; font-size: 12px; color: var(--muted); padding: 6px 0; user-select: none; }
        .raw-json summary:hover { color: var(--text); }
        .raw-json pre { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-size: 11px; overflow-x: auto; color: var(--muted); margin-top: 10px; line-height: 1.7; }

        /* Footer */
        .footer { border-top: 1px solid var(--border); text-align: center; padding: 16px; font-size: 11px; color: var(--muted); }

        @media (max-width: 520px) {
          .summary-row { grid-template-columns: 1fr 1fr; }
          .summary-card:last-child { grid-column: span 2; }
        }
      `}</style>
    </>
  );
}
