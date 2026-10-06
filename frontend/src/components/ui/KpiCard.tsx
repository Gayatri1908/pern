"use client";
// ============================================================
// KpiCard — summary metric card for dashboard overview
// ============================================================
import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "green" | "warn" | "error" | "muted";
  icon?: React.ReactNode;
  loading?: boolean;
  href?: string;
}

const accentColors: Record<string, string> = {
  blue:  "var(--accent)",
  green: "var(--green)",
  warn:  "var(--warning)",
  error: "var(--error)",
  muted: "rgba(255,255,255,0.2)",
};

export function KpiCard({ label, value, sub, accent = "blue", icon, loading, href }: KpiCardProps) {
  const color = accentColors[accent];
  
  const inner = (
    <div style={{ padding: "20px 20px 20px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{
            fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-muted)", marginBottom: 8
          }}>
            {label}
          </p>
          {loading ? (
            <div style={{
              height: 32, width: 80, borderRadius: 6,
              background: "rgba(255,255,255,0.06)", animation: "pulse-dot 1.4s ease infinite"
            }} />
          ) : (
            <p style={{
              fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)",
              color: "var(--text)", lineHeight: 1.1, letterSpacing: "-0.02em"
            }}>
              {value}
            </p>
          )}
          {sub && !loading && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{sub}</p>
          )}
        </div>
        {icon && (
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${color}14`,
            border: `1px solid ${color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  const style = { "--accent": color } as React.CSSProperties;

  if (href) {
    return (
      <a
        href={href}
        className="source-card stat-card-accent"
        style={{ ...style, display: "block", textDecoration: "none", color: "inherit", cursor: "pointer", transition: "transform 0.2s" }}
        onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "none"}
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="source-card stat-card-accent" style={style}>
      {inner}
    </div>
  );
}
