"use client";
// ============================================================
// DataTable — reusable sortable data table
// ============================================================
import React, { useState } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T, i: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyFn: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, data, keyFn, loading, emptyMessage = "No records found.", onRowClick }: Props<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(key: string) {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("asc"); }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const av = (a as Record<string, unknown>)[sortCol];
    const bv = (b as Record<string, unknown>)[sortCol];
    const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="source-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width, cursor: col.sortable ? "pointer" : "default", userSelect: "none" }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}
                {col.sortable && sortCol === col.key && (
                  <span style={{ marginLeft: 4, opacity: 0.6 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    <div style={{
                      height: 14, borderRadius: 4, width: "70%",
                      background: "rgba(255,255,255,0.05)",
                      animation: "pulse-dot 1.4s ease infinite"
                    }} />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-muted)" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={keyFn(row)}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row, i) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
