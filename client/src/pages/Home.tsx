import { ArrowRight, Brain, Layers, Sparkles, Users, ChevronDown, Copy, RefreshCw, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const PERSONALITY_TYPES = [
  { label: "The Architect", color: "#1a1a2e", accent: "#e2c27d", description: "Strategic, visionary, relentlessly curious." },
  { label: "The Empath", color: "#1c2b2b", accent: "#7ecfb3", description: "Deeply feeling, connective, attuned to others." },
  { label: "The Catalyst", color: "#2b1c1c", accent: "#e07d7d", description: "Bold, energetic, born to ignite change." },
  { label: "The Sage", color: "#1e1e2e", accent: "#a89ae8", description: "Reflective, wise, drawn to deeper truths." },
];

const QUESTIONS_PREVIEW = [
  "When you walk into a room full of strangers, you feel...",
  "Your ideal weekend looks like...",
  "When facing a problem, your first instinct is to...",
  "Other people would describe you as...",
];

const SAMPLE_RESULTS = [
  {
    section: "Your Core Type",
    icon: "🧠",
    content: "You lead with intuition and vision. You see the architecture beneath the surface of things — patterns others miss, connections others overlook.",
  },
  {
    section: "Your Strengths",
    icon: "⚡",
    content: "Strategic thinking, long-range planning, systems design. You excel at turning complex problems into elegant solutions.",
  },
  {
    section: "Your Blind Spots",
    icon: "🔍",
    content: "You can underestimate emotional dynamics. Not every problem is a puzzle to be solved — sometimes people just need to be heard.",
  },
  {
    section: "How You Relate",
    icon: "🤝",
    content: "Deep 1:1 bonds over large social groups. You're loyal, direct, and occasionally unintentionally intimidating to those who don't know you yet.",
  },
];

function AnimatedTypewriter({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const target = texts[idx];
    if (typing) {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 38);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 18);
        return () => clearTimeout(t);
      } else {
        setIdx((i) => (i + 1) % texts.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, idx, texts]);

  return (
    <span style={{ fontFamily: "'DM Serif Display', serif" }}>
      {displayed}
      <span className="animate-pulse" style={{ color: "#e2c27d" }}>|</span>
    </span>
  );
}

export default function Home() {
  const [hoveredType, setHoveredType] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0d0d12", color: "#f0ede8", minHeight: "100vh" }}>

      {/* ─── Sticky Nav ─────────────────────────────────────────── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(13,13,18,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 1.25rem",
        height: "52px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <Brain size={17} style={{ color: "#e2c27d", flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", letterSpacing: "0.01em" }}>Persona</span>
        </div>

        <div className="nav-links" style={{ display: "flex", gap: "1.5rem", fontSize: "0.82rem", color: "rgba(240,237,232,0.58)" }}>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>About</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Science</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Results</a>
        </div>

        <button style={{
          borderRadius: "6px",
          border: "1px solid rgba(226,194,125,0.35)",
          color: "#e2c27d",
          background: "transparent",
          fontSize: "0.75rem",
          padding: "0.3rem 0.85rem",
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}>
          Sign In
        </button>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.25rem 3.5rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          background: "rgba(226,194,125,0.08)",
          border: "1px solid rgba(226,194,125,0.2)",
          borderRadius: "100px",
          padding: "0.28rem 0.9rem",
          fontSize: "0.7rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: "#e2c27d",
          marginBottom: "2rem",
        }}>
          <Sparkles size={11} />
          Science-backed · 12 minutes
        </div>

        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(2.2rem, 8vw, 4.6rem)",
          lineHeight: 1.06,
          fontWeight: 400,
          marginBottom: "1.25rem",
          letterSpacing: "-0.01em",
        }}>
          Discover who you<br />
          <span style={{ color: "#e2c27d", fontStyle: "italic" }}>truly</span> are
        </h1>

        <p style={{ fontSize: "clamp(0.92rem, 2.5vw, 1.08rem)", color: "rgba(240,237,232,0.72)", lineHeight: 1.72, maxWidth: "520px", margin: "0 auto 2.5rem" }}>
          A deep, nuanced personality assessment built on decades of psychological research. Not just labels — a mirror.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{
            background: "#e2c27d",
            color: "#0d0d12",
            border: "none",
            borderRadius: "8px",
            padding: "0.82rem 1.75rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Begin Your Assessment <ArrowRight size={15} />
          </button>
          <button style={{
            background: "transparent",
            color: "rgba(240,237,232,0.72)",
            border: "1px solid rgba(240,237,232,0.15)",
            borderRadius: "8px",
            padding: "0.82rem 1.75rem",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            See Sample Results
          </button>
        </div>

        <div style={{ marginTop: "3.5rem", color: "rgba(240,237,232,0.3)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ChevronDown size={18} style={{ animation: "bounce 2s infinite" }} />
        </div>
      </section>

      {/* ─── Typewriter ─────────────────────────────────────────── */}
      <section style={{ padding: "2rem 1.25rem 4rem", textAlign: "center" }}>
        <p style={{ color: "rgba(240,237,232,0.38)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "1rem" }}>
          You'll reflect on things like
        </p>
        <div style={{
          fontSize: "clamp(1.15rem, 3.5vw, 1.65rem)",
          fontFamily: "'DM Serif Display', serif",
          color: "rgba(240,237,232,0.78)",
          minHeight: "2.8rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 1rem",
        }}>
          <AnimatedTypewriter texts={QUESTIONS_PREVIEW} />
        </div>
      </section>

      {/* ─── Personality Cards ──────────────────────────────────── */}
      <section style={{ padding: "3rem 1.25rem 5rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: "rgba(240,237,232,0.38)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "0.7rem" }}>
            16 distinct profiles
          </p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 400 }}>
            Which one are you?
          </h2>
        </div>

        <div className="type-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.85rem" }}>
          {PERSONALITY_TYPES.map((type, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredType(i)}
              onMouseLeave={() => setHoveredType(null)}
              style={{
                background: hoveredType === i ? type.color : "rgba(255,255,255,0.03)",
                border: `1px solid ${hoveredType === i ? type.accent + "55" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "12px",
                padding: "1.5rem 1.25rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: hoveredType === i ? "translateY(-3px)" : "none",
              }}
            >
              <div style={{
                width: "32px", height: "32px",
                borderRadius: "50%",
                background: type.accent + "22",
                border: `2px solid ${type.accent}55`,
                marginBottom: "1rem",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: type.accent }} />
              </div>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "1.05rem",
                fontWeight: 400,
                color: hoveredType === i ? type.accent : "#f0ede8",
                marginBottom: "0.45rem",
                transition: "color 0.3s",
              }}>
                {type.label}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(240,237,232,0.62)", lineHeight: 1.6 }}>
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats Strip ────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "2.25rem 1.25rem" }}>
        <div className="stats-grid" style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", textAlign: "center" }}>
          {[
            { value: "2.4M+", label: "assessments taken" },
            { value: "94%", label: "found it insightful" },
            { value: "12 min", label: "avg completion" },
            { value: "Free", label: "always" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.5rem, 4vw, 2rem)", color: "#e2c27d", marginBottom: "0.25rem" }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(240,237,232,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.25rem 4rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 400, marginBottom: "0.85rem" }}>
            How it works
          </h2>
          <p style={{ color: "rgba(240,237,232,0.62)", fontSize: "0.96rem", maxWidth: "400px", margin: "0 auto" }}>
            Simple, thoughtful, and grounded in real psychology.
          </p>
        </div>

        <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
          {[
            { icon: <Layers size={20} />, step: "01", title: "Answer honestly", body: "60 carefully crafted questions designed to surface your natural tendencies — not what you think you should be." },
            { icon: <Brain size={20} />, step: "02", title: "We analyse deeply", body: "Our model cross-references responses across 5 psychological dimensions to build a nuanced profile." },
            { icon: <Users size={20} />, step: "03", title: "Get your full report", body: "A detailed breakdown of your type, strengths, blind spots, and how you relate to others." },
          ].map((item, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{ color: "#e2c27d", marginBottom: "0.9rem", opacity: 0.9 }}>{item.icon}</div>
              <div style={{
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                color: "rgba(226,194,125,0.45)",
                textTransform: "uppercase" as const,
                marginBottom: "0.5rem",
                fontWeight: 600,
              }}>
                {item.step}
              </div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.1rem", fontWeight: 400, marginBottom: "0.6rem" }}>{item.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "rgba(240,237,232,0.62)", lineHeight: 1.72 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Mid-page CTA ───────────────────────────────────────── */}
      <section style={{ padding: "0 1.25rem 5rem", maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
        <button style={{
          background: "#e2c27d",
          color: "#0d0d12",
          border: "none",
          borderRadius: "8px",
          padding: "0.9rem 2rem",
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          fontFamily: "'DM Sans', sans-serif",
          width: "100%",
          maxWidth: "340px",
          justifyContent: "center",
        }}>
          Take the Free Assessment <ArrowRight size={16} />
        </button>
        <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "rgba(240,237,232,0.4)" }}>No account needed · 12 minutes · Free forever</p>
      </section>

      {/* ─── Sample Results Preview ─────────────────────────────── */}
      <section style={{ padding: "4rem 1.25rem 5rem", maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <p style={{ color: "rgba(240,237,232,0.38)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "0.7rem" }}>
            Sample report
          </p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 400 }}>
            What you'll receive
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {SAMPLE_RESULTS.map((result, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px",
              padding: "1.35rem 1.25rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.55rem" }}>
                    <span style={{ fontSize: "1rem" }}>{result.icon}</span>
                    <span style={{
                      fontSize: "0.68rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                      color: "#e2c27d",
                      fontWeight: 600,
                    }}>
                      {result.section}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "rgba(240,237,232,0.72)", lineHeight: 1.7, margin: 0 }}>
                    {result.content}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, paddingTop: "0.15rem" }}>
                  <button
                    onClick={() => handleCopy(result.content, i)}
                    title="Copy"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      padding: "0.4rem",
                      cursor: "pointer",
                      color: copiedIdx === i ? "#7ecfb3" : "rgba(240,237,232,0.45)",
                      display: "flex",
                      alignItems: "center",
                      transition: "color 0.2s",
                    }}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    title="Regenerate"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      padding: "0.4rem",
                      cursor: "pointer",
                      color: "rgba(240,237,232,0.45)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp / Share CTA after results */}
        <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button style={{
            background: "#25d366",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <MessageCircle size={15} />
            Share on WhatsApp
          </button>
          <button style={{
            background: "#e2c27d",
            color: "#0d0d12",
            border: "none",
            borderRadius: "8px",
            padding: "0.75rem 1.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Get My Full Report <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────── */}
      <section style={{
        margin: "0 1.25rem 2rem",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #1a1510 0%, #0d0d12 50%, #111520 100%)",
        border: "1px solid rgba(226,194,125,0.15)",
        padding: "3.5rem 1.5rem",
        textAlign: "center",
      }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.7rem, 5vw, 2.8rem)", fontWeight: 400, marginBottom: "0.85rem" }}>
          Ready to meet yourself?
        </h2>
        <p style={{ color: "rgba(240,237,232,0.62)", marginBottom: "2rem", fontSize: "0.96rem" }}>
          Free. No signup required to start.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{
            background: "#e2c27d",
            color: "#0d0d12",
            border: "none",
            borderRadius: "8px",
            padding: "0.9rem 2rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Start the Assessment <ArrowRight size={16} />
          </button>
          <button style={{
            background: "#25d366",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.9rem 2rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <MessageCircle size={16} />
            Book Free Consult
          </button>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer style={{ padding: "2.5rem 1.25rem", textAlign: "center", color: "rgba(240,237,232,0.28)", fontSize: "0.78rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", marginBottom: "0.85rem" }}>
          <Brain size={13} style={{ color: "#e2c27d", opacity: 0.5 }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", opacity: 0.5 }}>Persona</span>
        </div>
        <p>© {new Date().getFullYear()} Persona · Privacy · Terms</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }

        /* ── Mobile responsive ── */
        @media (max-width: 640px) {
          .nav-links {
            display: none !important;
          }

          /* 2-col type grid on mobile */
          .type-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.65rem !important;
          }

          /* 2-col stats on mobile */
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem 1rem !important;
          }

          /* single col how-it-works */
          .how-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }

        @media (max-width: 380px) {
          .type-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Desktop type grid ── */
        @media (min-width: 641px) {
          .type-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
